package com.example.myapplication.ui.exam

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.example.myapplication.data.model.ExamItem
import com.example.myapplication.ui.theme.GreenDark
import com.example.myapplication.ui.theme.GreenPrimary
import com.example.myapplication.ui.theme.GreenSurface

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExamListScreen(
    navController: NavController,
    viewModel: ExamViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Exams", fontWeight = FontWeight.Bold, color = Color.White) },
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
                    text = uiState.error!!,
                    color = Color(0xFFDC2626),
                    modifier = Modifier.align(Alignment.Center).padding(24.dp)
                )

                uiState.exams.isEmpty() -> Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("📝", fontSize = 48.sp)
                    Spacer(Modifier.height(12.dp))
                    Text("No exams scheduled yet", color = GreenDark, fontWeight = FontWeight.Medium)
                }

                else -> LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.exams, key = { it.id }) { exam ->
                        ExamCard(
                            exam         = exam,
                            onEnterMarks = { navController.navigate("marks/${exam.id}") },
                            onViewResults = { navController.navigate("results/${exam.id}") }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ExamCard(exam: ExamItem, onEnterMarks: () -> Unit, onViewResults: () -> Unit) {
    val (statusText, statusColor, statusBg) = when {
        exam.isPublished  -> Triple("Published",     Color(0xFF059669), Color(0xFFD1FAE5))
        exam.marksEntered -> Triple("Marks Entered", Color(0xFF2563EB), Color(0xFFDBEAFE))
        else              -> Triple("Pending Marks", Color(0xFFD97706), Color(0xFFFEF3C7))
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
                    .background(statusColor, RoundedCornerShape(topStart = 14.dp, bottomStart = 14.dp))
            )
            Column(modifier = Modifier.weight(1f).padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(exam.name, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = GreenDark)
                        Text(exam.classInfo.fullName, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    }
                    val (examTypeLabel, examTypeBg, examTypeColor) = when (exam.type) {
                        "annual"      -> Triple("Annual",      Color(0xFFDDD6FE), Color(0xFF7C3AED))
                        "half_yearly" -> Triple("Half Yearly", Color(0xFFFDE68A), Color(0xFF92400E))
                        "quarterly"   -> Triple("Quarterly",   Color(0xFFBFDBFE), Color(0xFF1D4ED8))
                        "pre_board"   -> Triple("Pre Board",   Color(0xFFFFEDD5), Color(0xFFEA580C))
                        else          -> Triple("Unit Test",   GreenSurface,      GreenPrimary)
                    }
                    Surface(shape = RoundedCornerShape(8.dp), color = examTypeBg) {
                        Text(
                            text       = examTypeLabel,
                            color      = examTypeColor,
                            fontSize   = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier   = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }

                Spacer(Modifier.height(10.dp))

                Text(
                    text     = exam.subjects.joinToString("  ·  ") { "${it.name} (${it.maxMarks})" },
                    fontSize = 12.sp,
                    color    = Color(0xFF475569)
                )

                if (!exam.examDate.isNullOrBlank()) {
                    Spacer(Modifier.height(4.dp))
                    Text("📅 ${exam.examDate}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }

                Spacer(Modifier.height(12.dp))

                Row(
                    modifier              = Modifier.fillMaxWidth(),
                    verticalAlignment     = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Surface(shape = RoundedCornerShape(20.dp), color = statusBg) {
                        Text(
                            text       = statusText,
                            color      = statusColor,
                            fontSize   = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier   = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (exam.canViewResults) {
                            OutlinedButton(
                                onClick        = onViewResults,
                                shape          = RoundedCornerShape(10.dp),
                                colors         = ButtonDefaults.outlinedButtonColors(contentColor = GreenPrimary),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                            ) { Text("View Results", fontSize = 13.sp) }
                        }
                        if (exam.canEnterMarks) {
                            Button(
                                onClick        = onEnterMarks,
                                shape          = RoundedCornerShape(10.dp),
                                colors         = ButtonDefaults.buttonColors(containerColor = GreenPrimary),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                            ) {
                                Text(if (exam.marksEntered) "Edit Marks" else "Enter Marks", fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
