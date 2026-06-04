package com.example.myapplication.ui.exam

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ExamItem
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.ExamRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ExamListUiState(
    val isLoading: Boolean        = true,
    val exams:     List<ExamItem> = emptyList(),
    val error:     String?        = null
)

class ExamViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = ExamRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(ExamListUiState())
    val uiState: StateFlow<ExamListUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = ExamListUiState(isLoading = true)
            when (val result = repository.getExams(token)) {
                is NetworkResult.Success -> _uiState.value = ExamListUiState(
                    isLoading = false, exams = result.data
                )
                is NetworkResult.NetworkError -> _uiState.value = ExamListUiState(
                    isLoading = false, error = "Cannot connect to server"
                )
                else -> _uiState.value = ExamListUiState(isLoading = false, error = "Failed to load exams")
            }
        }
    }
}
