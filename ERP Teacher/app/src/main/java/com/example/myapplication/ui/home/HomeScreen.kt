package com.example.myapplication.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.EventAvailable
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.myapplication.ui.theme.GreenDark
import com.example.myapplication.ui.theme.GreenPrimary
import com.example.myapplication.ui.theme.GreenSurface

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    navController: NavController,
    viewModel: HomeViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Refresh student list whenever this screen resumes (e.g. after a student is deleted from admin)
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) viewModel.loadMyClass()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // Auto-logout when account is deactivated by admin
    LaunchedEffect(uiState.sessionExpired) {
        if (uiState.sessionExpired) {
            navController.navigate("role_select") { popUpTo(0) { inclusive = true } }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("School ERP", fontWeight = FontWeight.Bold, color = Color.White) },
                actions = {
                    IconButton(onClick = { viewModel.loadMyClass() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color.White)
                    }
                    IconButton(onClick = {
                        viewModel.logout()
                        navController.navigate("role_select") { popUpTo(0) { inclusive = true } }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Logout", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = GreenPrimary)
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.verticalGradient(listOf(GreenPrimary.copy(alpha = 0.15f), MaterialTheme.colorScheme.background)))
                .padding(paddingValues),
        ) {
            // Slim progress bar during background refresh — non-blocking
            if (uiState.isRefreshing) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth(),
                    color    = GreenPrimary,
                    trackColor = GreenPrimary.copy(alpha = 0.2f)
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
            // ── Greeting card ──────────────────────────────────────────────────
            Card(
                modifier  = Modifier.fillMaxWidth(),
                shape     = RoundedCornerShape(16.dp),
                colors    = CardDefaults.cardColors(containerColor = GreenPrimary),
                elevation = CardDefaults.cardElevation(4.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("Welcome back,", color = Color.White.copy(alpha = 0.85f), fontSize = 14.sp)
                    Text(
                        text       = uiState.teacherName,
                        color      = Color.White,
                        fontSize   = 22.sp,
                        fontWeight = FontWeight.Bold
                    )
                    if (uiState.isClassTeacher && uiState.classInfo != null) {
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text     = "Class Teacher · ${uiState.classInfo!!.fullName}",
                            color    = Color.White.copy(alpha = 0.85f),
                            fontSize = 13.sp
                        )
                    }
                }
            }

            // ── Loading / error state ──────────────────────────────────────────
            if (uiState.isLoading) {
                Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = GreenPrimary)
                }
            } else if (uiState.error != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape    = RoundedCornerShape(12.dp),
                    colors   = CardDefaults.cardColors(containerColor = Color(0xFFFEE2E2))
                ) {
                    Text(
                        text     = uiState.error!!,
                        color    = Color(0xFFDC2626),
                        modifier = Modifier.padding(16.dp),
                        fontSize = 14.sp
                    )
                }
            } else {
                // ── My Class section — only shown for class teachers ───────────
                if (uiState.isClassTeacher && uiState.classInfo != null) {
                    SectionTitle("My Class")
                    ClassCard(
                        className        = uiState.classInfo!!.fullName,
                        studentCount     = uiState.students.size,
                        onViewStudents   = { navController.navigate("students") },
                        onMarkAttendance = { navController.navigate("attendance") }
                    )
                }

                // ── Homework — always visible for every teacher ────────────────
                SectionTitle("Homework")
                QuickCard(
                    icon     = Icons.Default.MenuBook,
                    title    = "My Homework",
                    subtitle = "View and assign homework",
                    onClick  = { navController.navigate("homework") }
                )

                // ── Exams — always visible for every teacher ───────────────────
                SectionTitle("Exams")
                QuickCard(
                    icon     = Icons.Default.School,
                    title    = "Exams & Results",
                    subtitle = "View exams · Enter marks",
                    onClick  = { navController.navigate("exams") }
                )

                // ── Notice Board ───────────────────────────────────────────────
                SectionTitle("Notices")
                QuickCard(
                    icon     = Icons.Default.Campaign,
                    title    = "Notice Board",
                    subtitle = "View school announcements",
                    onClick  = { navController.navigate("notices") }
                )

                // ── Timetable ──────────────────────────────────────────────────
                SectionTitle("Schedule")
                QuickCard(
                    icon     = Icons.Default.CalendarMonth,
                    title    = "Timetable",
                    subtitle = "View class schedule",
                    onClick  = { navController.navigate("timetable") }
                )

                // ── Leave ──────────────────────────────────────────────────────
                SectionTitle("Leave")
                QuickCard(
                    icon     = Icons.Default.EventAvailable,
                    title    = "Leave Requests",
                    subtitle = "Apply for leave · Manage student leaves",
                    onClick  = { navController.navigate("leaves") }
                )

                // ── Complaints ─────────────────────────────────────────────────
                SectionTitle("Complaints")
                QuickCard(
                    icon     = Icons.Default.ErrorOutline,
                    title    = "Complaints",
                    subtitle = "Raise or view complaints about students",
                    onClick  = { navController.navigate("complaints") }
                )
            }
            } // inner Column
        } // outer Column
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(text = text, fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = GreenDark)
}

@Composable
private fun QuickCard(
    icon:     ImageVector,
    title:    String,
    subtitle: String,
    onClick:  () -> Unit
) {
    Card(
        onClick   = onClick,
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(14.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(
            modifier          = Modifier.padding(18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier            = Modifier.size(48.dp).background(GreenSurface, RoundedCornerShape(12.dp)),
                contentAlignment    = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = GreenPrimary, modifier = Modifier.size(26.dp))
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, color = GreenDark)
                Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
            }
            Text("›", fontSize = 22.sp, color = GreenPrimary, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ClassCard(
    className:        String,
    studentCount:     Int,
    onViewStudents:   () -> Unit,
    onMarkAttendance: () -> Unit
) {
    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(16.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier         = Modifier.size(56.dp).background(GreenSurface, RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Groups, contentDescription = null, tint = GreenPrimary, modifier = Modifier.size(32.dp))
                }
                Spacer(Modifier.width(16.dp))
                Column {
                    Text(className, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = GreenDark)
                    Text("$studentCount Students enrolled", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                }
            }
            Spacer(Modifier.height(14.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(
                    onClick  = onViewStudents,
                    modifier = Modifier.weight(1f),
                    shape    = RoundedCornerShape(10.dp),
                    colors   = ButtonDefaults.outlinedButtonColors(contentColor = GreenPrimary)
                ) { Text("View Students", fontSize = 13.sp) }

                Button(
                    onClick  = onMarkAttendance,
                    modifier = Modifier.weight(1f),
                    shape    = RoundedCornerShape(10.dp),
                    colors   = ButtonDefaults.buttonColors(containerColor = GreenPrimary)
                ) { Text("Attendance", fontSize = 13.sp) }
            }
        }
    }
}
