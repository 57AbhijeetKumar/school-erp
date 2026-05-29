package com.example.erpparents.ui.home

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.erpparents.data.local.PreferenceManager
import com.example.erpparents.data.model.ChildData
import com.example.erpparents.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading:      Boolean        = true,
    val children:       List<ChildData> = emptyList(),
    val error:          String?        = null,
    val sessionExpired: Boolean        = false   // true → navigate to login
)

class HomeViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init { loadChildren() }

    fun loadChildren() {
        val token = prefManager.getToken()
        if (token == null) {
            _uiState.value = HomeUiState(isLoading = false, error = "Not logged in")
            return
        }
        viewModelScope.launch {
            _uiState.value = HomeUiState(isLoading = true)
            try {
                val response = RetrofitClient.api.getChildren("Bearer $token")
                if (response.isSuccessful) {
                    val children = response.body() ?: emptyList()
                    if (children.isEmpty()) {
                        prefManager.clear()
                        _uiState.value = HomeUiState(isLoading = false, sessionExpired = true)
                    } else {
                        prefManager.saveChildren(children)
                        _uiState.value = HomeUiState(isLoading = false, children = children)
                    }
                } else if (response.code() == 401 || response.code() == 403) {
                    prefManager.clear()
                    _uiState.value = HomeUiState(isLoading = false, sessionExpired = true)
                } else {
                    _uiState.value = HomeUiState(isLoading = false, error = "Failed to load children")
                }
            } catch (_: Exception) {
                _uiState.value = HomeUiState(isLoading = false, error = "Cannot connect to server")
            }
        }
    }

    fun logout(onLogout: () -> Unit) {
        prefManager.clear()
        onLogout()
    }
}
