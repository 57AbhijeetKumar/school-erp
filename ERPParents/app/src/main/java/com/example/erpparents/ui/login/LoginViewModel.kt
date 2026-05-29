package com.example.erpparents.ui.login

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.erpparents.data.local.PreferenceManager
import com.example.erpparents.data.model.ParentLoginRequest
import com.example.erpparents.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val isLoading: Boolean = false,
    val error:     String? = null,
    val success:   Boolean = false
)

class LoginViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun isLoggedIn() = prefManager.getToken() != null

    fun login(mobile: String, password: String) {
        if (mobile.isBlank() || password.isBlank()) {
            _uiState.value = LoginUiState(error = "Enter mobile number and password")
            return
        }
        viewModelScope.launch {
            _uiState.value = LoginUiState(isLoading = true)
            try {
                val response = RetrofitClient.api.parentLogin(ParentLoginRequest(mobile.trim(), password))
                if (response.isSuccessful) {
                    val body = response.body() ?: run {
                        _uiState.value = LoginUiState(error = "Unexpected empty response from server")
                        return@launch
                    }
                    prefManager.saveToken(body.token)
                    prefManager.saveMobile(mobile.trim())
                    prefManager.saveChildren(body.children)
                    _uiState.value = LoginUiState(success = true)
                } else {
                    _uiState.value = LoginUiState(error = "Invalid mobile or password")
                }
            } catch (_: Exception) {
                _uiState.value = LoginUiState(error = "Cannot connect to server")
            }
        }
    }
}
