package com.example.myapplication.data.model

import com.google.gson.annotations.SerializedName

data class LoginRequest(val mobile: String, val password: String)
data class LoginResponse(val token: String, val teacher: TeacherData)

data class TeacherData(val id: String, val name: String, val mobile: String, val subject: String?, val role: String, val school: SchoolData?)
data class SchoolData(@SerializedName("_id") val id: String, val name: String, val type: String)

data class MyClassResponse(val teacher: TeacherData, val isClassTeacher: Boolean, @SerializedName("class") val classInfo: ClassData?, val students: List<StudentData>)

data class ClassData(val id: String, val name: String, val section: String?) {
    val fullName: String get() = if (section.isNullOrBlank()) name else "$name — $section"
}

data class StudentData(val id: String, val name: String, val rollNumber: String?, val parentName: String?, val parentMobile: String?)

// ── Exam ──────────────────────────────────────────────────────────────────────

data class ExamSubject(val name: String, val maxMarks: Int)

data class ExamItem(
    val id: String, val name: String, val type: String,
    @SerializedName("class") val classInfo: ClassData,
    val subjects: List<ExamSubject>, val examDate: String?,
    val isPublished: Boolean, val marksEntered: Boolean,
    val canEnterMarks: Boolean, val canViewResults: Boolean
)

data class SubjectMarkState(val subject: String, val maxMarks: Int, val obtained: Int?)
data class StudentMarksEntry(val studentId: String, val name: String, val rollNumber: String?, val marks: List<SubjectMarkState>)
data class ExamMarksResponse(val exam: ExamItem, val students: List<StudentMarksEntry>)
data class MarkEntry(val subject: String, val obtained: Int)
data class StudentResultEntry(val studentId: String, val marks: List<MarkEntry>)
data class SubmitMarksRequest(val results: List<StudentResultEntry>)

data class SubjectResult(val subject: String, val obtained: Int, val maxMarks: Int)
data class StudentExamResult(val studentId: String, val name: String, val rollNumber: String?, val marks: List<SubjectResult>, val totalObtained: Int, val totalMax: Int, val percentage: Double, val grade: String)
data class ExamResultsData(val exam: ExamSummary, val results: List<StudentExamResult>)
data class ExamSummary(val id: String, val name: String, val type: String, val subjects: List<ExamSubject>, val isPublished: Boolean)

// ── Homework ──────────────────────────────────────────────────────────────────

data class AssignedByData(val id: String, val name: String)

data class AttachmentItem(val url: String, val type: String, val name: String)

data class HomeworkItem(
    val id: String, val title: String, val description: String,
    val subject: String?, val dueDate: String?,
    @SerializedName("class") val classInfo: ClassData,
    val assignedBy: AssignedByData,
    val isMyHomework: Boolean,
    val attachments: List<AttachmentItem> = emptyList()
)

// ── Homework Submissions ───────────────────────────────────────────────────────

data class SubmissionRecord(
    val studentId: String,
    val name: String,
    val rollNumber: String?,
    var status: String,   // submitted | not_submitted | late
    var remark: String
)

data class SubmissionsResponse(
    val homeworkId: String,
    val title: String,
    val canMark: Boolean,
    val students: List<SubmissionRecord>
)

data class SubmissionEntry(val studentId: String, val status: String, val remark: String)
data class MarkSubmissionsRequest(val submissions: List<SubmissionEntry>)

// ── Attendance ────────────────────────────────────────────────────────────────

data class AttendanceRecord(val studentId: String, val name: String, val rollNumber: String?, var status: String)
data class AttendanceResponse(val date: String, val isMarked: Boolean, val records: List<AttendanceRecord>)
data class AttendanceEntry(val studentId: String, val status: String)
data class MarkAttendanceRequest(val date: String, val records: List<AttendanceEntry>)

data class ApiError(val message: String)

// ── Notice ────────────────────────────────────────────────────────────────────

data class NoticeItem(
    @SerializedName("_id") val id: String,
    val title: String,
    val content: String,
    val targetAudience: String,
    val createdAt: String
)

// ── Timetable ─────────────────────────────────────────────────────────────────

data class PeriodItem(
    val periodNumber: Int,
    val subject:      String,
    val teacherName:  String,
    val startTime:    String,
    val endTime:      String,
    val className:    String? = null   // present in personal schedule only
)

data class DaySchedule(val day: String, val periods: List<PeriodItem>)

data class TimetableResponse(
    @SerializedName("_id") val id: String? = null,
    val type:      String = "class",   // "class" or "personal"
    val className: String? = null,     // set for class teachers
    val schedule:  List<DaySchedule>
)

// ── Teacher Leave ─────────────────────────────────────────────────────────────

data class TeacherLeaveItem(
    @SerializedName("_id") val id: String,
    val fromDate: String,
    val toDate: String,
    val reason: String,
    val leaveType: String,
    val status: String,
    val rejectionNote: String?,
    val resolvedByName: String?,
    val createdAt: String
)

data class SubmitLeaveRequest(val fromDate: String, val toDate: String, val reason: String, val leaveType: String)

// ── Student Leave (for class teacher to resolve) ──────────────────────────────

data class StudentLeaveItem(
    @SerializedName("_id") val id: String,
    val student: StudentRef?,
    val fromDate: String,
    val toDate: String,
    val reason: String,
    val status: String,
    val rejectionNote: String?,
    val resolvedByName: String?,
    val createdAt: String
)

data class StudentRef(val name: String, val rollNumber: String?)
data class ResolveLeaveRequest(val action: String, val rejectionNote: String = "")

// ── Complaints ────────────────────────────────────────────────────────────────

data class ComplaintStudent(val name: String, val rollNumber: String?)

data class ComplaintItem(
    @SerializedName("_id") val id: String,
    val student:       ComplaintStudent?,
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

data class ComplaintsResponse(
    val myComplaints:    List<ComplaintItem>,
    val classComplaints: List<ComplaintItem>
)

data class SubmitComplaintRequest(
    val studentId:   String,
    val category:    String,
    val severity:    String,
    val title:       String,
    val description: String
)

// ── Subjects ──────────────────────────────────────────────────────────────────

data class SubjectItem(
    @SerializedName("_id") val id: String,
    val name: String,
    val code: String? = null
)
