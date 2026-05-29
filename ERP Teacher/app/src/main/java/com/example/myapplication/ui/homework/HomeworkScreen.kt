package com.example.myapplication.ui.homework

import android.Manifest
import android.app.DownloadManager
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.widget.Toast
import androidx.core.content.ContextCompat
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.myapplication.data.model.ClassData
import com.example.myapplication.data.model.HomeworkItem
import com.example.myapplication.ui.theme.GreenDark
import com.example.myapplication.ui.theme.GreenPrimary
import com.example.myapplication.ui.theme.GreenSurface

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeworkScreen(
    navController: NavController,
    viewModel: HomeworkViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    val imageLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetMultipleContents()
    ) { uris -> if (uris.isNotEmpty()) viewModel.addFiles(uris) }

    val pdfLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenMultipleDocuments()
    ) { uris -> if (uris.isNotEmpty()) viewModel.addFiles(uris) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Homework", fontWeight = FontWeight.Bold, color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = GreenPrimary)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick        = { viewModel.openAddDialog() },
                containerColor = GreenPrimary,
                contentColor   = Color.White,
                shape          = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Homework")
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(padding)
        ) {
            when {
                uiState.isLoading -> CircularProgressIndicator(
                    color = GreenPrimary, modifier = Modifier.align(Alignment.Center)
                )

                uiState.error != null -> Text(
                    text     = uiState.error!!,
                    color    = Color(0xFFDC2626),
                    modifier = Modifier.align(Alignment.Center).padding(24.dp)
                )

                uiState.homeworkList.isEmpty() -> Column(
                    modifier            = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("📚", fontSize = 48.sp)
                    Spacer(Modifier.height(12.dp))
                    Text("No homework yet", color = GreenDark, fontWeight = FontWeight.Medium)
                    Text("Tap + to assign homework", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                }

                else -> LazyColumn(
                    contentPadding      = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(uiState.homeworkList, key = { it.id }) { hw ->
                        HomeworkCard(
                            item              = hw,
                            onDelete          = if (hw.isMyHomework) ({ viewModel.deleteHomework(hw.id) }) else null,
                            onViewSubmissions = { navController.navigate("submission/${hw.id}") }
                        )
                    }
                    item { Spacer(Modifier.height(72.dp)) }
                }
            }
        }
    }

    if (uiState.showAddDialog) {
        AddHomeworkDialog(
            classes          = uiState.classes,
            subjects         = uiState.subjects,
            defaultSubject   = viewModel.teacherSubject ?: "",
            isSubmitting     = uiState.isSubmitting,
            error            = uiState.addError,
            selectedFileUris = uiState.selectedFileUris,
            onAddImages      = { imageLauncher.launch("image/*") },
            onAddPdfs        = { pdfLauncher.launch(arrayOf("application/pdf")) },
            onRemoveFile     = { viewModel.removeFile(it) },
            onDismiss        = { viewModel.closeAddDialog() },
            onSubmit         = { classId, title, subject, desc, due ->
                viewModel.addHomework(classId, title, subject, desc, due)
            }
        )
    }
}

