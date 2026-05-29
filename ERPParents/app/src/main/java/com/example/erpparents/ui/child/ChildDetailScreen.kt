package com.example.erpparents.ui.child

import android.Manifest
import android.app.DatePickerDialog
import android.app.DownloadManager
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.BeachAccess
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Report
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.erpparents.data.model.*
import com.example.erpparents.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChildDetailScreen(
    studentId:    String,
    studentName:  String,
    navController: NavController,
    viewModel: ChildDetailViewModel = viewModel()
) {
    LaunchedEffect(studentId) { viewModel.init(studentId) }

    data class TabItem(val label: String, val icon: ImageVector)
    val tabs = listOf(
        TabItem("Attendance", Icons.Default.CalendarMonth),
        TabItem("Homework",   Icons.Default.MenuBook),
        TabItem("Exams",      Icons.Default.School),
        TabItem("Fees",       Icons.Default.AccountBalance),
        TabItem("Leave",      Icons.Default.BeachAccess),
        TabItem("Timetable",  Icons.Default.Schedule),
        TabItem("Complaints", Icons.Default.Report),
    )
    var selectedTab by remember { mutableIntStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(studentName, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 17.sp)
                        Text("Student Profile", color = Color.White.copy(alpha = 0.75f), fontSize = 12.sp)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BluePrimary)
            )
        }
    ) { paddingValues ->

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
        ) {
            // Scrollable tabs — prevents overflow on 7 items
            ScrollableTabRow(
                selectedTabIndex = selectedTab,
                edgePadding      = 0.dp,
                containerColor   = MaterialTheme.colorScheme.surface,
                contentColor     = BluePrimary,
                indicator        = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color    = BluePrimary
                    )
                }
            ) {
                tabs.forEachIndexed { i, tab ->
                    Tab(
                        selected = selectedTab == i,
                        onClick  = { selectedTab = i },
                        modifier = Modifier.height(56.dp)
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                tab.icon,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                                tint     = if (selectedTab == i) BluePrimary else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(Modifier.height(2.dp))
                            Text(
                                tab.label,
                                fontSize   = 11.sp,
                                fontWeight = if (selectedTab == i) FontWeight.SemiBold else FontWeight.Normal,
                                color      = if (selectedTab == i) BluePrimary else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            when (selectedTab) {
                0 -> AttendanceTab(viewModel)
                1 -> HomeworkTab(viewModel)
                2 -> ExamsTab(viewModel)
                3 -> FeesTab(viewModel)
                4 -> LeaveTab(viewModel)
                5 -> TimetableTab(viewModel)
                6 -> ComplaintsTab(viewModel)
            }
        }
    }
}

// ── Attendance Tab ────────────────────────────────────────────────────────────

@Composable
private fun AttendanceTab(viewModel: ChildDetailViewModel) {
    val state         by viewModel.attendance.collectAsStateWithLifecycle()
    val selectedMonth by viewModel.selectedMonth.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {

        // Month nav
        Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(onClick = { viewModel.previousMonth() }) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Previous month", tint = BluePrimary)
                }
                Text(
                    formatMonth(selectedMonth),
                    fontWeight = FontWeight.SemiBold,
                    color      = BlueDark,
                    fontSize   = 15.sp
                )
                val isCurrentMonth = viewModel.isCurrentMonth()
                IconButton(onClick = { viewModel.nextMonth() }, enabled = !isCurrentMonth) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = "Next month",
                        tint = if (isCurrentMonth) MaterialTheme.colorScheme.onSurfaceVariant else BluePrimary
                    )
                }
            }
        }

        when {
            state.isLoading -> CenterLoad()
            state.error != null -> CenterError(state.error!!)
            state.data != null -> {
                val data = state.data!!
                // Summary row
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatPill("Total",   data.summary.total.toString(),   Color(0xFF6366F1), Modifier.weight(1f))
                    StatPill("Present", data.summary.present.toString(), Color(0xFF10B981), Modifier.weight(1f))
                    StatPill("Absent",  data.summary.absent.toString(),  Color(0xFFEF4444), Modifier.weight(1f))
                }

                AttendanceCalendarGrid(
                    records = data.records,
                    month   = data.month
                )
            }
        }
    }
}

