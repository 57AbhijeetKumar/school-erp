package com.example.myapplication.ui.login

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.LoginRequest
import com.example.myapplication.data.remote.RetrofitClient
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val isLoading: Boolean  = false,
    val error: String?      = null,
    val isSuccess: Boolean  = false
)

class LoginViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun login(mobile: String, password: String) {
        if (mobile.isBlank()) { _uiState.value = LoginUiState(error = "Enter your mobile number"); return }
        if (mobile.length != 10) { _uiState.value = LoginUiState(error = "Mobile number must be 10 digits"); return }
        if (password.isBlank()) { _uiState.value = LoginUiState(error = "Enter your password"); return }

        viewModelScope.launch {
            _uiState.value = LoginUiState(isLoading = true)
            try {
                val response = RetrofitClient.api.teacherLogin(LoginRequest(mobile, password))

                if (response.isSuccessful) {
                    val body = response.body() ?: run {
                        _uiState.value = LoginUiState(error = "Unexpected empty response from server")
                        return@launch
                    }
                    val teacher = body.teacher

                    prefManager.saveToken(body.token)
                    prefManager.saveTeacher(
                        id      = teacher.id,
                        name    = teacher.name,
                        mobile  = teacher.mobile,
                        subject = teacher.subject
                    )
                    _uiState.value = LoginUiState(isSuccess = true)
                } else {
                    val errorMsg = try {
                        val json = Gson().fromJson(
                            response.errorBody()?.string(), JsonObject::class.java
                        )
                        json.get("message")?.asString ?: "Login failed"
                    } catch (_: Exception) { "Login failed. Please try again." }
                    _uiState.value = LoginUiState(error = errorMsg)
                }
            } catch (_: Exception) {
                _uiState.value = LoginUiState(
                    error = "Cannot connect to server.\nMake sure the backend is running."
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
