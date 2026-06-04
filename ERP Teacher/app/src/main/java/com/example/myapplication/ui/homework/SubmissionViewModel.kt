package com.example.myapplication.ui.homework

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.MarkSubmissionsRequest
import com.example.myapplication.data.model.SubmissionEntry
import com.example.myapplication.data.model.SubmissionRecord
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.HomeworkRepository
import com.example.myapplication.data.util.NetworkResult
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

    private val prefs      = PreferenceManager(app)
    private val repository = HomeworkRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(SubmissionUiState())
    val uiState: StateFlow<SubmissionUiState> = _uiState.asStateFlow()
    private var homeworkId = ""

    fun load(id: String) {
        homeworkId = id
        val token = prefs.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = SubmissionUiState(isLoading = true)
            when (val result = repository.getSubmissions(token, id)) {
                is NetworkResult.Success -> {
                    val data = result.data
                    _uiState.value = SubmissionUiState(
                        isLoading = false,
                        title     = data.title,
                        canMark   = data.canMark,
                        students  = data.students
                    )
                }
                else -> _uiState.value = SubmissionUiState(
                    isLoading = false, error = "Failed to load submissions"
                )
            }
        }
    }

    fun updateStatus(studentId: String, status: String) {
        _uiState.value = _uiState.value.copy(
            students = _uiState.value.students.map {
                if (it.studentId == studentId) it.copy(status = status) else it
            }
        )
    }

    fun updateRemark(studentId: String, remark: String) {
        _uiState.value = _uiState.value.copy(
            students = _uiState.value.students.map {
                if (it.studentId == studentId) it.copy(remark = remark) else it
            }
        )
    }

    fun save() {
        val token = prefs.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, saveSuccess = false)
            val entries = _uiState.value.students.map { SubmissionEntry(it.studentId, it.status, it.remark) }
            when (repository.markSubmissions(token, homeworkId, MarkSubmissionsRequest(entries))) {
                is NetworkResult.Success -> _uiState.value = _uiState.value.copy(
                    isSaving = false, saveSuccess = true
                )
                else -> _uiState.value = _uiState.value.copy(isSaving = false, error = "Failed to save")
            }
        }
    }

    fun clearSaveSuccess() { _uiState.value = _uiState.value.copy(saveSuccess = false) }
}
