package com.example.myapplication.ui.exam

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ExamItem
import com.example.myapplication.data.model.MarkEntry
import com.example.myapplication.data.model.StudentMarksEntry
import com.example.myapplication.data.model.StudentResultEntry
import com.example.myapplication.data.model.SubmitMarksRequest
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

// Mutable runtime state for marks entry
data class StudentMarksState(
    val studentId:  String,
    val name:       String,
    val rollNumber: String?,
    // subject name → current text input (empty string if not entered)
    val marks:      Map<String, String>
)

data class MarksEntryUiState(
    val isLoading:   Boolean                  = true,
    val exam:        ExamItem?                = null,
    val students:    List<StudentMarksState>  = emptyList(),
    val isSaving:    Boolean                  = false,
    val saveSuccess: Boolean                  = false,
    val error:       String?                  = null
)

class MarksEntryViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(MarksEntryUiState())
    val uiState: StateFlow<MarksEntryUiState> = _uiState.asStateFlow()

    fun loadExam(examId: String) {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = MarksEntryUiState(isLoading = true)
            try {
                val response = RetrofitClient.api.getExamForMarks("Bearer $token", examId)
                if (response.isSuccessful) {
                    val body = response.body() ?: run {
                        _uiState.value = MarksEntryUiState(isLoading = false, error = "Empty response from server")
                        return@launch
                    }
                    _uiState.value = MarksEntryUiState(
                        isLoading = false,
                        exam      = body.exam,
                        students  = body.students.map { s ->
                            StudentMarksState(
                                studentId  = s.studentId,
                                name       = s.name,
                                rollNumber = s.rollNumber,
                                marks      = s.marks.associate { m ->
                                    m.subject to (m.obtained?.toString() ?: "")
                                }
                            )
                        }
                    )
                } else {
                    _uiState.value = MarksEntryUiState(isLoading = false, error = "Failed to load marks")
                }
            } catch (_: Exception) {
                _uiState.value = MarksEntryUiState(isLoading = false, error = "Cannot connect to server")
            }
        }
    }

    fun updateMark(studentId: String, subject: String, value: String) {
        val current = _uiState.value
        val updated = current.students.map { s ->
            if (s.studentId == studentId)
                s.copy(marks = s.marks.toMutableMap().also { it[subject] = value })
            else s
        }
        _uiState.value = current.copy(students = updated, saveSuccess = false)
    }

    fun saveMarks(examId: String) {
        val token = prefManager.getToken() ?: return
        val state = _uiState.value
        if (state.students.isEmpty()) return

        viewModelScope.launch {
            _uiState.value = state.copy(isSaving = true, error = null)
            try {
                val results = state.students
                    .map { s ->
                        StudentResultEntry(
                            studentId = s.studentId,
                            marks     = s.marks.mapNotNull { (sub, value) ->
                                value.toIntOrNull()?.let { obtained ->
                                    MarkEntry(subject = sub, obtained = obtained)
                                }
                            }
                        )
                    }
                    .filter { it.marks.isNotEmpty() }  // skip students with no marks filled
                val response = RetrofitClient.api.submitMarks(
                    "Bearer $token", examId, SubmitMarksRequest(results)
                )
                if (response.isSuccessful) {
                    _uiState.value = _uiState.value.copy(isSaving = false, saveSuccess = true)
                } else {
                    _uiState.value = _uiState.value.copy(isSaving = false, error = "Failed to save marks")
                }
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isSaving = false, error = "Cannot connect to server")
            }
        }
    }
}
