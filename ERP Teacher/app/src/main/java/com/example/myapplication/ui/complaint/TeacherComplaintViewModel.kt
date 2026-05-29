package com.example.myapplication.ui.complaint

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ComplaintItem
import com.example.myapplication.data.model.ComplaintsResponse
import com.example.myapplication.data.model.StudentData
import com.example.myapplication.data.model.SubmitComplaintRequest
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ComplaintUiState(
    val isLoading:      Boolean              = true,
    val myComplaints:   List<ComplaintItem>  = emptyList(),
    val classComplaints: List<ComplaintItem> = emptyList(),
    val students:       List<StudentData>    = emptyList(),
    val error:          String?              = null,
    val isSubmitting:   Boolean              = false,
    val submitSuccess:  Boolean              = false,
    val submitError:    String?              = null,
    val isClassTeacher: Boolean              = false
)

class TeacherComplaintViewModel(app: Application) : AndroidViewModel(app) {
    private val prefManager = PreferenceManager(app)
    private val _uiState    = MutableStateFlow(ComplaintUiState())
    val uiState: StateFlow<ComplaintUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                // Load complaints, all school students (for complaint picker), and class info in parallel
                val complaintsResp = RetrofitClient.api.getComplaints("Bearer $token")
                val studentsResp   = RetrofitClient.api.getSchoolStudents("Bearer $token")
                val classResp      = RetrofitClient.api.getMyClass("Bearer $token")

                val complaints = if (complaintsResp.isSuccessful) complaintsResp.body()
                                 else ComplaintsResponse(emptyList(), emptyList())
                val classBody  = if (classResp.isSuccessful) classResp.body() else null

                _uiState.value = _uiState.value.copy(
                    isLoading       = false,
                    myComplaints    = complaints?.myComplaints    ?: emptyList(),
                    classComplaints = complaints?.classComplaints ?: emptyList(),
                    students        = if (studentsResp.isSuccessful) studentsResp.body() ?: emptyList() else emptyList(),
                    isClassTeacher  = classBody?.isClassTeacher   ?: false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun submitComplaint(studentId: String, category: String, severity: String, title: String, description: String) {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, submitError = null)
            try {
                val resp = RetrofitClient.api.submitComplaint(
                    "Bearer $token",
                    SubmitComplaintRequest(studentId, category, severity, title, description)
                )
                if (resp.isSuccessful) {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, submitSuccess = true)
                    load()
                } else {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        submitError  = "Failed to raise complaint"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isSubmitting = false, submitError = e.message)
            }
        }
    }

    fun deleteComplaint(id: String) {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            try {
                RetrofitClient.api.deleteComplaint("Bearer $token", id)
                load()
            } catch (_: Exception) {}
        }
    }

    fun clearSubmitState() {
        _uiState.value = _uiState.value.copy(submitSuccess = false, submitError = null)
    }
}
