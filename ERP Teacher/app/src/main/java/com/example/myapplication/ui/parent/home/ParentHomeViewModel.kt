package com.example.myapplication.ui.parent.home

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ParentChildData
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ParentHomeUiState(
    val isLoading:      Boolean              = true,
    val children:       List<ParentChildData> = emptyList(),
    val error:          String?              = null,
    val sessionExpired: Boolean              = false
)

class ParentHomeViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(ParentHomeUiState())
    val uiState: StateFlow<ParentHomeUiState> = _uiState.asStateFlow()

    init { loadChildren() }

    fun loadChildren() {
        val token = prefManager.getParentToken()
        if (token == null) {
            _uiState.value = ParentHomeUiState(isLoading = false, sessionExpired = true)
            return
        }
        viewModelScope.launch {
            _uiState.value = ParentHomeUiState(isLoading = true)
            try {
                val response = RetrofitClient.api.getParentChildren("Bearer $token")
                when {
                    response.isSuccessful -> {
                        val children = response.body() ?: emptyList()
                        if (children.isEmpty()) {
                            prefManager.clearParent()
                            _uiState.value = ParentHomeUiState(isLoading = false, sessionExpired = true)
                        } else {
                            prefManager.saveParentChildren(children)
                            _uiState.value = ParentHomeUiState(isLoading = false, children = children)
                        }
                    }
                    response.code() == 401 || response.code() == 403 -> {
                        prefManager.clearParent()
                        _uiState.value = ParentHomeUiState(isLoading = false, sessionExpired = true)
                    }
                    else -> _uiState.value = ParentHomeUiState(isLoading = false, error = "Failed to load children")
                }
            } catch (_: Exception) {
                _uiState.value = ParentHomeUiState(isLoading = false, error = "Cannot connect to server")
            }
        }
    }

    fun logout(onLogout: () -> Unit) {
        prefManager.clearParent()
        onLogout()
    }
}
