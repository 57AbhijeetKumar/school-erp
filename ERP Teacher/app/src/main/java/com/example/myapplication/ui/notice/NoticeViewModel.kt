package com.example.myapplication.ui.notice

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.NoticeItem
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.NoticeRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class NoticeUiState(
    val isLoading: Boolean          = true,
    val notices:   List<NoticeItem> = emptyList(),
    val error:     String?          = null
)

class NoticeViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = NoticeRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(NoticeUiState())
    val uiState: StateFlow<NoticeUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = repository.getNotices(token)) {
                is NetworkResult.Success -> _uiState.value = NoticeUiState(
                    isLoading = false, notices = result.data
                )
                is NetworkResult.NetworkError -> _uiState.value = NoticeUiState(
                    isLoading = false, error = "Cannot connect to server"
                )
                else -> _uiState.value = NoticeUiState(isLoading = false)
            }
        }
    }
}
