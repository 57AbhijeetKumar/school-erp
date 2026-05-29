package com.example.myapplication.ui.attendance

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.AttendanceEntry
import com.example.myapplication.data.model.AttendanceRecord
import com.example.myapplication.data.model.MarkAttendanceRequest
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

data class AttendanceUiState(
    val isLoading:  Boolean               = true,
    val isSaving:   Boolean               = false,
    val isMarked:   Boolean               = false,
    val date:       String                = "",
    val records:    List<AttendanceRecord> = emptyList(),
    val error:      String?               = null,
    val saveSuccess: Boolean              = false
)

class AttendanceViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val dateFormat   = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    private val displayFormat = SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault())

    private val calendar = Calendar.getInstance()

    private val _uiState = MutableStateFlow(AttendanceUiState(date = todayString()))
    val uiState: StateFlow<AttendanceUiState> = _uiState.asStateFlow()

    private val _displayDate = MutableStateFlow(displayFormat.format(calendar.time))
    val displayDate: StateFlow<String> = _displayDate.asStateFlow()

    init { fetchAttendance() }

    fun goToPreviousDay() {
        calendar.add(Calendar.DAY_OF_YEAR, -1)
        onDateChanged()
    }

    fun goToNextDay() {
        val todayStr = dateFormat.format(Calendar.getInstance().time)
        val calStr   = dateFormat.format(calendar.time)
        if (calStr < todayStr) {          // compare date strings, not datetime objects
            calendar.add(Calendar.DAY_OF_YEAR, 1)
            onDateChanged()
        }
    }

    fun isToday(): Boolean {
        val todayStr = dateFormat.format(Calendar.getInstance().time)
        return dateFormat.format(calendar.time) == todayStr
    }

    private fun onDateChanged() {
        _displayDate.value = displayFormat.format(calendar.time)
        _uiState.value = AttendanceUiState(date = dateFormat.format(calendar.time))
        fetchAttendance()
    }

    fun toggleStatus(studentId: String) {
        val updated = _uiState.value.records.map { r ->
            if (r.studentId == studentId)
                r.copy(status = when (r.status) {
                    "present" -> "absent"
                    "absent"  -> "late"
                    else      -> "present"
                })
            else r
        }
        _uiState.value = _uiState.value.copy(records = updated, saveSuccess = false)
    }

    fun setStatus(studentId: String, status: String) {
        val updated = _uiState.value.records.map { r ->
            if (r.studentId == studentId) r.copy(status = status) else r
        }
        _uiState.value = _uiState.value.copy(records = updated, saveSuccess = false)
    }

    fun markAllPresent() {
        val updated = _uiState.value.records.map { it.copy(status = "present") }
        _uiState.value = _uiState.value.copy(records = updated, saveSuccess = false)
    }

    fun saveAttendance() {
        val token = prefManager.getToken() ?: return
        val state = _uiState.value
        if (state.records.isEmpty()) return

        viewModelScope.launch {
            _uiState.value = state.copy(isSaving = true, saveSuccess = false, error = null)
            try {
                val request = MarkAttendanceRequest(
                    date = state.date,
                    records = state.records.map { AttendanceEntry(it.studentId, it.status) }
                )
                val response = RetrofitClient.api.markAttendance("Bearer $token", request)
                if (response.isSuccessful) {
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        isMarked = true,
                        saveSuccess = true
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        error = "Failed to save attendance"
                    )
                }
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(
                    isSaving = false,
                    error = "Cannot connect to server"
                )
            }
        }
    }

    private fun fetchAttendance() {
        val token = prefManager.getToken() ?: return
        val date  = dateFormat.format(calendar.time)

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val response = RetrofitClient.api.getAttendance("Bearer $token", date)
                if (response.isSuccessful) {
                    val body = response.body() ?: run {
                        _uiState.value = _uiState.value.copy(isLoading = false, error = "Empty response from server")
                        return@launch
                    }
                    _uiState.value = AttendanceUiState(
                        isLoading = false,
                        date      = body.date,
                        isMarked  = body.isMarked,
                        records   = body.records.toMutableList()
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to load attendance"
                    )
                }
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Cannot connect to server"
                )
            }
        }
    }

    private fun todayString() = dateFormat.format(Calendar.getInstance().time)
}
