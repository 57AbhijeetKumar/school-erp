package com.example.myapplication.ui.timetable

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.SubstitutionItem
import com.example.myapplication.data.model.TimetableResponse
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TimetableUiState(
    val isLoading:     Boolean               = true,
    val timetable:     TimetableResponse?    = null,
    val substitutions: List<SubstitutionItem> = emptyList(),
    val error:         String?               = null
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
                coroutineScope {
                    val timetableDeferred = async { RetrofitClient.api.getTimetable("Bearer $token") }
                    val subsDeferred      = async { RetrofitClient.api.getTodaySubstitutions("Bearer $token") }

                    val ttResponse   = timetableDeferred.await()
                    val subsResponse = subsDeferred.await()

                    _uiState.value = TimetableUiState(
                        isLoading     = false,
                        timetable     = if (ttResponse.isSuccessful) ttResponse.body() else null,
                        substitutions = if (subsResponse.isSuccessful) subsResponse.body() ?: emptyList() else emptyList(),
                        error         = if (!ttResponse.isSuccessful && ttResponse.code() != 404) "Failed to load timetable" else null
                    )
                }
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Cannot connect to server")
            }
        }
    }
}
