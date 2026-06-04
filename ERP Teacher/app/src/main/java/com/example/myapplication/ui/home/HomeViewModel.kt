package com.example.myapplication.ui.home

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ClassData
import com.example.myapplication.data.model.StudentData
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.TeacherRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class HomeEvent {
    object SessionExpired : HomeEvent()
}

data class HomeUiState(
    val isLoading:      Boolean           = true,
    val isRefreshing:   Boolean           = false,
    val teacherName:    String            = "",
    val isClassTeacher: Boolean           = false,
    val classInfo:      ClassData?        = null,
    val students:       List<StudentData> = emptyList(),
    val error:          String?           = null
)

class HomeViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = TeacherRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(
        HomeUiState(teacherName = prefManager.getTeacherName())
    )
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<HomeEvent>()
    val events: SharedFlow<HomeEvent> = _events.asSharedFlow()

    init { loadMyClass() }

    fun loadMyClass() {
        val token = prefManager.getToken() ?: return
        val hasData = _uiState.value.teacherName.isNotBlank()
        viewModelScope.launch {
            _uiState.value = if (hasData)
                _uiState.value.copy(isRefreshing = true, error = null)
            else
                _uiState.value.copy(isLoading = true, error = null)
            when (val result = repository.getMyClass(token)) {
                is NetworkResult.Success -> {
                    val body = result.data
                    _uiState.value = HomeUiState(
                        isLoading      = false,
                        isRefreshing   = false,
                        teacherName    = prefManager.getTeacherName(),
                        isClassTeacher = body.isClassTeacher,
                        classInfo      = body.classInfo,
                        students       = body.students
                    )
                }
                is NetworkResult.Error -> {
                    if (result.code == 401 || result.code == 403) {
                        prefManager.clear()
                        _events.emit(HomeEvent.SessionExpired)
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false, isRefreshing = false,
                            error = "Failed to load class info"
                        )
                    }
                }
                is NetworkResult.NetworkError -> _uiState.value = _uiState.value.copy(
                    isLoading = false, isRefreshing = false,
                    error = "Cannot connect to server"
                )
            }
        }
    }

    fun logout() {
        val token = prefManager.getToken()
        prefManager.clear()
        if (token != null) {
            viewModelScope.launch {
                try { RetrofitClient.api.teacherLogout("Bearer $token") } catch (_: Exception) { }
            }
        }
    }
}
