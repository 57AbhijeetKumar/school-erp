package com.example.myapplication.ui.home

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ClassData
import com.example.myapplication.data.model.StudentData
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading:      Boolean           = true,
    val isRefreshing:   Boolean           = false,
    val teacherName:    String            = "",
    val isClassTeacher: Boolean           = false,
    val classInfo:      ClassData?        = null,
    val students:       List<StudentData> = emptyList(),
    val error:          String?           = null,
    val sessionExpired: Boolean           = false
)

class HomeViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(
        HomeUiState(teacherName = prefManager.getTeacherName())
    )
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadMyClass()
    }

    fun loadMyClass() {
        val token = prefManager.getToken() ?: return
        // First load shows full-screen spinner; subsequent refreshes keep existing content visible
        val hasData = _uiState.value.teacherName.isNotBlank()
        viewModelScope.launch {
            _uiState.value = if (hasData)
                _uiState.value.copy(isRefreshing = true, error = null)
            else
                _uiState.value.copy(isLoading = true, error = null)
            try {
                val response = RetrofitClient.api.getMyClass("Bearer $token")
                if (response.isSuccessful) {
                    val body = response.body() ?: run {
                        _uiState.value = _uiState.value.copy(isLoading = false, isRefreshing = false, error = "Empty response from server")
                        return@launch
                    }
                    _uiState.value = HomeUiState(
                        isLoading      = false,
                        isRefreshing   = false,
                        teacherName    = prefManager.getTeacherName(),
                        isClassTeacher = body.isClassTeacher,
                        classInfo      = body.classInfo,
                        students       = body.students
                    )
                } else if (response.code() == 401 || response.code() == 403) {
                    prefManager.clear()
                    _uiState.value = HomeUiState(isLoading = false, isRefreshing = false, sessionExpired = true)
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false, isRefreshing = false,
                        error = "Failed to load class info"
                    )
                }
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(
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
                try { RetrofitClient.api.teacherLogout("Bearer $token") } catch (_: Exception) { /* ignore */ }
            }
        }
    }
}
