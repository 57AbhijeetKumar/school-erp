package com.example.myapplication.ui.exam

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.myapplication.data.model.StudentExamResult
import com.example.myapplication.ui.theme.GreenDark
import com.example.myapplication.ui.theme.GreenPrimary
import com.example.myapplication.ui.theme.GreenSurface

private val gradeColor = mapOf(
    "A+" to (Color(0xFF059669) to Color(0xFFD1FAE5)),
    "A"  to (Color(0xFF16A34A) to Color(0xFFDCFCE7)),
    "B"  to (Color(0xFF2563EB) to Color(0xFFDBEAFE)),
    "C"  to (Color(0xFFD97706) to Color(0xFFFEF3C7)),
    "D"  to (Color(0xFFEA580C) to Color(0xFFFFEDD5)),
    "F"  to (Color(0xFFDC2626) to Color(0xFFFEE2E2)),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExamResultsScreen(
    examId:       String,
    navController: NavController,
    viewModel:    ExamResultsViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(examId) { viewModel.load(examId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            uiState.data?.exam?.name ?: "Results",
                            fontWeight = FontWeight.Bold, color = Color.White, fontSize = 17.sp
                        )
                        uiState.data?.exam?.let { exam ->
                            val status = if (exam.isPublished) "Published" else "Preview (not published)"
                            Text(status, color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
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

                uiState.error != null -> Column(
                    modifier = Modifier.align(Alignment.Center).padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("📊", fontSize = 48.sp)
                    Spacer(Modifier.height(12.dp))
                    Text(uiState.error!!, color = Color(0xFFDC2626), textAlign = TextAlign.Center)
                }

                uiState.data != null -> {
                    val data     = uiState.data!!
                    val subjects = data.exam.subjects

                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Summary card
                        item {
                            Card(
                                modifier  = Modifier.fillMaxWidth(),
                                shape     = RoundedCornerShape(12.dp),
                                colors    = CardDefaults.cardColors(containerColor = GreenSurface)
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp).fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column {
                                        Text("Total Students", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                                        Text("${data.results.size}", fontWeight = FontWeight.Bold, color = GreenDark, fontSize = 20.sp)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("Passed", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                                        Text(
                                            "${data.results.count { it.grade != "F" }}",
                                            fontWeight = FontWeight.Bold, color = Color(0xFF16A34A), fontSize = 20.sp
                                        )
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("Failed", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                                        Text(
                                            "${data.results.count { it.grade == "F" }}",
                                            fontWeight = FontWeight.Bold, color = Color(0xFFDC2626), fontSize = 20.sp
                                        )
                                    }
                                }
                            }
                        }

                        // Student result cards
                        items(data.results, key = { it.studentId }) { result ->
                            StudentResultCard(result = result, subjects = subjects.map { it.name })
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StudentResultCard(
    result:   StudentExamResult,
    subjects: List<String>
) {
    val (textColor, bgColor) = gradeColor[result.grade] ?: (Color.Gray to Color(0xFFF1F5F9))

    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(14.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Header row: name + grade
            Row(
                modifier          = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier         = Modifier.size(36.dp).background(GreenSurface, RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        result.rollNumber ?: "—",
                        color = GreenPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp
                    )
                }
                Spacer(Modifier.width(10.dp))
                Text(
                    result.name,
                    fontWeight = FontWeight.SemiBold, fontSize = 15.sp,
                    color = GreenDark, modifier = Modifier.weight(1f)
                )
                // Grade badge
                Surface(shape = RoundedCornerShape(20.dp), color = bgColor) {
                    Text(
                        result.grade,
                        color = textColor, fontWeight = FontWeight.Bold, fontSize = 14.sp,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(Modifier.height(10.dp))
            HorizontalDivider(color = Color(0xFFF1F5F9))
            Spacer(Modifier.height(10.dp))

            // Subject marks — horizontal scroll if many subjects
            Row(modifier = Modifier.horizontalScroll(rememberScrollState())) {
                result.marks.forEach { m ->
                    Column(
                        modifier            = Modifier.padding(end = 20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(m.subject, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 10.sp)
                        Text(
                            "${m.obtained}/${m.maxMarks}",
                            fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = GreenDark
                        )
                    }
                }
            }

            Spacer(Modifier.height(10.dp))
            HorizontalDivider(color = Color(0xFFF1F5F9))
            Spacer(Modifier.height(8.dp))

            // Total row
            Row(
                modifier              = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    "Total: ${result.totalObtained}/${result.totalMax}",
                    fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = GreenDark
                )
                Text(
                    "${result.percentage}%",
                    fontWeight = FontWeight.Bold, fontSize = 13.sp, color = textColor
                )
            }
        }
    }
}
