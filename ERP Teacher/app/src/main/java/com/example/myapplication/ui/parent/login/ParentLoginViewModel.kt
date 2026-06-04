package com.example.myapplication.ui.parent.login

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

sealed class ParentLoginEvent {
    object NavigateToParentHome : ParentLoginEvent()
}

data class ParentLoginUiState(
    val isLoading: Boolean = false,
    val error:     String? = null
)

class ParentLoginViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = AuthRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(ParentLoginUiState())
    val uiState: StateFlow<ParentLoginUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<ParentLoginEvent>()
    val events: SharedFlow<ParentLoginEvent> = _events.asSharedFlow()

    fun login(mobile: String, password: String) {
        if (mobile.isBlank() || password.isBlank()) {
            _uiState.value = ParentLoginUiState(error = "Enter mobile number and password")
            return
        }
        viewModelScope.launch {
            _uiState.value = ParentLoginUiState(isLoading = true)
            when (val result = repository.parentLogin(mobile.trim(), password)) {
                is NetworkResult.Success -> {
                    val body = result.data
                    prefManager.saveParentToken(body.token)
                    prefManager.saveParentMobile(mobile.trim())
                    prefManager.saveParentChildren(body.children)
                    prefManager.saveRole("parent")
                    _uiState.value = ParentLoginUiState()
                    _events.emit(ParentLoginEvent.NavigateToParentHome)
                }
                is NetworkResult.Error -> _uiState.value = ParentLoginUiState(
                    error = "Invalid mobile or password"
                )
                is NetworkResult.NetworkError -> _uiState.value = ParentLoginUiState(
                    error = "Cannot connect to server"
                )
            }
        }
    }
}
