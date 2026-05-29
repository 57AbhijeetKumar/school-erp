package com.example.erpparents.data.model

import com.google.gson.annotations.SerializedName

data class ParentLoginRequest(val mobile: String, val password: String)

data class ChildData(
    val studentId: String,
    val name:      String,
    val rollNumber: String?,
    val className: String,
    val section:   String?,
    val school:    String
) {
    val classLabel: String get() = if (section.isNullOrBlank()) className else "$className — $section"
}

data class ParentLoginResponse(val token: String, val children: List<ChildData>)

// ── Attendance ────────────────────────────────────────────────────────────────

data class AttendanceSummary(val total: Int, val present: Int, val absent: Int)
data class AttendanceDayRecord(val date: String, val status: String)
data class ChildAttendanceResponse(
    val studentId: String,
    val name:      String,
    val month:     String,
    val summary:   AttendanceSummary,
    val records:   List<AttendanceDayRecord>
)

// ── Homework ──────────────────────────────────────────────────────────────────

data class AttachmentItem(val url: String, val type: String, val name: String)

data class ParentHomeworkItem(
    val id:          String,
    val title:       String,
    val description: String,
    val subject:     String?,
    val dueDate:     String?,
    val assignedBy:  String,
    val status:      String,   // submitted | not_submitted | late
    val remark:      String?,
    val attachments: List<AttachmentItem> = emptyList()
)

// ── Exams ─────────────────────────────────────────────────────────────────────

data class ExamSubjectInfo(val name: String, val maxMarks: Int)

data class ExamResultDetail(
    val marks:         List<SubjectMark>,
    val totalObtained: Int,
    val totalMax:      Int,
    val percentage:    Double,
    val grade:         String
)

data class SubjectMark(val subject: String, val obtained: Int, val maxMarks: Int)

data class ParentExamItem(
    val examId:      String,
    val examName:    String,
    val examType:    String,
    val examDate:    String?,
    val subjects:    List<ExamSubjectInfo>,
    val isPublished: Boolean,
    val result:      ExamResultDetail?
)

// ── Fees ──────────────────────────────────────────────────────────────────────

data class FeeRecord(
    val month:  String,
    val status: String,   // paid | due
    val amount: Int,
    val paidAt: String?,
    val note:   String?
)

data class ChildFeesResponse(
    val studentId: String,
    val name:      String,
    val fees:      List<FeeRecord>
)

// ── Notice ────────────────────────────────────────────────────────────────────

data class ParentNoticeItem(
    val id:             String,
    val title:          String,
    val content:        String,
    val targetAudience: String,
    val createdAt:      String
)

// ── Timetable ─────────────────────────────────────────────────────────────────

data class PeriodInfo(
    val periodNumber: Int,
    val subject:      String,
    val teacherName:  String,
    val startTime:    String,
    val endTime:      String
)

data class DayTimetable(val day: String, val periods: List<PeriodInfo>)

data class ChildTimetableResponse(val schedule: List<DayTimetable>)

// ── Student Leave ─────────────────────────────────────────────────────────────

data class StudentLeaveRecord(
    val id:             String,
    val fromDate:       String,
    val toDate:         String,
    val reason:         String,
    val status:         String,
    val rejectionNote:  String?,
    val resolvedByName: String?,
    val createdAt:      String
)

data class SubmitLeaveRequest(val fromDate: String, val toDate: String, val reason: String)

// ── Complaints ────────────────────────────────────────────────────────────────

data class ParentComplaintItem(
    @SerializedName("_id") val id: String,
    val raisedByRole:  String,
    val raisedByName:  String,
    val category:      String,
    val severity:      String,
    val title:         String,
    val description:   String,
    val status:        String,
    val resolvedNote:  String?,
    val resolvedByName: String?,
    val isOwn:         Boolean,
    val canDelete:     Boolean,
    val createdAt:     String
)

data class SubmitParentComplaintRequest(
    val category:    String,
    val severity:    String,
    val title:       String,
    val description: String
)
