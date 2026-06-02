package com.example.myapplication.ui.parent.child

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.*
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

data class AttendanceState(
    val isLoading: Boolean                  = false,
    val data:      ChildAttendanceResponse? = null,
    val error:     String?                  = null
)

data class HomeworkState(
    val isLoading: Boolean                  = false,
    val items:     List<ParentHomeworkItem> = emptyList(),
    val error:     String?                  = null
)

data class ExamsState(
    val isLoading: Boolean              = false,
    val items:     List<ParentExamItem> = emptyList(),
    val error:     String?              = null
)

data class FeesState(
    val isLoading: Boolean             = false,
    val data:      ChildFeesResponse?  = null,
    val error:     String?             = null
)

data class LeaveState(
    val isLoading:     Boolean                  = false,
    val history:       List<StudentLeaveRecord> = emptyList(),
    val error:         String?                  = null,
    val isSubmitting:  Boolean                  = false,
    val submitSuccess: Boolean                  = false,
    val submitError:   String?                  = null
)

data class TimetableState(
    val isLoading: Boolean                = false,
    val data:      ChildTimetableResponse? = null,
    val error:     String?                = null
)

data class ComplaintsState(
    val isLoading:     Boolean                   = false,
    val items:         List<ParentComplaintItem> = emptyList(),
    val error:         String?                   = null,
    val isSubmitting:  Boolean                   = false,
    val submitSuccess: Boolean                   = false,
    val submitError:   String?                   = null
)

class ChildDetailViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val monthFormat = SimpleDateFormat("yyyy-MM", Locale.getDefault())

    private var studentId = ""

    private val _attendance  = MutableStateFlow(AttendanceState())
    val attendance: StateFlow<AttendanceState> = _attendance.asStateFlow()

    private val _homework    = MutableStateFlow(HomeworkState())
    val homework: StateFlow<HomeworkState> = _homework.asStateFlow()

    private val _exams       = MutableStateFlow(ExamsState())
    val exams: StateFlow<ExamsState> = _exams.asStateFlow()

    private val _fees        = MutableStateFlow(FeesState())
    val fees: StateFlow<FeesState> = _fees.asStateFlow()

    private val _leave       = MutableStateFlow(LeaveState())
    val leave: StateFlow<LeaveState> = _leave.asStateFlow()

    private val _timetable   = MutableStateFlow(TimetableState())
    val timetable: StateFlow<TimetableState> = _timetable.asStateFlow()

    private val _complaints  = MutableStateFlow(ComplaintsState())
    val complaints: StateFlow<ComplaintsState> = _complaints.asStateFlow()

    private val _selectedMonth = MutableStateFlow(currentMonth())
    val selectedMonth: StateFlow<String> = _selectedMonth.asStateFlow()

    fun init(id: String) {
        if (studentId == id) return
        studentId = id
        loadAttendance()
        loadHomework()
        loadExams()
        loadFees()
        loadLeaveHistory()
        loadTimetable()
        loadComplaints()
    }

    fun loadAttendance(month: String = _selectedMonth.value) {
        val token = prefManager.getParentToken() ?: return
        _selectedMonth.value = month
        _attendance.value = AttendanceState(isLoading = true)
        viewModelScope.launch {
            try {
                val r = RetrofitClient.api.getChildAttendance("Bearer $token", studentId, month)
                _attendance.value = if (r.isSuccessful)
                    AttendanceState(data = r.body())
                else
                    AttendanceState(error = "Failed to load attendance")
            } catch (_: Exception) {
                _attendance.value = AttendanceState(error = "Cannot connect to server")
            }
        }
    }

    fun loadHomework() {
        val token = prefManager.getParentToken() ?: return
        _homework.value = HomeworkState(isLoading = true)
        viewModelScope.launch {
            try {
                val r = RetrofitClient.api.getChildHomework("Bearer $token", studentId)
                _homework.value = if (r.isSuccessful)
                    HomeworkState(items = r.body() ?: emptyList())
                else
                    HomeworkState(error = "Failed to load homework")
            } catch (_: Exception) {
                _homework.value = HomeworkState(error = "Cannot connect to server")
            }
        }
    }

    fun loadExams() {
        val token = prefManager.getParentToken() ?: return
        _exams.value = ExamsState(isLoading = true)
        viewModelScope.launch {
            try {
                val r = RetrofitClient.api.getChildExams("Bearer $token", studentId)
                _exams.value = if (r.isSuccessful)
                    ExamsState(items = r.body() ?: emptyList())
                else
                    ExamsState(error = "Failed to load exams")
            } catch (_: Exception) {
                _exams.value = ExamsState(error = "Cannot connect to server")
            }
        }
    }

    fun loadFees() {
        val token = prefManager.getParentToken() ?: return
        _fees.value = FeesState(isLoading = true)
        viewModelScope.launch {
            try {
                val r = RetrofitClient.api.getChildFees("Bearer $token", studentId)
                _fees.value = if (r.isSuccessful)
                    FeesState(data = r.body())
                else
                    FeesState(error = "Failed to load fees")
            } catch (_: Exception) {
                _fees.value = FeesState(error = "Cannot connect to server")
            }
        }
    }

    fun loadLeaveHistory() {
        val token = prefManager.getParentToken() ?: return
        _leave.value = _leave.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            try {
                val r = RetrofitClient.api.getParentLeaveHistory("Bearer $token", studentId)
                _leave.value = if (r.isSuccessful)
                    LeaveState(history = r.body() ?: emptyList())
                else
                    LeaveState(error = "Failed to load leave history")
            } catch (_: Exception) {
                _leave.value = LeaveState(error = "Cannot connect to server")
            }
        }
    }

    fun submitLeave(fromDate: String, toDate: String, reason: String) {
        val token = prefManager.getParentToken() ?: return
        if (fromDate.isBlank() || toDate.isBlank() || reason.isBlank()) {
            _leave.value = _leave.value.copy(submitError = "All fields are required")
            return
        }
        _leave.value = _leave.value.copy(isSubmitting = true, submitError = null, submitSuccess = false)
        viewModelScope.launch {
            try {
                val r = RetrofitClient.api.submitParentLeave(
                    "Bearer $token", studentId,
                    ParentSubmitLeaveRequest(fromDate, toDate, reason.trim())
                )
                if (r.isSuccessful) {
                    _leave.value = _leave.value.copy(isSubmitting = false, submitSuccess = true)
                    loadLeaveHistory()
                } else {
                    _leave.value = _leave.value.copy(isSubmitting = false, submitError = "Failed to submit leave")
                }
            } catch (_: Exception) {
                _leave.value = _leave.value.copy(isSubmitting = false, submitError = "Cannot connect to server")
            }
        }
    }

    fun clearLeaveSubmitState() {
        _leave.value = _leave.value.copy(submitSuccess = false, submitError = null)
    }

    fun loadTimetable() {
        val token = prefManager.getParentToken() ?: return
        _timetable.value = TimetableState(isLoading = true)
        viewModelScope.launch {
            try {
                val r = RetrofitClient.api.getChildTimetable("Bearer $token", studentId)
                _timetable.value = if (r.isSuccessful)
                    TimetableState(data = r.body())
                else
                    TimetableState(error = "Failed to load timetable")
            } catch (_: Exception) {
                _timetable.value = TimetableState(error = "Cannot connect to server")
            }
        }
    }

    fun loadComplaints() {
        val token = prefManager.getParentToken() ?: return
        _complaints.value = ComplaintsState(isLoading = true)
        viewModelScope.launch {
            try {
                val r = RetrofitClient.api.getChildComplaints("Bearer $token", studentId)
                _complaints.value = if (r.isSuccessful)
                    ComplaintsState(items = r.body() ?: emptyList())
                else
                    ComplaintsState(error = "Failed to load complaints")
            } catch (_: Exception) {
                _complaints.value = ComplaintsState(error = "Cannot connect to server")
            }
        }
    }

    fun submitComplaint(category: String, severity: String, title: String, description: String) {
        val token = prefManager.getParentToken() ?: return
        if (title.isBlank() || description.isBlank()) {
            _complaints.value = _complaints.value.copy(submitError = "Title and description are required")
            return
        }
        _complaints.value = _complaints.value.copy(isSubmitting = true, submitError = null, submitSuccess = false)
        viewModelScope.launch {
            try {
                val r = RetrofitClient.api.submitChildComplaint(
                    "Bearer $token", studentId,
                    SubmitParentComplaintRequest(category, severity, title.trim(), description.trim())
                )
                if (r.isSuccessful) {
                    _complaints.value = _complaints.value.copy(isSubmitting = false, submitSuccess = true)
                    loadComplaints()
                } else {
                    _complaints.value = _complaints.value.copy(isSubmitting = false, submitError = "Failed to raise complaint")
                }
            } catch (_: Exception) {
                _complaints.value = _complaints.value.copy(isSubmitting = false, submitError = "Cannot connect to server")
            }
        }
    }

    fun deleteComplaint(id: String) {
        val token = prefManager.getParentToken() ?: return
        viewModelScope.launch {
            try {
                RetrofitClient.api.deleteChildComplaint("Bearer $token", id)
                loadComplaints()
            } catch (_: Exception) {}
        }
    }

    fun clearComplaintSubmitState() {
        _complaints.value = _complaints.value.copy(submitSuccess = false, submitError = null)
    }

    fun previousMonth() {
        val cal = Calendar.getInstance()
        cal.time = monthFormat.parse(_selectedMonth.value) ?: return
        cal.add(Calendar.MONTH, -1)
        loadAttendance(monthFormat.format(cal.time))
    }

    fun nextMonth() {
        if (_selectedMonth.value >= currentMonth()) return
        val cal = Calendar.getInstance()
        cal.time = monthFormat.parse(_selectedMonth.value) ?: return
        cal.add(Calendar.MONTH, 1)
        loadAttendance(monthFormat.format(cal.time))
    }

    fun isCurrentMonth() = _selectedMonth.value >= currentMonth()

    private fun currentMonth() = monthFormat.format(Calendar.getInstance().time)
}
