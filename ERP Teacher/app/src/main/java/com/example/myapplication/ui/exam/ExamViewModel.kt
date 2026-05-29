package com.example.myapplication.ui.exam

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ExamItem
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ExamListUiState(
    val isLoading: Boolean      = true,
    val exams:     List<ExamItem> = emptyList(),
    val error:     String?      = null
)

class ExamViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(ExamListUiState())
    val uiState: StateFlow<ExamListUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = ExamListUiState(isLoading = true)
            try {
                val response = RetrofitClient.api.getExams("Bearer $token")
                if (response.isSuccessful) {
                    _uiState.value = ExamListUiState(isLoading = false, exams = response.body() ?: emptyList())
                } else {
                    _uiState.value = ExamListUiState(isLoading = false, error = "Failed to load exams")
                }
            } catch (_: Exception) {
                _uiState.value = ExamListUiState(isLoading = false, error = "Cannot connect to server")
            }
        }
    }
}
