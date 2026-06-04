package com.example.myapplication.ui.complaint

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ClassData
import com.example.myapplication.data.model.ComplaintItem
import com.example.myapplication.data.model.StudentData
import com.example.myapplication.data.model.SubmitComplaintRequest
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.ComplaintRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ComplaintUiState(
    val isLoading:       Boolean             = true,
    val myComplaints:    List<ComplaintItem> = emptyList(),
    val classComplaints: List<ComplaintItem> = emptyList(),
    val classes:         List<ClassData>     = emptyList(),
    val students:        List<StudentData>   = emptyList(),
    val error:           String?             = null,
    val isSubmitting:    Boolean             = false,
    val submitSuccess:   Boolean             = false,
    val submitError:     String?             = null,
    val isClassTeacher:  Boolean             = false
)

class TeacherComplaintViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = ComplaintRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(ComplaintUiState())
    val uiState: StateFlow<ComplaintUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val complaintsResult = repository.getComplaints(token)
                val studentsResult   = repository.getSchoolStudents(token)
                val classesResult    = repository.getSchoolClasses(token)
                val myClassResult    = repository.getMyClass(token)

                val complaints     = if (complaintsResult is NetworkResult.Success) complaintsResult.data else null
                val isClassTeacher = myClassResult is NetworkResult.Success && myClassResult.data.isClassTeacher

                _uiState.value = _uiState.value.copy(
                    isLoading       = false,
                    myComplaints    = complaints?.myComplaints    ?: emptyList(),
                    classComplaints = complaints?.classComplaints ?: emptyList(),
                    students        = if (studentsResult is NetworkResult.Success) studentsResult.data else emptyList(),
                    classes         = if (classesResult is NetworkResult.Success) classesResult.data else emptyList(),
                    isClassTeacher  = isClassTeacher
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
            when (repository.submitComplaint(token, SubmitComplaintRequest(studentId, category, severity, title, description))) {
                is NetworkResult.Success -> {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, submitSuccess = true)
                    load()
                }
                else -> _uiState.value = _uiState.value.copy(
                    isSubmitting = false, submitError = "Failed to raise complaint"
                )
            }
        }
    }

    fun deleteComplaint(id: String) {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            repository.deleteComplaint(token, id)
            load()
        }
    }

    fun clearSubmitState() {
        _uiState.value = _uiState.value.copy(submitSuccess = false, submitError = null)
    }
}