@Composable
private fun AttendanceCalendarGrid(records: List<AttendanceDayRecord>, month: String) {
    val recordMap = records.associate { it.date to it.status }
    val cal = java.util.Calendar.getInstance()
    val (year, mon) = try {
        val p = month.split("-")
        Pair(p[0].toInt(), p[1].toInt())
    } catch (_: Exception) { return }

    cal.set(year, mon - 1, 1)
    val startOffset  = (cal.get(java.util.Calendar.DAY_OF_WEEK) - 2 + 7) % 7 // Mon = 0
    val daysInMonth  = cal.getActualMaximum(java.util.Calendar.DAY_OF_MONTH)
    val dayHeaders   = listOf("M", "T", "W", "T", "F", "S", "S")

    Card(
        modifier  = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        shape     = RoundedCornerShape(16.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Day-of-week headers
            Row(modifier = Modifier.fillMaxWidth()) {
                dayHeaders.forEach { d ->
                    Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        Text(d, fontSize = 12.sp, fontWeight = FontWeight.Bold,
                             color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            Spacer(Modifier.height(10.dp))

            // Day cells
            val totalCells = startOffset + daysInMonth
            val rows = (totalCells + 6) / 7
            for (row in 0 until rows) {
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                    for (col in 0 until 7) {
                        val day = row * 7 + col - startOffset + 1
                        Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                            if (day in 1..daysInMonth) {
                                val dateStr = "%04d-%02d-%02d".format(year, mon, day)
                                val status  = recordMap[dateStr]
                                val bg      = when (status) {
                                    "present" -> Color(0xFF10B981)
                                    "absent"  -> Color(0xFFEF4444)
                                    else      -> Color.Transparent
                                }
                                val textColor = when (status) {
                                    "present", "absent" -> Color.White
                                    else -> MaterialTheme.colorScheme.onSurface
                                }
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .background(bg, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        "$day",
                                        fontSize   = 13.sp,
                                        color      = textColor,
                                        fontWeight = if (status != null) FontWeight.Bold else FontWeight.Normal
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(12.dp))
            // Legend
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                LegendDot(Color(0xFF10B981), "Present")
                LegendDot(Color(0xFFEF4444), "Absent")
            }
        }
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Box(Modifier.size(10.dp).background(color, CircleShape))
        Text(label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

// ── Homework Tab ──────────────────────────────────────────────────────────────

@Composable
private fun HomeworkTab(viewModel: ChildDetailViewModel) {
    val state by viewModel.homework.collectAsStateWithLifecycle()

    when {
        state.isLoading -> CenterLoad()
        state.error != null -> CenterError(state.error!!)
        state.items.isEmpty() -> CenterEmpty("No homework assigned", "📚")
        else -> LazyColumn(
            contentPadding      = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(state.items, key = { it.id }) { hw ->
                HomeworkCard(hw)
            }
            item { Spacer(Modifier.height(8.dp)) }
        }
    }
}

@Composable
private fun HomeworkCard(hw: ParentHomeworkItem) {
    val context = LocalContext.current

    var pendingAtt by remember { mutableStateOf<com.example.erpparents.data.model.AttachmentItem?>(null) }

    fun startDownload(att: com.example.erpparents.data.model.AttachmentItem) {
        val request = DownloadManager.Request(Uri.parse(att.url)).apply {
            setTitle(att.name)
            setDescription("Downloading…")
            setMimeType(if (att.type == "pdf") "application/pdf" else "image/*")
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, att.name)
            setAllowedOverMetered(true)
            setAllowedOverRoaming(true)
        }
        context.getSystemService(DownloadManager::class.java).enqueue(request)
        Toast.makeText(context, "Downloading ${att.name}…", Toast.LENGTH_SHORT).show()
    }

    val permLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) pendingAtt?.let { startDownload(it) }
        else Toast.makeText(context, "Storage permission required to download files", Toast.LENGTH_LONG).show()
        pendingAtt = null
    }

    fun tryDownload(att: com.example.erpparents.data.model.AttachmentItem) {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.WRITE_EXTERNAL_STORAGE)
            != PackageManager.PERMISSION_GRANTED) {
            pendingAtt = att
            permLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        } else {
            startDownload(att)
        }
    }

    val (statusColor, statusLabel) = when (hw.status) {
        "submitted"     -> Pair(Color(0xFF10B981), "Submitted")
        "late"          -> Pair(Color(0xFFF59E0B), "Late")
        else            -> Pair(Color(0xFFEF4444), "Not Submitted")
    }
    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(14.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(hw.title, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = BlueDark)
                    if (!hw.subject.isNullOrBlank()) {
                        Text(hw.subject, fontSize = 12.sp, color = BluePrimary)
                    }
                }
                Surface(
                    color = statusColor.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Text(
                        statusLabel,
                        color      = statusColor,
                        fontSize   = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier   = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }
            Spacer(Modifier.height(6.dp))
            Text(hw.description, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 3, overflow = TextOverflow.Ellipsis)
            Spacer(Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                if (!hw.dueDate.isNullOrBlank()) {
                    Text("Due: ${hw.dueDate}", fontSize = 11.sp, color = Color(0xFFF59E0B), fontWeight = FontWeight.Medium)
                }
                Text("By: ${hw.assignedBy}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (!hw.remark.isNullOrBlank()) {
                Spacer(Modifier.height(4.dp))
                Text("Remark: ${hw.remark}", fontSize = 11.sp, color = Color(0xFF6366F1))
            }
            if (hw.attachments.isNotEmpty()) {
                Spacer(Modifier.height(6.dp))
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    hw.attachments.forEach { att ->
                        val emoji = if (att.type == "pdf") "📄" else "🖼️"
                        TextButton(
                            onClick        = { tryDownload(att) },
                            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text     = "$emoji ${att.name}",
                                fontSize = 12.sp,
                                color    = BluePrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}

// ── Exams Tab ─────────────────────────────────────────────────────────────────

@Composable
private fun ExamsTab(viewModel: ChildDetailViewModel) {
    val state by viewModel.exams.collectAsStateWithLifecycle()

    when {
        state.isLoading -> CenterLoad()
        state.error != null -> CenterError(state.error!!)
        state.items.isEmpty() -> CenterEmpty("No exams scheduled yet", "📝")
        else -> {
            val upcoming  = state.items.filter { !it.isPublished }
            val published = state.items.filter { it.isPublished }

            LazyColumn(
                contentPadding      = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (upcoming.isNotEmpty()) {
                    item {
                        SectionHeader(label = "Upcoming Exams", color = Color(0xFF6366F1))
                    }
                    items(upcoming, key = { "u_${it.examId}" }) { exam ->
                        UpcomingExamCard(exam)
                    }
                }
                if (published.isNotEmpty()) {
                    item {
                        SectionHeader(
                            label = "Results",
                            color = Color(0xFF10B981),
                            modifier = if (upcoming.isNotEmpty()) Modifier.padding(top = 8.dp) else Modifier
                        )
                    }
                    items(published, key = { "p_${it.examId}" }) { exam ->
                        PublishedExamCard(exam)
                    }
                }
                item { Spacer(Modifier.height(8.dp)) }
            }
        }
    }
}

@Composable
private fun SectionHeader(label: String, color: Color, modifier: Modifier = Modifier) {
    Text(
        label,
        fontWeight = FontWeight.Bold,
        fontSize   = 13.sp,
        color      = color,
        modifier   = modifier.padding(bottom = 2.dp)
    )
}

@Composable
private fun UpcomingExamCard(exam: ParentExamItem) {
    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(14.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(exam.examName, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = BlueDark)
                    Text(
                        exam.examType.replace("_", " ").replaceFirstChar { it.uppercase() },
                        fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Surface(
                    color = Color(0xFF6366F1).copy(alpha = 0.1f),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Text(
                        "Upcoming",
                        color    = Color(0xFF6366F1),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            if (!exam.examDate.isNullOrBlank()) {
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("📅  ", fontSize = 13.sp)
                    Text(
                        formatDate(exam.examDate),
                        fontSize   = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color      = Color(0xFF6366F1)
                    )
                }
            }

            if (exam.subjects.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                HorizontalDivider()
                Spacer(Modifier.height(8.dp))
                Text("Subjects", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(4.dp))
                exam.subjects.forEach { subject ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(subject.name, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                        Text(
                            "Max: ${subject.maxMarks}",
                            fontSize = 12.sp,
                            color    = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PublishedExamCard(exam: ParentExamItem) {
    val result     = exam.result
    val gradeColor = when (result?.grade) {
        "A+", "A" -> Color(0xFF10B981)
        "B+", "B" -> Color(0xFF3B82F6)
        "C+", "C" -> Color(0xFFF59E0B)
        else       -> Color(0xFFEF4444)
    }
    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(14.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(exam.examName, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = BlueDark)
                    Text(
                        exam.examType.replace("_", " ").replaceFirstChar { it.uppercase() },
                        fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (!exam.examDate.isNullOrBlank()) {
                        Text(formatDate(exam.examDate), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                if (result != null) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Surface(color = gradeColor.copy(alpha = 0.12f), shape = RoundedCornerShape(10.dp)) {
                            Text(
                                result.grade,
                                color      = gradeColor,
                                fontWeight = FontWeight.Bold,
                                fontSize   = 20.sp,
                                modifier   = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                        Text("${result.percentage.toInt()}%", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                } else {
                    Surface(color = Color(0xFFF59E0B).copy(alpha = 0.1f), shape = RoundedCornerShape(20.dp)) {
                        Text(
                            "No result",
                            color    = Color(0xFFF59E0B),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            if (result != null && result.marks.isNotEmpty()) {
                Spacer(Modifier.height(10.dp))
                HorizontalDivider()
                Spacer(Modifier.height(8.dp))
                result.marks.forEach { mark ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(mark.subject, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                        Text(
                            "${mark.obtained} / ${mark.maxMarks}",
                            fontSize   = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color      = BlueDark
                        )
                    }
                }
                Spacer(Modifier.height(6.dp))
                HorizontalDivider()
                Spacer(Modifier.height(6.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = BlueDark)
                    Text(
                        "${result.totalObtained} / ${result.totalMax}",
                        fontWeight = FontWeight.Bold,
                        fontSize   = 14.sp,
                        color      = BluePrimary
                    )
                }
            } else if (result == null) {
                Spacer(Modifier.height(8.dp))
                if (exam.subjects.isNotEmpty()) {
                    HorizontalDivider()
                    Spacer(Modifier.height(8.dp))
                    Text("Subjects", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Medium)
                    Spacer(Modifier.height(4.dp))
                    exam.subjects.forEach { subject ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(subject.name, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                            Text("Max: ${subject.maxMarks}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }
    }
}

// ── Fees Tab ──────────────────────────────────────────────────────────────────

@Composable
private fun FeesTab(viewModel: ChildDetailViewModel) {
    val state by viewModel.fees.collectAsStateWithLifecycle()

    when {
        state.isLoading -> CenterLoad()
        state.error != null -> CenterError(state.error!!)
        state.data == null || state.data!!.fees.isEmpty() -> CenterEmpty("No fee records found", "💰")
        else -> {
            val fees = state.data!!.fees
            val paidCount = fees.count { it.status == "paid" }
            LazyColumn(
                contentPadding      = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        StatPill("Total",  fees.size.toString(),       Color(0xFF6366F1), Modifier.weight(1f))
                        StatPill("Paid",   paidCount.toString(),        Color(0xFF10B981), Modifier.weight(1f))
                        StatPill("Due",    (fees.size - paidCount).toString(), Color(0xFFEF4444), Modifier.weight(1f))
                    }
                }
                items(fees, key = { it.month }) { fee ->
                    FeeCard(fee)
                }
                item { Spacer(Modifier.height(8.dp)) }
            }
        }
    }
}

@Composable
private fun FeeCard(fee: FeeRecord) {
    val isPaid     = fee.status == "paid"
    val accentColor = if (isPaid) Color(0xFF10B981) else Color(0xFFEF4444)
    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(12.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Left accent bar
            Box(
                modifier = Modifier
                    .width(5.dp)
                    .height(72.dp)
                    .background(accentColor, RoundedCornerShape(topStart = 12.dp, bottomStart = 12.dp))
            )
            Row(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(formatMonth(fee.month), fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    if (fee.amount > 0) {
                        Text("₹ ${fee.amount}", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = BlueDark)
                    }
                    if (!fee.paidAt.isNullOrBlank()) {
                        Text("Paid on ${formatDateShort(fee.paidAt)}", fontSize = 11.sp, color = Color(0xFF10B981))
                    }
                    if (!fee.note.isNullOrBlank()) {
                        Text(fee.note, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                Surface(color = accentColor.copy(alpha = 0.12f), shape = RoundedCornerShape(20.dp)) {
                    Text(
                        if (isPaid) "Paid" else "Due",
                        color      = accentColor,
                        fontWeight = FontWeight.Bold,
                        fontSize   = 13.sp,
                        modifier   = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                    )
                }
            }
        }
    }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

@Composable
private fun StatPill(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier  = modifier,
        shape     = RoundedCornerShape(14.dp),
        colors    = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f)),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Column(
            modifier            = Modifier.padding(vertical = 12.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, color = color)
            Spacer(Modifier.height(2.dp))
            Text(label, fontSize = 11.sp, color = color.copy(alpha = 0.8f), fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun CenterLoad() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = BluePrimary, strokeWidth = 3.dp)
    }
}

@Composable
private fun CenterError(message: String) {
    Box(Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("⚠️", fontSize = 36.sp)
            Text(message, color = Color(0xFFDC2626), fontSize = 14.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun CenterEmpty(message: String, emoji: String = "📭") {
    Box(Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(emoji, fontSize = 44.sp)
            Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 15.sp, fontWeight = FontWeight.Medium)
        }
    }
}

private fun formatMonth(yyyyMM: String): String {
    return try {
        val sdf = SimpleDateFormat("yyyy-MM", Locale.getDefault())
        val date = sdf.parse(yyyyMM) ?: return yyyyMM
        SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(date)
    } catch (_: Exception) { yyyyMM }
}

private fun formatDate(yyyyMMdd: String): String {
    return try {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val date = sdf.parse(yyyyMMdd) ?: return yyyyMMdd
        SimpleDateFormat("EEE, dd MMM", Locale.getDefault()).format(date)
    } catch (_: Exception) { yyyyMMdd }
}

private fun formatDateShort(iso: String): String {
    return try {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        val date = sdf.parse(iso) ?: return iso
        SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(date)
    } catch (_: Exception) { iso.take(10) }
}

// ── Leave Tab ─────────────────────────────────────────────────────────────────

@Composable
private fun LeaveTab(viewModel: ChildDetailViewModel) {
    val state by viewModel.leave.collectAsStateWithLifecycle()
    var showDialog by remember { mutableStateOf(false) }

    LaunchedEffect(state.submitSuccess) {
        if (state.submitSuccess) {
            showDialog = false
            viewModel.clearLeaveSubmitState()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        when {
            state.isLoading -> CenterLoad()
            state.history.isEmpty() -> Column(
                modifier = Modifier.align(Alignment.Center).padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("🏖️", fontSize = 44.sp)
                Text("No leave requests", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 15.sp, fontWeight = FontWeight.Medium)
                Text("Tap + to apply for leave", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
            }
            else -> LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(state.history, key = { it.id }) { leave ->
                    LeaveRecordCard(leave)
                }
                item { Spacer(Modifier.height(72.dp)) }
            }
        }

        FloatingActionButton(
            onClick        = { showDialog = true },
            modifier       = Modifier.align(Alignment.BottomEnd).padding(16.dp),
            containerColor = BluePrimary,
            contentColor   = Color.White
        ) {
            Text("+", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        }
    }

    if (showDialog) {
        LeaveApplyDialog(
            isSubmitting = state.isSubmitting,
            error        = state.submitError,
            onDismiss    = { showDialog = false; viewModel.clearLeaveSubmitState() },
            onSubmit     = { from, to, reason -> viewModel.submitLeave(from, to, reason) }
        )
    }
}

@Composable
private fun LeaveRecordCard(leave: StudentLeaveRecord) {
    val (statusColor, statusBg) = when (leave.status) {
        "approved" -> Pair(Color(0xFF059669), Color(0xFFD1FAE5))
        "rejected" -> Pair(Color(0xFFDC2626), Color(0xFFFEE2E2))
        else       -> Pair(Color(0xFFD97706), Color(0xFFFEF3C7))
    }
    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(12.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Row(verticalAlignment = Alignment.Top) {
            Box(
                modifier = Modifier
                    .width(5.dp)
                    .heightIn(min = 80.dp)
                    .fillMaxHeight()
                    .background(statusColor, RoundedCornerShape(topStart = 12.dp, bottomStart = 12.dp))
            )
            Column(modifier = Modifier.weight(1f).padding(horizontal = 14.dp, vertical = 12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "${formatDate(leave.fromDate.take(10))} → ${formatDate(leave.toDate.take(10))}",
                            fontWeight = FontWeight.SemiBold,
                            fontSize   = 13.sp,
                            color      = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    Surface(shape = RoundedCornerShape(20.dp), color = statusBg) {
                        Text(
                            leave.status.replaceFirstChar { it.uppercase() },
                            color      = statusColor,
                            fontSize   = 11.sp,
                            fontWeight = FontWeight.Medium,
                            modifier   = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text(leave.reason, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
                if (!leave.rejectionNote.isNullOrBlank()) {
                    Spacer(Modifier.height(2.dp))
                    Text("Note: ${leave.rejectionNote}", color = Color(0xFFDC2626), fontSize = 11.sp)
                }
                if (!leave.resolvedByName.isNullOrBlank() && leave.status != "pending") {
                    Spacer(Modifier.height(2.dp))
                    val verb = if (leave.status == "approved") "Approved" else "Rejected"
                    Text("$verb by ${leave.resolvedByName}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                }
            }
        }
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
                val dialog = DatePickerDialog(context, { _, year, month, day ->
                    onDateSelected("%04d-%02d-%02d".format(year, month + 1, day))
                }, calendar.get(java.util.Calendar.YEAR), calendar.get(java.util.Calendar.MONTH), calendar.get(java.util.Calendar.DAY_OF_MONTH))
                if (minDateMillis != null) dialog.datePicker.minDate = minDateMillis
                dialog.show()
            }) { Icon(Icons.Default.CalendarMonth, contentDescription = "Pick date", tint = BluePrimary) }
        },
        modifier = modifier, shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BluePrimary, focusedLabelColor = BluePrimary)
    )
}

@Composable
private fun LeaveApplyDialog(
    isSubmitting: Boolean,
    error:        String?,
    onDismiss:    () -> Unit,
    onSubmit:     (from: String, to: String, reason: String) -> Unit
) {
    var fromDate by remember { mutableStateOf("") }
    var toDate   by remember { mutableStateOf("") }
    var reason   by remember { mutableStateOf("") }

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
        title = { Text("Apply for Leave", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                DatePickerField(
                    label          = "From Date *",
                    value          = fromDate,
                    onDateSelected = { fromDate = it },
                    modifier       = Modifier.fillMaxWidth(),
                    minDateMillis  = tomorrow
                )
                DatePickerField(
                    label          = "To Date *",
                    value          = toDate,
                    onDateSelected = { toDate = it },
                    modifier       = Modifier.fillMaxWidth(),
                    minDateMillis  = fromMillis
                )
                OutlinedTextField(
                    value = reason, onValueChange = { reason = it },
                    label = { Text("Reason *") },
                    modifier = Modifier.fillMaxWidth(), maxLines = 3
                )
                if (error != null) Text(error, color = Color(0xFFDC2626), fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(
                onClick  = { onSubmit(fromDate, toDate, reason) },
                enabled  = !isSubmitting,
                colors   = ButtonDefaults.buttonColors(containerColor = BluePrimary)
            ) { Text(if (isSubmitting) "Submitting…" else "Submit") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

// ── Timetable Tab ─────────────────────────────────────────────────────────────

@Composable
private fun TimetableTab(viewModel: ChildDetailViewModel) {
    val state by viewModel.timetable.collectAsStateWithLifecycle()

    when {
        state.isLoading -> CenterLoad()
        state.error != null -> CenterError(state.error!!)
        state.data == null || state.data!!.schedule.isEmpty() -> CenterEmpty("Timetable not set yet", "🗓️")
        else -> LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(state.data!!.schedule) { daySchedule ->
                DayScheduleCard(daySchedule)
            }
        }
    }
}

// ── Complaints Tab ────────────────────────────────────────────────────────────

private val PARENT_CATEGORIES   = listOf("home_concern", "other")
private val PARENT_SEVERITIES   = listOf("low", "medium", "high")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ComplaintsTab(viewModel: ChildDetailViewModel) {
    val state by viewModel.complaints.collectAsStateWithLifecycle()
    var showRaiseDialog by remember { mutableStateOf(false) }

    LaunchedEffect(state.submitSuccess) {
        if (state.submitSuccess) {
            showRaiseDialog = false
            viewModel.clearComplaintSubmitState()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        when {
            state.isLoading -> CenterLoad()
            state.error != null -> CenterError(state.error!!)
            state.items.isEmpty() -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📋", fontSize = 48.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("No complaints raised", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("Tap + to raise a home concern", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    }
                }
            }
            else -> LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(state.items) { item ->
                    ComplaintCard(item = item, onDelete = { viewModel.deleteComplaint(item.id) })
                }
            }
        }

        FloatingActionButton(
            onClick        = { showRaiseDialog = true },
            containerColor = BluePrimary,
            contentColor   = Color.White,
            modifier       = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Raise Complaint")
        }
    }

    if (showRaiseDialog) {
        RaiseComplaintDialog(
            isSubmitting = state.isSubmitting,
            error        = state.submitError,
            onDismiss    = { showRaiseDialog = false; viewModel.clearComplaintSubmitState() },
            onSubmit     = { category, severity, title, description ->
                viewModel.submitComplaint(category, severity, title, description)
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RaiseComplaintDialog(
    isSubmitting: Boolean,
    error:        String?,
    onDismiss:    () -> Unit,
    onSubmit:     (category: String, severity: String, title: String, description: String) -> Unit
) {
    var selectedCategory by remember { mutableStateOf("") }
    var selectedSeverity by remember { mutableStateOf("low") }
    var title            by remember { mutableStateOf("") }
    var description      by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Raise Concern", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier            = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Category chips
                Text("Category:", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    PARENT_CATEGORIES.forEach { cat ->
                        val catLabel = cat.replace("_", " ").split(" ")
                            .joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
                        FilterChip(
                            selected = selectedCategory == cat,
                            onClick  = { selectedCategory = cat },
                            label    = { Text(catLabel, fontSize = 12.sp) },
                            colors   = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = BluePrimary.copy(alpha = 0.12f),
                                selectedLabelColor     = BluePrimary
                            )
                        )
                    }
                }

                // Severity chips
                Text("Severity:", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    PARENT_SEVERITIES.forEach { sev ->
                        val sevColor = parentSeverityColor(sev)
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

                OutlinedTextField(
                    value         = title,
                    onValueChange = { title = it },
                    label         = { Text("Title *") },
                    modifier      = Modifier.fillMaxWidth(),
                    singleLine    = true,
                    shape         = RoundedCornerShape(10.dp),
                    colors        = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BluePrimary,
                        focusedLabelColor  = BluePrimary
                    )
                )

                OutlinedTextField(
                    value         = description,
                    onValueChange = { description = it },
                    label         = { Text("Description *") },
                    modifier      = Modifier.fillMaxWidth(),
                    minLines      = 3,
                    maxLines      = 5,
                    shape         = RoundedCornerShape(10.dp),
                    colors        = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BluePrimary,
                        focusedLabelColor  = BluePrimary
                    )
                )

                if (error != null) {
                    Text(error, color = Color(0xFFDC2626), fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick  = { onSubmit(selectedCategory, selectedSeverity, title, description) },
                enabled  = !isSubmitting && selectedCategory.isNotBlank() && title.isNotBlank() && description.isNotBlank(),
                colors   = ButtonDefaults.buttonColors(containerColor = BluePrimary)
            ) {
                Text(if (isSubmitting) "Submitting…" else "Submit")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun ComplaintCard(item: ParentComplaintItem, onDelete: () -> Unit) {
    val (statusColor, statusBg) = when (item.status) {
        "resolved"     -> Pair(Color(0xFF059669), Color(0xFFD1FAE5))
        "acknowledged" -> Pair(Color(0xFF1D4ED8), Color(0xFFDBEAFE))
        else           -> Pair(Color(0xFFD97706), Color(0xFFFEF3C7))
    }
    val severityColor = parentSeverityColor(item.severity)

    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(12.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(item.title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                Surface(shape = RoundedCornerShape(20.dp), color = statusBg) {
                    Text(
                        item.status.replaceFirstChar { it.uppercase() },
                        color      = statusColor,
                        fontSize   = 11.sp,
                        fontWeight = FontWeight.Medium,
                        modifier   = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
                if (item.canDelete) {
                    Spacer(Modifier.width(6.dp))
                    IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                        Icon(
                            Icons.Default.Delete,
                            contentDescription = "Delete",
                            tint     = Color(0xFFDC2626),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(Modifier.height(4.dp))
            Text(item.description, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
            Spacer(Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(20.dp), color = BluePrimary.copy(alpha = 0.08f)) {
                    Text(
                        item.category.replace("_", " ").split(" ")
                            .joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } },
                        color      = BluePrimary,
                        fontSize   = 11.sp,
                        fontWeight = FontWeight.Medium,
                        modifier   = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
                Surface(shape = RoundedCornerShape(20.dp), color = severityColor.copy(alpha = 0.12f)) {
                    Text(
                        item.severity.replaceFirstChar { it.uppercase() },
                        color      = severityColor,
                        fontSize   = 11.sp,
                        fontWeight = FontWeight.Medium,
                        modifier   = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
                Spacer(Modifier.weight(1f))
                Text(
                    try { val p = item.createdAt.substring(0, 10).split("-"); "${p[2]}/${p[1]}/${p[0]}" } catch (_: Exception) { item.createdAt },
                    color    = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 10.sp
                )
            }

            if (!item.resolvedNote.isNullOrBlank()) {
                Spacer(Modifier.height(6.dp))
                Text("Note: ${item.resolvedNote}", color = Color(0xFF059669), fontSize = 11.sp)
            }
            if (!item.resolvedByName.isNullOrBlank() && item.status == "resolved") {
                Text("Resolved by ${item.resolvedByName}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
            }
        }
    }
}

private fun parentSeverityColor(severity: String): Color = when (severity.lowercase()) {
    "high"   -> Color(0xFFDC2626)
    "medium" -> Color(0xFFD97706)
    else     -> Color(0xFF64748B)
}

// ── Timetable Tab ─────────────────────────────────────────────────────────────

@Composable
private fun DayScheduleCard(daySchedule: DayTimetable) {
    val activePeriods = daySchedule.periods.filter { it.subject.isNotBlank() }
    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(12.dp),
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(BluePrimary.copy(alpha = 0.08f))
                    .padding(horizontal = 14.dp, vertical = 8.dp)
            ) {
                Text(daySchedule.day, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = BluePrimary)
            }
            if (activePeriods.isEmpty()) {
                Text("No periods", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp, modifier = Modifier.padding(14.dp))
            } else {
                activePeriods.forEachIndexed { idx, period ->
                    if (idx > 0) HorizontalDivider(color = Color(0xFFF1F5F9))
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "${period.periodNumber}",
                            fontWeight = FontWeight.Bold,
                            fontSize   = 12.sp,
                            color      = BluePrimary,
                            modifier   = Modifier.width(24.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(period.subject, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            if (period.teacherName.isNotBlank()) Text(period.teacherName, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                        }
                        if (period.startTime.isNotBlank()) {
                            Text("${period.startTime}–${period.endTime}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }
}
