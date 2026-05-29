package com.example.myapplication.ui.leave

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.myapplication.data.model.StudentLeaveItem
import com.example.myapplication.data.model.TeacherLeaveItem
import com.example.myapplication.ui.theme.GreenPrimary
import com.example.myapplication.ui.theme.GreenSurface

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherLeaveScreen(navController: NavController) {
    val viewModel: TeacherLeaveViewModel = viewModel()
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var showApplyDialog by remember { mutableStateOf(false) }
    var selectedTab by remember { mutableIntStateOf(0) }

    LaunchedEffect(uiState.submitSuccess) {
        if (uiState.submitSuccess) {
            showApplyDialog = false
            viewModel.clearSubmitState()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Leave Requests", fontWeight = FontWeight.Bold, color = Color.White) },
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
                    onClick           = { showApplyDialog = true },
                    containerColor    = GreenPrimary,
                    contentColor      = Color.White
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Apply for Leave")
                }
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(padding)) {

            val tabs = buildList {
                add("My Leaves")
                if (uiState.isClassTeacher) add("Student Leaves")
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
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(title, fontSize = 13.sp, fontWeight = if (selectedTab == idx) FontWeight.SemiBold else FontWeight.Normal)
                                if (idx == 1) {
                                    val pending = uiState.studentLeaves.count { it.status == "pending" }
                                    if (pending > 0) {
                                        Badge { Text("$pending") }
                                    }
                                }
                            }
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
                    0 -> MyLeavesTab(uiState.myLeaves)
                    1 -> StudentLeavesTab(uiState.studentLeaves, viewModel)
                }
            }
        }
    }

    if (showApplyDialog) {
        ApplyLeaveDialog(
            isSubmitting = uiState.isSubmitting,
            error        = uiState.submitError,
            onDismiss    = { showApplyDialog = false; viewModel.clearSubmitState() },
            onSubmit     = { from, to, reason, type -> viewModel.submitLeave(from, to, reason, type) }
        )
    }
}

@Composable
private fun MyLeavesTab(leaves: List<TeacherLeaveItem>) {
    if (leaves.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("📋", fontSize = 48.sp)
                Spacer(Modifier.height(8.dp))
                Text("No leave requests", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Tap + to apply for leave", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
            }
        }
    } else {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(leaves) { leave -> MyLeaveCard(leave) }
        }
    }
}

@Composable
private fun StudentLeavesTab(leaves: List<StudentLeaveItem>, viewModel: TeacherLeaveViewModel) {
    if (leaves.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("📋", fontSize = 48.sp)
                Spacer(Modifier.height(8.dp))
                Text("No student leave requests", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    } else {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(leaves) { leave -> StudentLeaveCard(leave, viewModel) }
        }
    }
}

@Composable
private fun MyLeaveCard(leave: TeacherLeaveItem) {
    val (statusColor, statusBg) = statusColors(leave.status)
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
                    .background(statusColor, RoundedCornerShape(topStart = 12.dp, bottomStart = 12.dp))
            )
            Column(modifier = Modifier.weight(1f).padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "${formatDate(leave.fromDate)} – ${formatDate(leave.toDate)}",
                        fontWeight = FontWeight.SemiBold,
                        fontSize   = 14.sp,
                        modifier   = Modifier.weight(1f)
                    )
                    Surface(shape = RoundedCornerShape(20.dp), color = statusBg) {
                        Text(leave.status.replaceFirstChar { it.uppercase() }, color = statusColor, fontSize = 11.sp, fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp))
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text(leave.reason, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                Text("Type: ${leave.leaveType.replaceFirstChar { it.uppercase() }}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                if (!leave.rejectionNote.isNullOrBlank()) {
                    Spacer(Modifier.height(4.dp))
                    Text("Note: ${leave.rejectionNote}", color = Color(0xFFDC2626), fontSize = 11.sp)
                }
                if (!leave.resolvedByName.isNullOrBlank() && leave.status != "pending") {
                    Spacer(Modifier.height(2.dp))
                    val verb = if (leave.status == "approved") "Approved" else "Rejected"
                    Text("$verb by ${leave.resolvedByName}", color = Color(0xFF6B7280), fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
private fun StudentLeaveCard(leave: StudentLeaveItem, viewModel: TeacherLeaveViewModel) {
    val (statusColor, statusBg) = statusColors(leave.status)
    var showRejectDialog by remember { mutableStateOf(false) }

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
                    .background(statusColor, RoundedCornerShape(topStart = 12.dp, bottomStart = 12.dp))
            )
            Column(modifier = Modifier.weight(1f).padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(leave.student?.name ?: "Unknown", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        leave.student?.rollNumber?.let { Text("Roll: $it", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp) }
                    }
                    Surface(shape = RoundedCornerShape(20.dp), color = statusBg) {
                        Text(leave.status.replaceFirstChar { it.uppercase() }, color = statusColor, fontSize = 11.sp, fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp))
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text("${formatDate(leave.fromDate)} – ${formatDate(leave.toDate)}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                Text(leave.reason, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                if (!leave.rejectionNote.isNullOrBlank()) {
                    Text("Note: ${leave.rejectionNote}", color = Color(0xFFDC2626), fontSize = 11.sp)
                }
                if (!leave.resolvedByName.isNullOrBlank() && leave.status != "pending") {
                    val verb = if (leave.status == "approved") "Approved" else "Rejected"
                    Text("$verb by ${leave.resolvedByName}", color = Color(0xFF6B7280), fontSize = 11.sp)
                }
                if (leave.status == "pending") {
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick  = { viewModel.resolveStudentLeave(leave.id, "approve") },
                            modifier = Modifier.weight(1f),
                            shape    = RoundedCornerShape(8.dp),
                            colors   = ButtonDefaults.buttonColors(containerColor = GreenPrimary)
                        ) { Text("Approve", fontSize = 13.sp) }
                        OutlinedButton(
                            onClick  = { showRejectDialog = true },
                            modifier = Modifier.weight(1f),
                            shape    = RoundedCornerShape(8.dp),
                            colors   = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFDC2626))
                        ) { Text("Reject", fontSize = 13.sp) }
                    }
                }
            }
        }
    }

    if (showRejectDialog) {
        var note by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showRejectDialog = false },
            title            = { Text("Reject Leave") },
            text             = {
                Column {
                    Text("Add a note (optional):")
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value         = note,
                        onValueChange = { note = it },
                        modifier      = Modifier.fillMaxWidth(),
                        placeholder   = { Text("Reason for rejection") },
                        maxLines      = 3
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.resolveStudentLeave(leave.id, "reject", note)
                    showRejectDialog = false
                }) { Text("Reject", color = Color(0xFFDC2626)) }
            },
            dismissButton = {
                TextButton(onClick = { showRejectDialog = false }) { Text("Cancel") }
            }
        )
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
        value = value, onValueChange = {}, readOnly = true,
        label = { Text(label) }, placeholder = { Text("Tap to pick a date") }, singleLine = true,
        trailingIcon = {
            IconButton(onClick = {
                val dialog = android.app.DatePickerDialog(context, { _, year, month, day ->
                    onDateSelected("%04d-%02d-%02d".format(year, month + 1, day))
                }, calendar.get(java.util.Calendar.YEAR), calendar.get(java.util.Calendar.MONTH), calendar.get(java.util.Calendar.DAY_OF_MONTH))
                if (minDateMillis != null) dialog.datePicker.minDate = minDateMillis
                dialog.show()
            }) { Icon(Icons.Default.CalendarMonth, contentDescription = "Pick date", tint = GreenPrimary) }
        },
        modifier = modifier, shape = RoundedCornerShape(10.dp),
        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = GreenPrimary, focusedLabelColor = GreenPrimary)
    )
}

