package com.example.myapplication.ui.leave

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ResolveLeaveRequest
import com.example.myapplication.data.model.StudentLeaveItem
import com.example.myapplication.data.model.SubmitLeaveRequest
import com.example.myapplication.data.model.TeacherLeaveItem
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.LeaveRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TeacherLeaveUiState(
    val isLoading:      Boolean               = true,
    val myLeaves:       List<TeacherLeaveItem> = emptyList(),
    val studentLeaves:  List<StudentLeaveItem> = emptyList(),
    val error:          String?               = null,
    val isSubmitting:   Boolean               = false,
    val submitSuccess:  Boolean               = false,
    val submitError:    String?               = null,
    val isClassTeacher: Boolean               = false
)

class TeacherLeaveViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = LeaveRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(TeacherLeaveUiState())
    val uiState: StateFlow<TeacherLeaveUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val (myLeavesResult, myClassResult) = coroutineScope {
                    Pair(
                        async { repository.getMyLeaves(token) }.await(),
                        async { repository.getMyClass(token) }.await()
                    )
                }
                val isClassTeacher = myClassResult is NetworkResult.Success &&
                        myClassResult.data.isClassTeacher

                val studentLeaves: List<StudentLeaveItem> = if (isClassTeacher) {
                    when (val r = repository.getStudentLeaveRequests(token)) {
                        is NetworkResult.Success -> r.data
                        else -> emptyList()
                    }
                } else emptyList()

                _uiState.value = _uiState.value.copy(
                    isLoading      = false,
                    myLeaves       = if (myLeavesResult is NetworkResult.Success) myLeavesResult.data else emptyList(),
                    studentLeaves  = studentLeaves,
                    isClassTeacher = isClassTeacher
                )
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Cannot connect to server")
            }
        }
    }

    fun submitLeave(fromDate: String, toDate: String, reason: String, leaveType: String) {
        val token = prefManager.getToken() ?: return
        if (fromDate.isBlank() || toDate.isBlank() || reason.isBlank()) {
            _uiState.value = _uiState.value.copy(submitError = "All fields are required")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, submitError = null, submitSuccess = false)
            when (repository.submitLeave(token, SubmitLeaveRequest(fromDate, toDate, reason.trim(), leaveType))) {
                is NetworkResult.Success -> {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, submitSuccess = true)
                    load()
                }
                else -> _uiState.value = _uiState.value.copy(
                    isSubmitting = false, submitError = "Failed to submit leave request"
                )
            }
        }
    }

    fun resolveStudentLeave(leaveId: String, action: String, note: String = "") {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            repository.resolveStudentLeave(token, leaveId, ResolveLeaveRequest(action, note))
            _uiState.value = _uiState.value.copy(
                studentLeaves = _uiState.value.studentLeaves.map {
                    if (it.id == leaveId)
                        it.copy(status = if (action == "approve") "approved" else "rejected")
                    else it
                }
            )
        }
    }

    fun clearSubmitState() {
        _uiState.value = _uiState.value.copy(submitSuccess = false, submitError = null)
    }
}
