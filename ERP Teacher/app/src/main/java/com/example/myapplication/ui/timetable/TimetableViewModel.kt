package com.example.myapplication.ui.timetable

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.SubstitutionItem
import com.example.myapplication.data.model.TimetableResponse
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.TimetableRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TimetableUiState(
    val isLoading:     Boolean                = true,
    val timetable:     TimetableResponse?     = null,
    val substitutions: List<SubstitutionItem> = emptyList(),
    val error:         String?                = null
)

class TimetableViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = TimetableRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(TimetableUiState())
    val uiState: StateFlow<TimetableUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                coroutineScope {
                    val ttDeferred   = async { repository.getTimetable(token) }
                    val subsDeferred = async { repository.getTodaySubstitutions(token) }
                    val ttResult     = ttDeferred.await()
                    val subsResult   = subsDeferred.await()

                    _uiState.value = TimetableUiState(
                        isLoading     = false,
                        timetable     = if (ttResult is NetworkResult.Success) ttResult.data else null,
                        substitutions = if (subsResult is NetworkResult.Success) subsResult.data else emptyList(),
                        error         = if (ttResult is NetworkResult.Error && ttResult.code != 404)
                                            "Failed to load timetable" else null
                    )
                }
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Cannot connect to server")
            }
        }
    }
}
