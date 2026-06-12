package com.example.myapplication.ui.exam

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ExamItem
import com.example.myapplication.data.model.MarkEntry
import com.example.myapplication.data.model.StudentResultEntry
import com.example.myapplication.data.model.SubmitMarksRequest
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.ExamRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class StudentMarksState(
    val studentId:  String,
    val name:       String,
    val rollNumber: String?,
    val marks:      Map<String, String>
)

data class MarksEntryUiState(
    val isLoading:   Boolean                 = true,
    val exam:        ExamItem?               = null,
    val students:    List<StudentMarksState> = emptyList(),
    val isSaving:    Boolean                 = false,
    val saveSuccess: Boolean                 = false,
    val error:       String?                 = null
)

class MarksEntryViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = ExamRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(MarksEntryUiState())
    val uiState: StateFlow<MarksEntryUiState> = _uiState.asStateFlow()

    fun loadExam(examId: String) {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = MarksEntryUiState(isLoading = true)
            when (val result = repository.getExamForMarks(token, examId)) {
                is NetworkResult.Success -> {
                    val body = result.data
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
                }
                is NetworkResult.NetworkError -> _uiState.value = MarksEntryUiState(
                    isLoading = false, error = "Cannot connect to server"
                )
                else -> _uiState.value = MarksEntryUiState(isLoading = false, error = "Failed to load marks")
            }
        }
    }

    fun updateMark(studentId: String, subject: String, value: String) {
        val current = _uiState.value
        _uiState.value = current.copy(
            students = current.students.map { s ->
                if (s.studentId == studentId)
                    s.copy(marks = s.marks.toMutableMap().also { it[subject] = value })
                else s
            },
            saveSuccess = false
        )
    }

    fun saveMarks(examId: String) {
        val token = prefManager.getToken() ?: return
        val state = _uiState.value
        if (state.students.isEmpty()) return

        viewModelScope.launch {
            _uiState.value = state.copy(isSaving = true, error = null)
            val results = state.students
                .map { s ->
                    StudentResultEntry(
                        studentId = s.studentId,
                        marks     = s.marks.mapNotNull { (sub, value) ->
                            value.toIntOrNull()?.let { MarkEntry(subject = sub, obtained = it) }
                        }
                    )
                }
                .filter { it.marks.isNotEmpty() }
            when (val result = repository.submitMarks(token, examId, SubmitMarksRequest(results))) {
                is NetworkResult.Success -> _uiState.value = _uiState.value.copy(
                    isSaving = false, saveSuccess = true
                )
                is NetworkResult.Error -> _uiState.value = _uiState.value.copy(
                    isSaving = false, error = result.message
                )
                is NetworkResult.NetworkError -> _uiState.value = _uiState.value.copy(
                    isSaving = false, error = "Cannot connect to server"
                )
            }
        }
    }
}
