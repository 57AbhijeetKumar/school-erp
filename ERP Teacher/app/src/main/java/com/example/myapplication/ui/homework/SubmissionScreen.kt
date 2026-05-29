package com.example.myapplication.ui.homework

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.example.myapplication.data.model.SubmissionRecord
import com.example.myapplication.ui.theme.GreenDark
import com.example.myapplication.ui.theme.GreenPrimary
import com.example.myapplication.ui.theme.GreenSurface

private val STATUSES = listOf(
    "submitted"     to "Submitted",
    "not_submitted" to "Not Submitted",
    "late"          to "Late"
)

private fun statusColors(status: String): Pair<Color, Color> = when (status) {
    "submitted"     -> Color(0xFF059669) to Color(0xFFD1FAE5)
    "late"          -> Color(0xFFDC2626) to Color(0xFFFEE2E2)
    else            -> Color(0xFFD97706) to Color(0xFFFEF3C7)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmissionScreen(
    homeworkId: String,
    navController: NavController,
    viewModel: SubmissionViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(homeworkId) { viewModel.load(homeworkId) }

    LaunchedEffect(uiState.saveSuccess) {
        if (uiState.saveSuccess) { snackbar.showSnackbar("Saved!"); viewModel.clearSaveSuccess() }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(uiState.title.ifBlank { "Submissions" }, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 17.sp)
                        if (!uiState.canMark) Text("View Only", color = Color.White.copy(alpha = 0.75f), fontSize = 11.sp)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = GreenPrimary)
            )
        },
        bottomBar = {
            if (uiState.canMark && uiState.students.isNotEmpty()) {
                Surface(shadowElevation = 8.dp) {
                    Button(
                        onClick  = { viewModel.save() },
                        enabled  = !uiState.isSaving,
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
                        shape    = RoundedCornerShape(12.dp),
                        colors   = ButtonDefaults.buttonColors(containerColor = GreenPrimary)
                    ) {
                        if (uiState.isSaving) CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                        else Text("Save Submissions", fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(padding)
        ) {
            when {
                uiState.isLoading -> CircularProgressIndicator(color = GreenPrimary, modifier = Modifier.align(Alignment.Center))

                uiState.error != null -> Text(uiState.error!!, color = Color(0xFFDC2626), modifier = Modifier.align(Alignment.Center).padding(24.dp))

                uiState.students.isEmpty() -> Column(modifier = Modifier.align(Alignment.Center), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("📋", fontSize = 48.sp)
                    Spacer(Modifier.height(12.dp))
                    Text("No students in this class", color = GreenDark, fontWeight = FontWeight.Medium)
                }

                else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {

                    // Summary card
                    item {
                        Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = GreenSurface)) {
                            Row(modifier = Modifier.padding(14.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                SummaryItem("Total",     "${uiState.students.size}",                                    Color(0xFF374151))
                                SummaryItem("Submitted", "${uiState.students.count { it.status == "submitted" }}",     Color(0xFF059669))
                                SummaryItem("Pending",   "${uiState.students.count { it.status == "not_submitted" }}", Color(0xFFD97706))
                                SummaryItem("Late",      "${uiState.students.count { it.status == "late" }}",          Color(0xFFDC2626))
                            }
                        }
                    }

                    items(uiState.students, key = { it.studentId }) { record ->
                        StudentCard(record = record, canMark = uiState.canMark,
                            onStatusChange = { viewModel.updateStatus(record.studentId, it) },
                            onRemarkChange = { viewModel.updateRemark(record.studentId, it) })
                    }

                    item { Spacer(Modifier.height(8.dp)) }
                }
            }
        }
    }
}

@Composable
private fun SummaryItem(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
        Text(value, fontWeight = FontWeight.Bold, color = color, fontSize = 18.sp)
    }
}

@Composable
private fun StudentCard(
    record: SubmissionRecord,
    canMark: Boolean,
    onStatusChange: (String) -> Unit,
    onRemarkChange: (String) -> Unit
) {
    val (textColor, bgColor) = statusColors(record.status)

    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface), elevation = CardDefaults.cardElevation(2.dp)) {
        Column(modifier = Modifier.padding(14.dp)) {

            // Name row
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(36.dp).background(GreenSurface, RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) {
                    Text(record.rollNumber ?: "—", color = GreenPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
                Spacer(Modifier.width(10.dp))
                Text(record.name, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, color = GreenDark, modifier = Modifier.weight(1f))
                if (!canMark) {
                    Surface(shape = RoundedCornerShape(20.dp), color = bgColor) {
                        Text(
                            STATUSES.firstOrNull { it.first == record.status }?.second ?: record.status,
                            color = textColor, fontWeight = FontWeight.SemiBold, fontSize = 11.sp,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            if (canMark) {
                Spacer(Modifier.height(10.dp))
                // Status chips
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    STATUSES.forEach { (value, label) ->
                        val (sc, sb) = statusColors(value)
                        FilterChip(
                            selected = record.status == value,
                            onClick  = { onStatusChange(value) },
                            label    = { Text(label, fontSize = 11.sp) },
                            colors   = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = sb, selectedLabelColor = sc,
                                containerColor = Color(0xFFF8FAFC), labelColor = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value         = record.remark,
                    onValueChange = onRemarkChange,
                    label         = { Text("Remark (optional)", fontSize = 12.sp) },
                    singleLine    = true,
                    modifier      = Modifier.fillMaxWidth(),
                    shape         = RoundedCornerShape(10.dp),
                    colors        = OutlinedTextFieldDefaults.colors(focusedBorderColor = GreenPrimary, focusedLabelColor = GreenPrimary)
                )
            } else if (record.remark.isNotBlank()) {
                Spacer(Modifier.height(6.dp))
                Text("Remark: ${record.remark}", fontSize = 12.sp, color = Color(0xFF475569))
            }
        }
    }
}
