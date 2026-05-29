package com.example.erpparents.ui.notice

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.erpparents.data.local.PreferenceManager
import com.example.erpparents.data.model.ParentNoticeItem
import com.example.erpparents.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ParentNoticeUiState(
    val isLoading: Boolean              = true,
    val notices:   List<ParentNoticeItem> = emptyList(),
    val error:     String?              = null
)

class ParentNoticeViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(ParentNoticeUiState())
    val uiState: StateFlow<ParentNoticeUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val response = RetrofitClient.api.getNotices("Bearer $token")
                _uiState.value = ParentNoticeUiState(
                    isLoading = false,
                    notices   = if (response.isSuccessful) response.body() ?: emptyList() else emptyList()
                )
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Cannot connect to server")
            }
        }
    }
}
