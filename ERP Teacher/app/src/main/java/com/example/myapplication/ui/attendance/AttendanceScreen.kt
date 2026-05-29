package com.example.myapplication.ui.attendance

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
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
import com.example.myapplication.data.model.AttendanceRecord
import com.example.myapplication.ui.theme.GreenDark
import com.example.myapplication.ui.theme.GreenPrimary
import com.example.myapplication.ui.theme.GreenSurface

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceScreen(
    navController: NavController,
    viewModel: AttendanceViewModel = viewModel()
) {
    val uiState     by viewModel.uiState.collectAsStateWithLifecycle()
    val displayDate by viewModel.displayDate.collectAsStateWithLifecycle()

    // Show snackbar on save success
    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(uiState.saveSuccess) {
        if (uiState.saveSuccess) snackbarHostState.showSnackbar("Attendance saved!")
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Text("Mark Attendance", fontWeight = FontWeight.Bold, color = Color.White)
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = GreenPrimary)
            )
        },
        bottomBar = {
            if (!uiState.isLoading && uiState.records.isNotEmpty()) {
                Surface(shadowElevation = 8.dp) {
                    Button(
                        onClick   = { viewModel.saveAttendance() },
                        enabled   = !uiState.isSaving,
                        modifier  = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .height(52.dp),
                        shape     = RoundedCornerShape(14.dp),
                        colors    = ButtonDefaults.buttonColors(containerColor = GreenPrimary)
                    ) {
                        if (uiState.isSaving) {
                            CircularProgressIndicator(
                                color       = Color.White,
                                strokeWidth = 2.dp,
                                modifier    = Modifier.size(22.dp)
                            )
                        } else {
                            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text       = if (uiState.isMarked) "Update Attendance" else "Save Attendance",
                                fontSize   = 16.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }
    ) { paddingValues ->

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
        ) {

            // Date navigation bar
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(onClick = { viewModel.goToPreviousDay() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Previous day", tint = GreenPrimary)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text       = displayDate,
                            fontWeight = FontWeight.SemiBold,
                            color      = GreenDark,
                            fontSize   = 15.sp
                        )
                        if (uiState.isMarked) {
                            Text(
                                text     = "✓ Already marked",
                                color    = GreenPrimary,
                                fontSize = 11.sp
                            )
                        }
                    }
                    val atToday = viewModel.isToday()
                    IconButton(
                        onClick  = { viewModel.goToNextDay() },
                        enabled  = !atToday
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = "Next day",
                            tint = if (atToday) Color.LightGray else GreenPrimary
                        )
                    }
                }
            }

            when {
                uiState.isLoading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = GreenPrimary)
                    }
                }

                uiState.error != null -> {
                    Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                        Text(uiState.error!!, color = Color(0xFFDC2626))
                    }
                }

                uiState.records.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No students in this class", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                else -> {
                    // Stats + Mark All row
                    val presentCount = uiState.records.count { it.status == "present" }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text  = "Present: $presentCount / ${uiState.records.size}",
                            color = GreenDark,
                            fontWeight = FontWeight.Medium,
                            fontSize = 14.sp
                        )
                        TextButton(onClick = { viewModel.markAllPresent() }) {
                            Text("Mark All Present", color = GreenPrimary, fontSize = 13.sp)
                        }
                    }

                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.records, key = { it.studentId }) { record ->
                            StudentAttendanceRow(
                                record    = record,
                                onSetStatus = { status -> viewModel.setStatus(record.studentId, status) }
                            )
                        }
                        item { Spacer(Modifier.height(8.dp)) }
                    }
                }
            }
        }
    }
}

@Composable
private fun StudentAttendanceRow(record: AttendanceRecord, onSetStatus: (String) -> Unit) {
    val accentColor = when (record.status) {
        "present" -> Color(0xFF10B981)
        "late"    -> Color(0xFFF59E0B)
        else      -> Color(0xFFEF4444)
    }

    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(12.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Row(modifier = Modifier.height(IntrinsicSize.Min)) {
            Box(
                modifier = Modifier
                    .width(5.dp)
                    .fillMaxHeight()
                    .background(accentColor, RoundedCornerShape(topStart = 12.dp, bottomStart = 12.dp))
            )
            Row(
                modifier          = Modifier.weight(1f).padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier         = Modifier.size(38.dp).background(GreenSurface, RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text       = record.rollNumber ?: "—",
                        color      = GreenPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize   = 13.sp
                    )
                }
                Spacer(Modifier.width(12.dp))
                Text(
                    text       = record.name,
                    modifier   = Modifier.weight(1f),
                    fontWeight = FontWeight.Medium,
                    fontSize   = 15.sp,
                    color      = GreenDark
                )
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    FilterChip(
                        selected = record.status == "present",
                        onClick  = { onSetStatus("present") },
                        label    = { Text("P", fontSize = 12.sp) },
                        colors   = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = GreenPrimary,
                            selectedLabelColor     = Color.White
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                    FilterChip(
                        selected = record.status == "absent",
                        onClick  = { onSetStatus("absent") },
                        label    = { Text("A", fontSize = 12.sp) },
                        colors   = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFFEF4444),
                            selectedLabelColor     = Color.White
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                    FilterChip(
                        selected = record.status == "late",
                        onClick  = { onSetStatus("late") },
                        label    = { Text("L", fontSize = 12.sp) },
                        colors   = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFFF59E0B),
                            selectedLabelColor     = Color.White
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }
        }
    }
}
