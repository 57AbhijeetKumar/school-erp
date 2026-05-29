package com.example.myapplication.ui.homework

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.MarkSubmissionsRequest
import com.example.myapplication.data.model.SubmissionEntry
import com.example.myapplication.data.model.SubmissionRecord
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SubmissionUiState(
    val isLoading:   Boolean                = true,
    val title:       String                 = "",
    val canMark:     Boolean                = false,
    val students:    List<SubmissionRecord> = emptyList(),
    val error:       String?                = null,
    val isSaving:    Boolean                = false,
    val saveSuccess: Boolean                = false
)

class SubmissionViewModel(app: Application) : AndroidViewModel(app) {

    private val prefs = PreferenceManager(app)
    private val _uiState = MutableStateFlow(SubmissionUiState())
    val uiState: StateFlow<SubmissionUiState> = _uiState.asStateFlow()
    private var homeworkId = ""

    fun load(id: String) {
        homeworkId = id
        val token = prefs.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = SubmissionUiState(isLoading = true)
            try {
                val res = RetrofitClient.api.getSubmissions("Bearer $token", id)
                if (res.isSuccessful) {
                    val data = res.body()!!
                    _uiState.value = SubmissionUiState(isLoading = false, title = data.title, canMark = data.canMark, students = data.students)
                } else {
                    _uiState.value = SubmissionUiState(isLoading = false, error = "Failed to load submissions")
                }
            } catch (_: Exception) {
                _uiState.value = SubmissionUiState(isLoading = false, error = "Cannot connect to server")
            }
        }
    }

    fun updateStatus(studentId: String, status: String) {
        _uiState.value = _uiState.value.copy(
            students = _uiState.value.students.map { if (it.studentId == studentId) it.copy(status = status) else it }
        )
    }

    fun updateRemark(studentId: String, remark: String) {
        _uiState.value = _uiState.value.copy(
            students = _uiState.value.students.map { if (it.studentId == studentId) it.copy(remark = remark) else it }
        )
    }

    fun save() {
        val token = prefs.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, saveSuccess = false)
            try {
                val entries = _uiState.value.students.map { SubmissionEntry(it.studentId, it.status, it.remark) }
                val res = RetrofitClient.api.markSubmissions("Bearer $token", homeworkId, MarkSubmissionsRequest(entries))
                _uiState.value = if (res.isSuccessful)
                    _uiState.value.copy(isSaving = false, saveSuccess = true)
                else
                    _uiState.value.copy(isSaving = false, error = "Failed to save")
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isSaving = false, error = "Cannot connect to server")
            }
        }
    }

    fun clearSaveSuccess() { _uiState.value = _uiState.value.copy(saveSuccess = false) }
}