@Composable
private fun HomeworkCard(
    item: HomeworkItem,
    onDelete: (() -> Unit)?,
    onViewSubmissions: () -> Unit
) {
    val context = LocalContext.current

    var pendingAtt by remember { mutableStateOf<com.example.myapplication.data.model.AttachmentItem?>(null) }

    fun startDownload(att: com.example.myapplication.data.model.AttachmentItem) {
        val request = DownloadManager.Request(Uri.parse(att.url)).apply {
            setTitle(att.name)
            setDescription("Downloading…")
            setMimeType(if (att.type == "pdf") "application/pdf" else "image/*")
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, att.name)
            setAllowedOverMetered(true)
            setAllowedOverRoaming(true)
        }
        context.getSystemService(DownloadManager::class.java).enqueue(request)
        Toast.makeText(context, "Downloading ${att.name}…", Toast.LENGTH_SHORT).show()
    }

    val permLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) pendingAtt?.let { startDownload(it) }
        else Toast.makeText(context, "Storage permission required to download files", Toast.LENGTH_LONG).show()
        pendingAtt = null
    }

    fun tryDownload(att: com.example.myapplication.data.model.AttachmentItem) {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.WRITE_EXTERNAL_STORAGE)
            != PackageManager.PERMISSION_GRANTED) {
            pendingAtt = att
            permLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        } else {
            startDownload(att)
        }
    }

    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(14.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(modifier = Modifier.height(IntrinsicSize.Min)) {
            Box(
                modifier = Modifier
                    .width(5.dp)
                    .fillMaxHeight()
                    .background(
                        if (item.isMyHomework) GreenPrimary else Color(0xFF6366F1),
                        RoundedCornerShape(topStart = 14.dp, bottomStart = 14.dp)
                    )
            )
            Column(modifier = Modifier.weight(1f).padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(item.title, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = GreenDark)
                        Spacer(Modifier.height(2.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Chip(item.classInfo.fullName)
                            if (!item.subject.isNullOrBlank()) Chip(item.subject)
                        }
                    }
                    if (onDelete != null) {
                        var confirmDelete by remember { mutableStateOf(false) }
                        if (confirmDelete) {
                            IconButton(onClick = { onDelete(); confirmDelete = false }) {
                                Icon(Icons.Default.Delete, contentDescription = "Confirm Delete", tint = Color(0xFFEF4444))
                            }
                        } else {
                            IconButton(onClick = { confirmDelete = true }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }

                Spacer(Modifier.height(8.dp))
                Text(item.description, fontSize = 13.sp, color = Color(0xFF475569))

                Spacer(Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("By ${item.assignedBy.name}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (!item.dueDate.isNullOrBlank()) {
                        Text("Due: ${item.dueDate}", fontSize = 11.sp, color = GreenPrimary, fontWeight = FontWeight.Medium)
                    }
                }

                if (item.attachments.isNotEmpty()) {
                    Spacer(Modifier.height(6.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        item.attachments.forEach { att ->
                            val emoji = if (att.type == "pdf") "📄" else "🖼️"
                            TextButton(
                                onClick        = { tryDownload(att) },
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text     = "$emoji ${att.name}",
                                    fontSize = 12.sp,
                                    color    = GreenPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }

                Spacer(Modifier.height(10.dp))
                OutlinedButton(
                    onClick        = onViewSubmissions,
                    modifier       = Modifier.fillMaxWidth(),
                    shape          = RoundedCornerShape(10.dp),
                    colors         = ButtonDefaults.outlinedButtonColors(contentColor = GreenPrimary),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text(
                        text     = if (item.isMyHomework) "Mark Submissions" else "View Submissions",
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun Chip(label: String) {
    Box(modifier = Modifier.background(GreenSurface, RoundedCornerShape(6.dp))) {
        Text(label, color = GreenDark, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp))
    }
}

@Composable
private fun rememberFileName(uri: Uri): String {
    val context = LocalContext.current
    return remember(uri) {
        var name = "file"
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val col = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (col >= 0) name = cursor.getString(col)
            }
        }
        name
    }
}

@Composable
private fun DatePickerField(
    label: String,
    value: String,
    onDateSelected: (String) -> Unit,
    modifier: Modifier = Modifier,
    minDateMillis: Long? = null
) {
    val context  = LocalContext.current
    val calendar = java.util.Calendar.getInstance()
    OutlinedTextField(
        value          = value,
        onValueChange  = {},
        readOnly       = true,
        label          = { Text(label) },
        placeholder    = { Text("Tap to pick a date") },
        singleLine     = true,
        trailingIcon   = {
            IconButton(onClick = {
                val dialog = android.app.DatePickerDialog(
                    context,
                    { _, year, month, day ->
                        onDateSelected("%04d-%02d-%02d".format(year, month + 1, day))
                    },
                    calendar.get(java.util.Calendar.YEAR),
                    calendar.get(java.util.Calendar.MONTH),
                    calendar.get(java.util.Calendar.DAY_OF_MONTH)
                )
                if (minDateMillis != null) dialog.datePicker.minDate = minDateMillis
                dialog.show()
            }) {
                Icon(Icons.Default.CalendarMonth, contentDescription = "Pick date", tint = GreenPrimary)
            }
        },
        modifier = modifier,
        shape    = RoundedCornerShape(10.dp),
        colors   = OutlinedTextFieldDefaults.colors(focusedBorderColor = GreenPrimary, focusedLabelColor = GreenPrimary)
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddHomeworkDialog(
    classes: List<ClassData>,
    subjects: List<com.example.myapplication.data.model.SubjectItem>,
    defaultSubject: String,
    isSubmitting: Boolean,
    error: String?,
    selectedFileUris: List<Uri>,
    onAddImages: () -> Unit,
    onAddPdfs: () -> Unit,
    onRemoveFile: (Uri) -> Unit,
    onDismiss: () -> Unit,
    onSubmit: (classId: String, title: String, subject: String, desc: String, due: String) -> Unit
) {
    var selectedClass   by remember { mutableStateOf(classes.firstOrNull()) }
    var expanded        by remember { mutableStateOf(false) }
    var subjectExpanded by remember { mutableStateOf(false) }
    var title           by remember { mutableStateOf("") }
    var subject         by remember { mutableStateOf(defaultSubject) }
    var description     by remember { mutableStateOf("") }
    var dueDate         by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = { if (!isSubmitting) onDismiss() },
        title  = { Text("Assign Homework", fontWeight = FontWeight.Bold, color = GreenDark) },
        text   = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                    OutlinedTextField(
                        value         = selectedClass?.fullName ?: "Select class",
                        onValueChange = {},
                        readOnly      = true,
                        label         = { Text("Class") },
                        trailingIcon  = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                        modifier      = Modifier.menuAnchor().fillMaxWidth(),
                        shape         = RoundedCornerShape(10.dp),
                        colors        = OutlinedTextFieldDefaults.colors(focusedBorderColor = GreenPrimary, focusedLabelColor = GreenPrimary)
                    )
                    ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        classes.forEach { cls ->
                            DropdownMenuItem(text = { Text(cls.fullName) }, onClick = { selectedClass = cls; expanded = false })
                        }
                    }
                }
                OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Title *") }, singleLine = true, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp), colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = GreenPrimary, focusedLabelColor = GreenPrimary))
                if (subjects.isNotEmpty()) {
                    ExposedDropdownMenuBox(expanded = subjectExpanded, onExpandedChange = { subjectExpanded = !subjectExpanded }) {
                        OutlinedTextField(
                            value         = subject.ifBlank { "Select subject" },
                            onValueChange = {},
                            readOnly      = true,
                            label         = { Text("Subject") },
                            trailingIcon  = { ExposedDropdownMenuDefaults.TrailingIcon(subjectExpanded) },
                            modifier      = Modifier.menuAnchor().fillMaxWidth(),
                            shape         = RoundedCornerShape(10.dp),
                            colors        = OutlinedTextFieldDefaults.colors(focusedBorderColor = GreenPrimary, focusedLabelColor = GreenPrimary)
                        )
                        ExposedDropdownMenu(expanded = subjectExpanded, onDismissRequest = { subjectExpanded = false }) {
                            DropdownMenuItem(text = { Text("— None —") }, onClick = { subject = ""; subjectExpanded = false })
                            subjects.forEach { s ->
                                DropdownMenuItem(
                                    text    = { Text(if (s.code != null) "${s.name} (${s.code})" else s.name) },
                                    onClick = { subject = s.name; subjectExpanded = false }
                                )
                            }
                        }
                    }
                } else {
                    OutlinedTextField(value = subject, onValueChange = { subject = it }, label = { Text("Subject") }, singleLine = true, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp), colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = GreenPrimary, focusedLabelColor = GreenPrimary))
                }
                OutlinedTextField(value = description, onValueChange = { description = it }, label = { Text("Description *") }, minLines = 3, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp), colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = GreenPrimary, focusedLabelColor = GreenPrimary))
                DatePickerField(
                    label          = "Due Date (optional)",
                    value          = dueDate,
                    onDateSelected = { dueDate = it },
                    modifier       = Modifier.fillMaxWidth(),
                    minDateMillis  = System.currentTimeMillis()
                )

                val canAddMore = selectedFileUris.size < 5
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick        = onAddImages,
                        enabled        = canAddMore && !isSubmitting,
                        shape          = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier       = Modifier.weight(1f)
                    ) { Text("🖼️ Images", fontSize = 12.sp) }
                    OutlinedButton(
                        onClick        = onAddPdfs,
                        enabled        = canAddMore && !isSubmitting,
                        shape          = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier       = Modifier.weight(1f)
                    ) { Text("📄 PDF", fontSize = 12.sp) }
                }

                if (selectedFileUris.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        selectedFileUris.forEach { uri ->
                            val name = rememberFileName(uri)
                            Row(
                                modifier          = Modifier
                                    .fillMaxWidth()
                                    .background(GreenSurface, RoundedCornerShape(8.dp))
                                    .padding(start = 10.dp, end = 4.dp, top = 4.dp, bottom = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text     = name,
                                    fontSize = 12.sp,
                                    color    = GreenDark,
                                    modifier = Modifier.weight(1f),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                IconButton(
                                    onClick  = { onRemoveFile(uri) },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(Icons.Default.Close, contentDescription = "Remove", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }

                Text("Up to 5 files (images or PDF)", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

                if (error != null) Text(error, color = Color(0xFFDC2626), fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(selectedClass?.id ?: "", title, subject, description, dueDate) }, enabled = !isSubmitting, shape = RoundedCornerShape(10.dp), colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary)) {
                if (isSubmitting) CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                else Text("Assign")
            }
        },
        dismissButton = { TextButton(onClick = { if (!isSubmitting) onDismiss() }) { Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant) } },
        shape = RoundedCornerShape(16.dp)
    )
}
