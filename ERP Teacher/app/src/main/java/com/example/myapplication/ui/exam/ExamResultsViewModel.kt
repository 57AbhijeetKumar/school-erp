package com.example.myapplication.ui.exam

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ExamResultsData
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ExamResultsUiState(
    val isLoading: Boolean        = true,
    val data:      ExamResultsData? = null,
    val error:     String?        = null
)

class ExamResultsViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(ExamResultsUiState())
    val uiState: StateFlow<ExamResultsUiState> = _uiState.asStateFlow()

    fun load(examId: String) {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = ExamResultsUiState(isLoading = true)
            try {
                val response = RetrofitClient.api.getExamResults("Bearer $token", examId)
                if (response.isSuccessful) {
                    _uiState.value = ExamResultsUiState(isLoading = false, data = response.body())
                } else {
                    val msg = if (response.code() == 403) "Results not published yet" else "Failed to load results"
                    _uiState.value = ExamResultsUiState(isLoading = false, error = msg)
                }
            } catch (_: Exception) {
                _uiState.value = ExamResultsUiState(isLoading = false, error = "Cannot connect to server")
            }
        }
    }
}
