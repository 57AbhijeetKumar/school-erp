package com.example.myapplication.ui.exam

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.myapplication.ui.theme.GreenDark
import com.example.myapplication.ui.theme.GreenPrimary
import com.example.myapplication.ui.theme.GreenSurface

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MarksEntryScreen(
    examId: String,
    navController: NavController,
    viewModel: MarksEntryViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(examId) { viewModel.loadExam(examId) }
    LaunchedEffect(uiState.saveSuccess) {
        if (uiState.saveSuccess) snackbarHostState.showSnackbar("Marks saved successfully!")
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            uiState.exam?.name ?: "Enter Marks",
                            fontWeight = FontWeight.Bold, color = Color.White, fontSize = 17.sp
                        )
                        uiState.exam?.let {
                            Text(
                                it.subjects.joinToString(" · ") { s -> s.name },
                                color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp
                            )
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
        },
        bottomBar = {
            if (!uiState.isLoading && uiState.students.isNotEmpty()) {
                Surface(shadowElevation = 8.dp) {
                    Button(
                        onClick  = { viewModel.saveMarks(examId) },
                        enabled  = !uiState.isSaving,
                        modifier = Modifier.fillMaxWidth().padding(16.dp).height(52.dp),
                        shape    = RoundedCornerShape(14.dp),
                        colors   = ButtonDefaults.buttonColors(containerColor = GreenPrimary)
                    ) {
                        if (uiState.isSaving) {
                            CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                        } else {
                            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Save Marks", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
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
                    uiState.error!!,
                    color = Color(0xFFDC2626),
                    modifier = Modifier.align(Alignment.Center).padding(24.dp)
                )
                else -> {
                    val exam = uiState.exam
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Header: subject max marks legend
                        if (exam != null) {
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape    = RoundedCornerShape(12.dp),
                                    colors   = CardDefaults.cardColors(containerColor = GreenSurface)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                                    ) {
                                        exam.subjects.forEach { sub ->
                                            Text(
                                                text = "${sub.name}: /${sub.maxMarks}",
                                                fontSize = 12.sp,
                                                color = GreenDark,
                                                fontWeight = FontWeight.Medium
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        items(uiState.students, key = { it.studentId }) { student ->
                            StudentMarksCard(
                                student  = student,
                                subjects = exam?.subjects ?: emptyList(),
                                onMarkChanged = { subject, value ->
                                    viewModel.updateMark(student.studentId, subject, value)
                                }
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
private fun StudentMarksCard(
    student:       StudentMarksState,
    subjects:      List<com.example.myapplication.data.model.ExamSubject>,
    onMarkChanged: (subject: String, value: String) -> Unit
) {
    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(14.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier         = Modifier.size(36.dp).background(GreenSurface, RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        student.rollNumber ?: "—",
                        color = GreenPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp
                    )
                }
                Spacer(Modifier.width(10.dp))
                Text(student.name, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, color = GreenDark)
            }

            Spacer(Modifier.height(10.dp))

            subjects.forEach { sub ->
                val currentValue = student.marks[sub.name] ?: ""
                Row(
                    modifier          = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text     = sub.name,
                        modifier = Modifier.weight(1f),
                        fontSize = 13.sp,
                        color    = Color(0xFF475569)
                    )
                    OutlinedTextField(
                        value         = currentValue,
                        onValueChange = { v ->
                            // Only allow numbers up to maxMarks
                            val num = v.filter { it.isDigit() }
                            if (num.isEmpty() || (num.toIntOrNull() ?: 0) <= sub.maxMarks) {
                                onMarkChanged(sub.name, num)
                            }
                        },
                        modifier      = Modifier.width(80.dp),
                        singleLine    = true,
                        placeholder   = { Text("0", fontSize = 13.sp) },
                        suffix        = { Text("/${sub.maxMarks}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        shape         = RoundedCornerShape(10.dp),
                        colors        = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = GreenPrimary,
                            focusedLabelColor  = GreenPrimary,
                            cursorColor        = GreenPrimary
                        ),
                        textStyle = LocalTextStyle.current.copy(fontSize = 14.sp)
                    )
                }
            }
        }
    }
}
