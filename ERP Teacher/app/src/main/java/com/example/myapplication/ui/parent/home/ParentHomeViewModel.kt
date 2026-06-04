package com.example.myapplication.ui.parent.home

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ParentChildData
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.ParentRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ParentHomeEvent {
    object SessionExpired : ParentHomeEvent()
}

data class ParentHomeUiState(
    val isLoading: Boolean               = true,
    val children:  List<ParentChildData> = emptyList(),
    val error:     String?               = null
)

class ParentHomeViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = ParentRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(ParentHomeUiState())
    val uiState: StateFlow<ParentHomeUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<ParentHomeEvent>()
    val events: SharedFlow<ParentHomeEvent> = _events.asSharedFlow()

    init { loadChildren() }

    fun loadChildren() {
        val token = prefManager.getParentToken()
        if (token == null) {
            viewModelScope.launch { _events.emit(ParentHomeEvent.SessionExpired) }
            return
        }
        viewModelScope.launch {
            _uiState.value = ParentHomeUiState(isLoading = true)
            when (val result = repository.getChildren(token)) {
                is NetworkResult.Success -> {
                    val children = result.data
                    if (children.isEmpty()) {
                        prefManager.clearParent()
                        _events.emit(ParentHomeEvent.SessionExpired)
                    } else {
                        prefManager.saveParentChildren(children)
                        _uiState.value = ParentHomeUiState(isLoading = false, children = children)
                    }
                }
                is NetworkResult.Error -> {
                    if (result.code == 401 || result.code == 403) {
                        prefManager.clearParent()
                        _events.emit(ParentHomeEvent.SessionExpired)
                    } else {
                        _uiState.value = ParentHomeUiState(isLoading = false, error = "Failed to load children")
                    }
                }
                is NetworkResult.NetworkError -> _uiState.value = ParentHomeUiState(
                    isLoading = false, error = "Cannot connect to server"
                )
            }
        }
    }

    fun logout(onLogout: () -> Unit) {
        prefManager.clearParent()
        onLogout()
    }
}
