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
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TeacherLeaveUiState(
    val isLoading:       Boolean               = true,
    val myLeaves:        List<TeacherLeaveItem> = emptyList(),
    val studentLeaves:   List<StudentLeaveItem> = emptyList(),
    val error:           String?               = null,
    val isSubmitting:    Boolean               = false,
    val submitSuccess:   Boolean               = false,
    val submitError:     String?               = null,
    val isClassTeacher:  Boolean               = false
)

class TeacherLeaveViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(TeacherLeaveUiState())
    val uiState: StateFlow<TeacherLeaveUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val (myResp, myClassResp) = coroutineScope {
                    val myLeavesD = async { RetrofitClient.api.getMyLeaves("Bearer $token") }
                    val myClassD  = async { RetrofitClient.api.getMyClass("Bearer $token") }
                    Pair(myLeavesD.await(), myClassD.await())
                }
                val isClassTeacher = myClassResp.isSuccessful && myClassResp.body()?.isClassTeacher == true

                val studentLeaves = if (isClassTeacher) {
                    val studentResp = RetrofitClient.api.getStudentLeaveRequests("Bearer $token")
                    if (studentResp.isSuccessful) studentResp.body() ?: emptyList() else emptyList()
                } else emptyList()

                _uiState.value = _uiState.value.copy(
                    isLoading      = false,
                    myLeaves       = if (myResp.isSuccessful) myResp.body() ?: emptyList() else emptyList(),
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
            try {
                val response = RetrofitClient.api.submitTeacherLeave(
                    "Bearer $token",
                    SubmitLeaveRequest(fromDate, toDate, reason.trim(), leaveType)
                )
                if (response.isSuccessful) {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, submitSuccess = true)
                    load()
                } else {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, submitError = "Failed to submit leave request")
                }
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isSubmitting = false, submitError = "Cannot connect to server")
            }
        }
    }

    fun resolveStudentLeave(leaveId: String, action: String, note: String = "") {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            try {
                RetrofitClient.api.resolveStudentLeave("Bearer $token", leaveId, ResolveLeaveRequest(action, note))
                _uiState.value = _uiState.value.copy(
                    studentLeaves = _uiState.value.studentLeaves.map {
                        if (it.id == leaveId) it.copy(status = if (action == "approve") "approved" else "rejected") else it
                    }
                )
            } catch (_: Exception) { /* silent */ }
        }
    }

    fun clearSubmitState() {
        _uiState.value = _uiState.value.copy(submitSuccess = false, submitError = null)
    }
}