@Composable
private fun ApplyLeaveDialog(
    isSubmitting: Boolean,
    error:        String?,
    onDismiss:    () -> Unit,
    onSubmit:     (from: String, to: String, reason: String, type: String) -> Unit
) {
    var fromDate  by remember { mutableStateOf("") }
    var toDate    by remember { mutableStateOf("") }
    var reason    by remember { mutableStateOf("") }
    var leaveType by remember { mutableStateOf("casual") }

    val tomorrow = remember { System.currentTimeMillis() + 86_400_000L }
    val fromMillis = remember(fromDate) {
        if (fromDate.isNotEmpty()) {
            try { java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).parse(fromDate)?.time ?: tomorrow }
            catch (_: Exception) { tomorrow }
        } else tomorrow
    }
    // Auto-clear toDate if it falls before the newly selected fromDate
    LaunchedEffect(fromDate) {
        if (fromDate.isNotEmpty() && toDate.isNotEmpty() && toDate < fromDate) toDate = ""
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title            = { Text("Apply for Leave", fontWeight = FontWeight.Bold) },
        text             = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                DatePickerField(
                    label          = "From Date",
                    value          = fromDate,
                    onDateSelected = { fromDate = it },
                    modifier       = Modifier.fillMaxWidth(),
                    minDateMillis  = tomorrow
                )
                DatePickerField(
                    label          = "To Date",
                    value          = toDate,
                    onDateSelected = { toDate = it },
                    modifier       = Modifier.fillMaxWidth(),
                    minDateMillis  = fromMillis
                )
                OutlinedTextField(
                    value         = reason,
                    onValueChange = { reason = it },
                    label         = { Text("Reason") },
                    modifier      = Modifier.fillMaxWidth(),
                    maxLines      = 3
                )
                Text("Leave Type:", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("casual", "sick", "personal").forEach { type ->
                        FilterChip(
                            selected = leaveType == type,
                            onClick  = { leaveType = type },
                            label    = { Text(type.replaceFirstChar { it.uppercase() }, fontSize = 12.sp) },
                            colors   = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = GreenSurface,
                                selectedLabelColor     = GreenPrimary
                            )
                        )
                    }
                }
                if (error != null) Text(error, color = Color(0xFFDC2626), fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(
                onClick  = { onSubmit(fromDate, toDate, reason, leaveType) },
                enabled  = !isSubmitting,
                colors   = ButtonDefaults.buttonColors(containerColor = GreenPrimary)
            ) { Text(if (isSubmitting) "Submitting…" else "Submit") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

private fun statusColors(status: String): Pair<Color, Color> = when (status) {
    "approved" -> Pair(Color(0xFF059669), Color(0xFFD1FAE5))
    "rejected" -> Pair(Color(0xFFDC2626), Color(0xFFFEE2E2))
    else       -> Pair(Color(0xFFD97706), Color(0xFFFEF3C7))
}

private fun formatDate(iso: String): String {
    return try {
        val parts = iso.substring(0, 10).split("-")
        "${parts[2]}/${parts[1]}/${parts[0]}"
    } catch (_: Exception) { iso }
}
