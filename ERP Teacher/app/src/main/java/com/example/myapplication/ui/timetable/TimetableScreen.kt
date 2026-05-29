package com.example.myapplication.ui.timetable

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
import com.example.myapplication.data.model.DaySchedule
import com.example.myapplication.data.model.SubstitutionItem
import com.example.myapplication.ui.theme.GreenPrimary
import com.example.myapplication.ui.theme.GreenSurface

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimetableScreen(navController: NavController) {
    val viewModel: TimetableViewModel = viewModel()
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // 0 = My Schedule, 1 = Class Timetable
    var selectedTab by remember { mutableIntStateOf(0) }
    val hasClassTab = uiState.timetable?.classTimetable != null

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Timetable", fontWeight = FontWeight.Bold, color = Color.White) },
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
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when {
                uiState.isLoading -> CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = GreenPrimary
                )

                uiState.error != null -> Column(
                    modifier = Modifier.align(Alignment.Center).padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(uiState.error!!, color = Color(0xFFDC2626), fontSize = 14.sp)
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = { viewModel.load() },
                        colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary)
                    ) { Text("Retry") }
                }

                uiState.timetable == null -> EmptyState("No timetable set yet", "Ask admin to configure the school timetable.")

                else -> {
                    Column(modifier = Modifier.fillMaxSize()) {

                        // Tabs — only show if this teacher is also a class teacher
                        if (hasClassTab) {
                            TabRow(
                                selectedTabIndex = selectedTab,
                                containerColor   = GreenPrimary,
                                contentColor     = Color.White
                            ) {
                                Tab(
                                    selected = selectedTab == 0,
                                    onClick  = { selectedTab = 0 },
                                    text     = { Text("My Schedule", fontSize = 13.sp, fontWeight = FontWeight.SemiBold) }
                                )
                                Tab(
                                    selected = selectedTab == 1,
                                    onClick  = { selectedTab = 1 },
                                    text     = { Text("Class Timetable", fontSize = 13.sp, fontWeight = FontWeight.SemiBold) }
                                )
                            }
                        }

                        when {
                            // ── My Schedule tab (or only view for subject teachers) ──
                            selectedTab == 0 || !hasClassTab -> {
                                val schedule = uiState.timetable!!.mySchedule
                                if (schedule.isEmpty() && uiState.substitutions.isEmpty()) {
                                    EmptyState(
                                        "No periods assigned yet",
                                        "Your name hasn't been assigned to any periods."
                                    )
                                } else {
                                    ScheduleList(
                                        schedule      = schedule,
                                        substitutions = uiState.substitutions,
                                        showClassName = true
                                    )
                                }
                            }

                            // ── Class Timetable tab ──
                            else -> {
                                val ct = uiState.timetable!!.classTimetable!!
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(GreenSurface)
                                        .padding(horizontal = 16.dp, vertical = 10.dp)
                                ) {
                                    Text(
                                        "Class: ${ct.className}",
                                        fontWeight = FontWeight.SemiBold,
                                        color      = GreenPrimary,
                                        fontSize   = 14.sp
                                    )
                                }
                                if (ct.schedule.isEmpty()) {
                                    EmptyState("No timetable set", "Admin hasn't added periods for this class yet.")
                                } else {
                                    ScheduleList(schedule = ct.schedule, substitutions = emptyList(), showClassName = false)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ScheduleList(
    schedule:      List<DaySchedule>,
    substitutions: List<SubstitutionItem>,
    showClassName: Boolean
) {
    LazyColumn(
        contentPadding      = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Extra duty banner — shown at the very top of My Schedule
        if (substitutions.isNotEmpty()) {
            item {
                ExtraDutyCard(substitutions)
            }
        }
        items(schedule) { daySchedule ->
            DayCard(daySchedule, showClassName)
        }
    }
}

@Composable
private fun ExtraDutyCard(substitutions: List<SubstitutionItem>) {
    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(12.dp),
        colors    = CardDefaults.cardColors(containerColor = Color(0xFFFFF7ED)),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFFFEDD5), RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
                    .padding(horizontal = 16.dp, vertical = 10.dp)
            ) {
                Text(
                    "Extra Duty Today",
                    fontWeight = FontWeight.Bold,
                    fontSize   = 14.sp,
                    color      = Color(0xFFEA580C)
                )
            }
            substitutions.forEachIndexed { idx, sub ->
                if (idx > 0) HorizontalDivider(color = Color(0xFFFED7AA))
                Row(
                    modifier          = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier         = Modifier.size(32.dp).background(Color(0xFFFFEDD5), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("${sub.periodNumber}", fontWeight = FontWeight.Bold, color = Color(0xFFEA580C), fontSize = 12.sp)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(sub.subject, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        Text(
                            "${sub.className} · covering ${sub.absentTeacherName}",
                            color    = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 12.sp
                        )
                    }
                    if (sub.startTime.isNotBlank() && sub.endTime.isNotBlank()) {
                        Text(
                            "${sub.startTime} – ${sub.endTime}",
                            color    = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyState(title: String, subtitle: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            modifier            = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("📅", fontSize = 48.sp)
            Spacer(Modifier.height(8.dp))
            Text(title, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
        }
    }
}

@Composable
private fun DayCard(daySchedule: DaySchedule, showClassName: Boolean) {
    val activePeriods = daySchedule.periods.filter { it.subject.isNotBlank() }

    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(12.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(GreenSurface, RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
                    .padding(horizontal = 16.dp, vertical = 10.dp)
            ) {
                Text(daySchedule.day, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = GreenPrimary)
            }

            if (activePeriods.isEmpty()) {
                Text(
                    "No periods scheduled",
                    color    = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(16.dp)
                )
            } else {
                activePeriods.forEachIndexed { idx, period ->
                    if (idx > 0) HorizontalDivider(color = Color(0xFFF1F5F9))
                    Row(
                        modifier          = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier         = Modifier.size(32.dp).background(GreenSurface, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("${period.periodNumber}", fontWeight = FontWeight.Bold, color = GreenPrimary, fontSize = 12.sp)
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(period.subject, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            val subtitle = if (showClassName) period.className else period.teacherName
                            if (!subtitle.isNullOrBlank()) {
                                Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                            }
                        }
                        if (period.startTime.isNotBlank() && period.endTime.isNotBlank()) {
                            Text(
                                "${period.startTime} – ${period.endTime}",
                                color    = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
