package com.example.myapplication.ui.complaint

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.myapplication.data.model.ComplaintItem
import com.example.myapplication.data.model.StudentData
import com.example.myapplication.ui.theme.GreenPrimary
import com.example.myapplication.ui.theme.GreenSurface

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherComplaintScreen(navController: NavController) {
    val viewModel: TeacherComplaintViewModel = viewModel()
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var showRaiseDialog by remember { mutableStateOf(false) }
    var selectedTab by remember { mutableIntStateOf(0) }

    LaunchedEffect(uiState.submitSuccess) {
        if (uiState.submitSuccess) {
            showRaiseDialog = false
            viewModel.clearSubmitState()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Complaints", fontWeight = FontWeight.Bold, color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.load() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = GreenPrimary)
            )
        },
        floatingActionButton = {
            if (selectedTab == 0) {
                FloatingActionButton(
                    onClick        = { showRaiseDialog = true },
                    containerColor = GreenPrimary,
                    contentColor   = Color.White
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Raise Complaint")
                }
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(padding)) {

            val tabs = buildList {
                add("My Complaints")
                if (uiState.isClassTeacher) add("Class Complaints")
            }

            TabRow(
                selectedTabIndex = selectedTab,
                containerColor   = MaterialTheme.colorScheme.surface,
                contentColor     = GreenPrimary
            ) {
                tabs.forEachIndexed { idx, title ->
                    Tab(
                        selected = selectedTab == idx,
                        onClick  = { selectedTab = idx },
                        text     = {
                            Text(
                                title,
                                fontSize   = 13.sp,
                                fontWeight = if (selectedTab == idx) FontWeight.SemiBold else FontWeight.Normal
                            )
                        }
                    )
                }
            }

            if (uiState.isLoading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = GreenPrimary)
                }
            } else if (uiState.error != null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(uiState.error!!, color = Color(0xFFDC2626), fontSize = 14.sp)
                }
            } else {
                when (selectedTab) {
                    0 -> MyComplaintsTab(uiState.myComplaints, onDelete = { viewModel.deleteComplaint(it) })
                    1 -> ClassComplaintsTab(uiState.classComplaints)
                }
            }
        }
    }

    if (showRaiseDialog) {
        RaiseComplaintDialog(
            students     = uiState.students,
            isSubmitting = uiState.isSubmitting,
            error        = uiState.submitError,
            onDismiss    = { showRaiseDialog = false; viewModel.clearSubmitState() },
            onSubmit     = { studentId, category, severity, title, description ->
                viewModel.submitComplaint(studentId, category, severity, title, description)
            }
        )
    }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

@Composable
private fun MyComplaintsTab(complaints: List<ComplaintItem>, onDelete: (String) -> Unit) {
    if (complaints.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("📋", fontSize = 48.sp)
                Spacer(Modifier.height(8.dp))
                Text("No complaints raised", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Tap + to raise a complaint", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
            }
        }
    } else {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(complaints) { complaint ->
                ComplaintCard(complaint = complaint, showDelete = complaint.canDelete, onDelete = onDelete)
            }
        }
    }
}

@Composable
private fun ClassComplaintsTab(complaints: List<ComplaintItem>) {
    if (complaints.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("📋", fontSize = 48.sp)
                Spacer(Modifier.height(8.dp))
                Text("No class complaints", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    } else {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(complaints) { complaint ->
                ComplaintCard(complaint = complaint, showDelete = false, onDelete = {})
            }
        }
    }
}

// ── Complaint Card ─────────────────────────────────────────────────────────────

