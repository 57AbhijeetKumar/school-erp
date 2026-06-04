package com.example.myapplication.ui.parent.notice

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ParentNoticeItem
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.ParentRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ParentNoticeUiState(
    val isLoading: Boolean                = true,
    val notices:   List<ParentNoticeItem> = emptyList(),
    val error:     String?                = null
)

class ParentNoticeViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = ParentRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(ParentNoticeUiState())
    val uiState: StateFlow<ParentNoticeUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        val token = prefManager.getParentToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = repository.getNotices(token)) {
                is NetworkResult.Success -> _uiState.value = ParentNoticeUiState(
                    isLoading = false, notices = result.data
                )
                is NetworkResult.NetworkError -> _uiState.value = ParentNoticeUiState(
                    isLoading = false, error = "Cannot connect to server"
                )
                else -> _uiState.value = ParentNoticeUiState(isLoading = false)
            }
        }
    }
}
