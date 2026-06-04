package com.example.myapplication.ui.exam

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ExamResultsData
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.ExamRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ExamResultsUiState(
    val isLoading: Boolean          = true,
    val data:      ExamResultsData? = null,
    val error:     String?          = null
)

class ExamResultsViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = ExamRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(ExamResultsUiState())
    val uiState: StateFlow<ExamResultsUiState> = _uiState.asStateFlow()

    fun load(examId: String) {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = ExamResultsUiState(isLoading = true)
            when (val result = repository.getExamResults(token, examId)) {
                is NetworkResult.Success -> _uiState.value = ExamResultsUiState(
                    isLoading = false, data = result.data
                )
                is NetworkResult.Error -> _uiState.value = ExamResultsUiState(
                    isLoading = false,
                    error = if (result.code == 403) "Results not published yet" else "Failed to load results"
                )
                is NetworkResult.NetworkError -> _uiState.value = ExamResultsUiState(
                    isLoading = false, error = "Cannot connect to server"
                )
            }
        }
    }
}
