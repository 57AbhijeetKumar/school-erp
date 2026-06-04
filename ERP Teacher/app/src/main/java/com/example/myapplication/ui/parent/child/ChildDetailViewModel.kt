package com.example.myapplication.ui.parent.child

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.*
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.ParentRepository
import com.example.myapplication.data.util.NetworkResult
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
    val isLoading: Boolean            = false,
    val data:      ChildFeesResponse? = null,
    val error:     String?            = null
)

data class LeaveState(
    val isLoading:    Boolean                  = false,
    val history:      List<StudentLeaveRecord> = emptyList(),
    val error:        String?                  = null,
    val isSubmitting: Boolean                  = false,
    val submitSuccess: Boolean                 = false,
    val submitError:  String?                  = null
)

data class TimetableState(
    val isLoading: Boolean                 = false,
    val data:      ChildTimetableResponse? = null,
    val error:     String?                 = null
)

data class ComplaintsState(
    val isLoading:    Boolean                   = false,
    val items:        List<ParentComplaintItem> = emptyList(),
    val error:        String?                   = null,
    val isSubmitting: Boolean                   = false,
    val submitSuccess: Boolean                  = false,
    val submitError:  String?                   = null
)

class ChildDetailViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager  = PreferenceManager(app)
    private val repository   = ParentRepository(RetrofitClient.api)
    private val monthFormat  = SimpleDateFormat("yyyy-MM", Locale.getDefault())

    private var studentId = ""

    private val _attendance   = MutableStateFlow(AttendanceState())
    val attendance: StateFlow<AttendanceState> = _attendance.asStateFlow()

    private val _homework     = MutableStateFlow(HomeworkState())
    val homework: StateFlow<HomeworkState> = _homework.asStateFlow()

    private val _exams        = MutableStateFlow(ExamsState())
    val exams: StateFlow<ExamsState> = _exams.asStateFlow()

    private val _fees         = MutableStateFlow(FeesState())
    val fees: StateFlow<FeesState> = _fees.asStateFlow()

    private val _leave        = MutableStateFlow(LeaveState())
    val leave: StateFlow<LeaveState> = _leave.asStateFlow()

    private val _timetable    = MutableStateFlow(TimetableState())
    val timetable: StateFlow<TimetableState> = _timetable.asStateFlow()

    private val _complaints   = MutableStateFlow(ComplaintsState())
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
            _attendance.value = when (val r = repository.getChildAttendance(token, studentId, month)) {
                is NetworkResult.Success -> AttendanceState(data = r.data)
                else -> AttendanceState(error = "Failed to load attendance")
            }
        }
    }

    fun loadHomework() {
        val token = prefManager.getParentToken() ?: return
        _homework.value = HomeworkState(isLoading = true)
        viewModelScope.launch {
            _homework.value = when (val r = repository.getChildHomework(token, studentId)) {
                is NetworkResult.Success -> HomeworkState(items = r.data)
                else -> HomeworkState(error = "Failed to load homework")
            }
        }
    }

    fun loadExams() {
        val token = prefManager.getParentToken() ?: return
        _exams.value = ExamsState(isLoading = true)
        viewModelScope.launch {
            _exams.value = when (val r = repository.getChildExams(token, studentId)) {
                is NetworkResult.Success -> ExamsState(items = r.data)
                else -> ExamsState(error = "Failed to load exams")
            }
        }
    }

    fun loadFees() {
        val token = prefManager.getParentToken() ?: return
        _fees.value = FeesState(isLoading = true)
        viewModelScope.launch {
            _fees.value = when (val r = repository.getChildFees(token, studentId)) {
                is NetworkResult.Success -> FeesState(data = r.data)
                else -> FeesState(error = "Failed to load fees")
            }
        }
    }

    fun loadLeaveHistory() {
        val token = prefManager.getParentToken() ?: return
        _leave.value = _leave.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            _leave.value = when (val r = repository.getLeaveHistory(token, studentId)) {
                is NetworkResult.Success -> LeaveState(history = r.data)
                else -> LeaveState(error = "Failed to load leave history")
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
            when (repository.submitLeave(token, studentId, ParentSubmitLeaveRequest(fromDate, toDate, reason.trim()))) {
                is NetworkResult.Success -> {
                    _leave.value = _leave.value.copy(isSubmitting = false, submitSuccess = true)
                    loadLeaveHistory()
                }
                else -> _leave.value = _leave.value.copy(
                    isSubmitting = false, submitError = "Failed to submit leave"
                )
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
            _timetable.value = when (val r = repository.getChildTimetable(token, studentId)) {
                is NetworkResult.Success -> TimetableState(data = r.data)
                else -> TimetableState(error = "Failed to load timetable")
            }
        }
    }

    fun loadComplaints() {
        val token = prefManager.getParentToken() ?: return
        _complaints.value = ComplaintsState(isLoading = true)
        viewModelScope.launch {
            _complaints.value = when (val r = repository.getChildComplaints(token, studentId)) {
                is NetworkResult.Success -> ComplaintsState(items = r.data)
                else -> ComplaintsState(error = "Failed to load complaints")
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
            when (repository.submitChildComplaint(
                token, studentId,
                SubmitParentComplaintRequest(category, severity, title.trim(), description.trim())
            )) {
                is NetworkResult.Success -> {
                    _complaints.value = _complaints.value.copy(isSubmitting = false, submitSuccess = true)
                    loadComplaints()
                }
                else -> _complaints.value = _complaints.value.copy(
                    isSubmitting = false, submitError = "Failed to raise complaint"
                )
            }
        }
    }

    fun deleteComplaint(id: String) {
        val token = prefManager.getParentToken() ?: return
        viewModelScope.launch {
            repository.deleteChildComplaint(token, id)
            loadComplaints()
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
