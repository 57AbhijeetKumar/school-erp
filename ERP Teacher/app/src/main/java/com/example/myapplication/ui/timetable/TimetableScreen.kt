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
import com.example.myapplication.data.model.PeriodItem
import com.example.myapplication.ui.theme.GreenPrimary
import com.example.myapplication.ui.theme.GreenSurface

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimetableScreen(navController: NavController) {
    val viewModel: TimetableViewModel = viewModel()
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    val title = if (uiState.timetable?.type == "personal") "My Teaching Schedule" else "Timetable"

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title, fontWeight = FontWeight.Bold, color = Color.White) },
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
                uiState.isLoading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = GreenPrimary)

                uiState.error != null -> Column(
                    modifier = Modifier.align(Alignment.Center).padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(uiState.error!!, color = Color(0xFFDC2626), fontSize = 14.sp)
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = { viewModel.load() }, colors = ButtonDefaults.buttonColors(containerColor = GreenPrimary)) {
                        Text("Retry")
                    }
                }

                uiState.timetable == null -> Column(
                    modifier = Modifier.align(Alignment.Center).padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("📅", fontSize = 48.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("No timetable set yet", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("Ask admin to configure the school timetable.", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                }

                uiState.timetable!!.schedule.isEmpty() -> Column(
                    modifier = Modifier.align(Alignment.Center).padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("📅", fontSize = 48.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("No periods assigned yet", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("Your name hasn't been assigned to any periods.", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                }

                else -> {
                    val isPersonal = uiState.timetable!!.type == "personal"
                    Column(modifier = Modifier.fillMaxSize()) {
                        if (!isPersonal && !uiState.timetable!!.className.isNullOrBlank()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(GreenSurface)
                                    .padding(horizontal = 16.dp, vertical = 10.dp)
                            ) {
                                Text(
                                    "Class: ${uiState.timetable!!.className}",
                                    fontWeight = FontWeight.SemiBold,
                                    color      = GreenPrimary,
                                    fontSize   = 14.sp
                                )
                            }
                        }
                        LazyColumn(
                            contentPadding      = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(uiState.timetable!!.schedule) { daySchedule ->
                                DayCard(daySchedule, isPersonal)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DayCard(daySchedule: DaySchedule, isPersonal: Boolean = false) {
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
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
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
                            // Personal schedule: show class name; class timetable: show teacher name
                            val subtitle = if (isPersonal) period.className else period.teacherName
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
