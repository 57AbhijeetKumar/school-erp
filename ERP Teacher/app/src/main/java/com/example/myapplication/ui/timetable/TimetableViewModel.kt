package com.example.myapplication.ui.timetable

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.TimetableResponse
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TimetableUiState(
    val isLoading:  Boolean            = true,
    val timetable:  TimetableResponse? = null,
    val error:      String?            = null
)

class TimetableViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(TimetableUiState())
    val uiState: StateFlow<TimetableUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val response = RetrofitClient.api.getTimetable("Bearer $token")
                _uiState.value = TimetableUiState(
                    isLoading = false,
                    timetable = if (response.isSuccessful) response.body() else null,
                    error     = if (!response.isSuccessful && response.code() != 404) "Failed to load timetable" else null
                )
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Cannot connect to server")
            }
        }
    }
}