@Composable
private fun ComplaintCard(
    complaint:  ComplaintItem,
    showDelete: Boolean,
    onDelete:   (String) -> Unit
) {
    val (statusColor, statusBg) = complaintStatusColors(complaint.status)
    val severityColor           = severityBadgeColor(complaint.severity)
    val roleColor               = raisedByRoleColor(complaint.raisedByRole)

    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(12.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(modifier = Modifier.height(IntrinsicSize.Min)) {
            Box(
                modifier = Modifier
                    .width(5.dp)
                    .fillMaxHeight()
                    .background(severityColor, RoundedCornerShape(topStart = 12.dp, bottomStart = 12.dp))
            )
            Column(modifier = Modifier.weight(1f).padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        complaint.student?.let { student ->
                            Text(student.name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            student.rollNumber?.let {
                                Text("Roll: $it", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                            }
                        }
                    }
                    Surface(shape = RoundedCornerShape(20.dp), color = statusBg) {
                        Text(
                            complaint.status.replaceFirstChar { it.uppercase() },
                            color      = statusColor,
                            fontSize   = 11.sp,
                            fontWeight = FontWeight.Medium,
                            modifier   = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                    if (showDelete) {
                        Spacer(Modifier.width(6.dp))
                        IconButton(
                            onClick  = { onDelete(complaint.id) },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Delete",
                                tint               = Color(0xFFDC2626),
                                modifier           = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                Spacer(Modifier.height(8.dp))

                Text(complaint.title, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                Spacer(Modifier.height(2.dp))
                Text(complaint.description, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)

                Spacer(Modifier.height(8.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = RoundedCornerShape(20.dp), color = GreenSurface) {
                        Text(
                            formatCategory(complaint.category),
                            color      = GreenPrimary,
                            fontSize   = 11.sp,
                            fontWeight = FontWeight.Medium,
                            modifier   = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                    Surface(shape = RoundedCornerShape(20.dp), color = severityColor.copy(alpha = 0.15f)) {
                        Text(
                            complaint.severity.replaceFirstChar { it.uppercase() },
                            color      = severityColor,
                            fontSize   = 11.sp,
                            fontWeight = FontWeight.Medium,
                            modifier   = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }

                Spacer(Modifier.height(4.dp))

                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Surface(shape = RoundedCornerShape(20.dp), color = roleColor.copy(alpha = 0.12f)) {
                        Text(
                            complaint.raisedByRole.replaceFirstChar { it.uppercase() },
                            color      = roleColor,
                            fontSize   = 10.sp,
                            fontWeight = FontWeight.Medium,
                            modifier   = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                    Text(complaint.raisedByName, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                    Spacer(Modifier.weight(1f))
                    Text(formatDate(complaint.createdAt), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 10.sp)
                }

                if (!complaint.resolvedNote.isNullOrBlank()) {
                    Spacer(Modifier.height(6.dp))
                    Text("Note: ${complaint.resolvedNote}", color = Color(0xFF059669), fontSize = 11.sp)
                }
                if (!complaint.resolvedByName.isNullOrBlank() && complaint.status == "resolved") {
                    Text("Resolved by ${complaint.resolvedByName}", color = Color(0xFF6B7280), fontSize = 11.sp)
                }
            }
        }
    }
}

// ── Raise Complaint Dialog ─────────────────────────────────────────────────────

private val COMPLAINT_CATEGORIES = listOf(
    "misbehavior", "academic", "attendance", "bullying", "property_damage", "other"
)

private val COMPLAINT_SEVERITIES = listOf("low", "medium", "high")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RaiseComplaintDialog(
    students:     List<StudentData>,
    isSubmitting: Boolean,
    error:        String?,
    onDismiss:    () -> Unit,
    onSubmit:     (studentId: String, category: String, severity: String, title: String, description: String) -> Unit
) {
    var selectedStudent  by remember { mutableStateOf<StudentData?>(null) }
    var studentExpanded  by remember { mutableStateOf(false) }
    var selectedCategory by remember { mutableStateOf("") }
    var selectedSeverity by remember { mutableStateOf("low") }
    var title            by remember { mutableStateOf("") }
    var description      by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Raise Complaint", fontWeight = FontWeight.Bold) },
        text  = {
            Column(
                modifier              = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement   = Arrangement.spacedBy(12.dp)
            ) {
                // Student dropdown
                ExposedDropdownMenuBox(
                    expanded         = studentExpanded,
                    onExpandedChange = { studentExpanded = !studentExpanded }
                ) {
                    OutlinedTextField(
                        value         = selectedStudent?.name ?: "",
                        onValueChange = {},
                        readOnly      = true,
                        label         = { Text("Select Student") },
                        trailingIcon  = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = studentExpanded) },
                        modifier      = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        shape         = RoundedCornerShape(10.dp),
                        colors        = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = GreenPrimary,
                            focusedLabelColor  = GreenPrimary
                        )
                    )
                    ExposedDropdownMenu(
                        expanded         = studentExpanded,
                        onDismissRequest = { studentExpanded = false }
                    ) {
                        students.forEach { student ->
                            DropdownMenuItem(
                                text = {
                                    Column {
                                        Text(student.name, fontSize = 14.sp)
                                        student.rollNumber?.let {
                                            Text("Roll: $it", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                    }
                                },
                                onClick = {
                                    selectedStudent = student
                                    studentExpanded = false
                                }
                            )
                        }
                    }
                }

                // Category chips
                Text("Category:", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    COMPLAINT_CATEGORIES.forEach { cat ->
                        FilterChip(
                            selected = selectedCategory == cat,
                            onClick  = { selectedCategory = cat },
                            label    = { Text(cat, fontSize = 12.sp) },
                            colors   = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = GreenSurface,
                                selectedLabelColor     = GreenPrimary
                            )
                        )
                    }
                }

                // Severity chips
                Text("Severity:", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    COMPLAINT_SEVERITIES.forEach { sev ->
                        val sevColor = severityBadgeColor(sev)
                        FilterChip(
                            selected = selectedSeverity == sev,
                            onClick  = { selectedSeverity = sev },
                            label    = { Text(sev.replaceFirstChar { it.uppercase() }, fontSize = 12.sp) },
                            colors   = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = sevColor.copy(alpha = 0.15f),
                                selectedLabelColor     = sevColor
                            )
                        )
                    }
                }

                // Title field
                OutlinedTextField(
                    value         = title,
                    onValueChange = { title = it },
                    label         = { Text("Title *") },
                    modifier      = Modifier.fillMaxWidth(),
                    singleLine    = true,
                    shape         = RoundedCornerShape(10.dp),
                    colors        = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = GreenPrimary,
                        focusedLabelColor  = GreenPrimary
                    )
                )

                // Description field
                OutlinedTextField(
                    value         = description,
                    onValueChange = { description = it },
                    label         = { Text("Description *") },
                    modifier      = Modifier.fillMaxWidth(),
                    minLines      = 3,
                    maxLines      = 5,
                    shape         = RoundedCornerShape(10.dp),
                    colors        = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = GreenPrimary,
                        focusedLabelColor  = GreenPrimary
                    )
                )

                if (error != null) {
                    Text(error, color = Color(0xFFDC2626), fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick  = {
                    val sid = selectedStudent?.id ?: return@Button
                    onSubmit(sid, selectedCategory, selectedSeverity, title, description)
                },
                enabled  = !isSubmitting && selectedStudent != null && selectedCategory.isNotBlank() && title.isNotBlank() && description.isNotBlank(),
                colors   = ButtonDefaults.buttonColors(containerColor = GreenPrimary)
            ) {
                Text(if (isSubmitting) "Submitting…" else "Submit")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

// ── Helper functions ───────────────────────────────────────────────────────────

private fun complaintStatusColors(status: String): Pair<Color, Color> = when (status) {
    "resolved"     -> Pair(Color(0xFF059669), Color(0xFFD1FAE5))
    "acknowledged" -> Pair(Color(0xFF1D4ED8), Color(0xFFDBEAFE))
    else           -> Pair(Color(0xFFD97706), Color(0xFFFEF3C7))   // open / pending
}

private fun severityBadgeColor(severity: String): Color = when (severity.lowercase()) {
    "high"   -> Color(0xFFDC2626)
    "medium" -> Color(0xFFD97706)
    else     -> Color(0xFF64748B)   // low
}

private fun raisedByRoleColor(role: String): Color = when (role.lowercase()) {
    "admin"  -> Color(0xFF7C3AED)   // violet
    "parent" -> Color(0xFFD97706)   // amber
    else     -> Color(0xFF1D4ED8)   // teacher / default → blue
}

private fun formatCategory(raw: String): String =
    raw.replace("_", " ").split(" ").joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }

private fun formatDate(iso: String): String {
    return try {
        val parts = iso.substring(0, 10).split("-")
        "${parts[2]}/${parts[1]}/${parts[0]}"
    } catch (_: Exception) { iso }
}
