package com.example.myapplication.ui.login

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.AuthRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class LoginEvent {
    object NavigateToHome : LoginEvent()
}

data class LoginUiState(
    val isLoading: Boolean = false,
    val error: String?     = null
)

class LoginViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = AuthRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<LoginEvent>()
    val events: SharedFlow<LoginEvent> = _events.asSharedFlow()

    fun login(mobile: String, password: String) {
        if (mobile.isBlank())       { _uiState.value = LoginUiState(error = "Enter your mobile number");      return }
        if (mobile.length != 10)    { _uiState.value = LoginUiState(error = "Mobile number must be 10 digits"); return }
        if (password.isBlank())     { _uiState.value = LoginUiState(error = "Enter your password");           return }

        viewModelScope.launch {
            _uiState.value = LoginUiState(isLoading = true)
            when (val result = repository.teacherLogin(mobile, password)) {
                is NetworkResult.Success -> {
                    val body = result.data
                    prefManager.saveToken(body.token)
                    prefManager.saveRole("teacher")
                    prefManager.saveTeacher(
                        id      = body.teacher.id,
                        name    = body.teacher.name,
                        mobile  = body.teacher.mobile,
                        subject = body.teacher.subject
                    )
                    _uiState.value = LoginUiState()
                    _events.emit(LoginEvent.NavigateToHome)
                }
                is NetworkResult.Error -> _uiState.value = LoginUiState(
                    error = if (result.code == 401 || result.code == 403)
                        "Invalid mobile or password"
                    else
                        "Login failed. Please try again."
                )
                is NetworkResult.NetworkError -> _uiState.value = LoginUiState(
                    error = "Cannot connect to server.\nMake sure the backend is running."
                )
            }
        }
    }

    fun clearError() { _uiState.value = _uiState.value.copy(error = null) }
}
