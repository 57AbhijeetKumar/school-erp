package com.example.myapplication.ui.parent.login

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ParentLoginRequest
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ParentLoginUiState(
    val isLoading: Boolean = false,
    val error:     String? = null,
    val success:   Boolean = false
)

class ParentLoginViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(ParentLoginUiState())
    val uiState: StateFlow<ParentLoginUiState> = _uiState.asStateFlow()

    fun login(mobile: String, password: String) {
        if (mobile.isBlank() || password.isBlank()) {
            _uiState.value = ParentLoginUiState(error = "Enter mobile number and password")
            return
        }
        viewModelScope.launch {
            _uiState.value = ParentLoginUiState(isLoading = true)
            try {
                val response = RetrofitClient.api.parentLogin(ParentLoginRequest(mobile.trim(), password))
                if (response.isSuccessful) {
                    val body = response.body() ?: run {
                        _uiState.value = ParentLoginUiState(error = "Unexpected empty response from server")
                        return@launch
                    }
                    prefManager.saveParentToken(body.token)
                    prefManager.saveParentMobile(mobile.trim())
                    prefManager.saveParentChildren(body.children)
                    prefManager.saveRole("parent")
                    _uiState.value = ParentLoginUiState(success = true)
                } else {
                    _uiState.value = ParentLoginUiState(error = "Invalid mobile or password")
                }
            } catch (_: Exception) {
                _uiState.value = ParentLoginUiState(error = "Cannot connect to server")
            }
        }
    }
}
