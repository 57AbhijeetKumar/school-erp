package com.example.myapplication.ui.homework

import android.app.Application
import android.net.Uri
import android.provider.OpenableColumns
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.data.model.ClassData
import com.example.myapplication.data.model.HomeworkItem
import com.example.myapplication.data.model.SubjectItem
import com.example.myapplication.data.remote.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

data class HomeworkUiState(
    val isLoading:        Boolean             = true,
    val homeworkList:     List<HomeworkItem>  = emptyList(),
    val classes:          List<ClassData>     = emptyList(),
    val subjects:         List<SubjectItem>   = emptyList(),
    val error:            String?             = null,
    val showAddDialog:    Boolean             = false,
    val isSubmitting:     Boolean             = false,
    val addError:         String?             = null,
    val selectedFileUris: List<Uri>           = emptyList()
)

class HomeworkViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)

    private val _uiState = MutableStateFlow(HomeworkUiState())
    val uiState: StateFlow<HomeworkUiState> = _uiState.asStateFlow()

    val teacherSubject: String? get() = prefManager.getTeacherSubject()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val hw           = RetrofitClient.api.getHomework("Bearer $token")
                val classResp    = RetrofitClient.api.getSchoolClasses("Bearer $token")
                val subjectResp  = RetrofitClient.api.getSubjects("Bearer $token")
                _uiState.value = HomeworkUiState(
                    isLoading    = false,
                    homeworkList = if (hw.isSuccessful) hw.body() ?: emptyList() else emptyList(),
                    classes      = if (classResp.isSuccessful) classResp.body() ?: emptyList() else emptyList(),
                    subjects     = if (subjectResp.isSuccessful) subjectResp.body() ?: emptyList() else emptyList(),
                )
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Cannot connect to server")
            }
        }
    }

    fun openAddDialog()  { _uiState.value = _uiState.value.copy(showAddDialog = true,  addError = null) }
    fun closeAddDialog() { _uiState.value = _uiState.value.copy(showAddDialog = false, addError = null, selectedFileUris = emptyList()) }

    fun addFiles(uris: List<Uri>) {
        val combined = (_uiState.value.selectedFileUris + uris).take(5)
        _uiState.value = _uiState.value.copy(selectedFileUris = combined)
    }

    fun removeFile(uri: Uri) {
        _uiState.value = _uiState.value.copy(
            selectedFileUris = _uiState.value.selectedFileUris.filter { it != uri }
        )
    }

    fun addHomework(classId: String, title: String, subject: String, description: String, dueDate: String) {
        val token = prefManager.getToken() ?: return
        if (title.isBlank())       { _uiState.value = _uiState.value.copy(addError = "Title is required");       return }
        if (description.isBlank()) { _uiState.value = _uiState.value.copy(addError = "Description is required"); return }
        if (classId.isBlank())     { _uiState.value = _uiState.value.copy(addError = "Select a class");          return }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, addError = null)
            try {
                val plain     = "text/plain".toMediaType()
                val fileParts = _uiState.value.selectedFileUris.mapNotNull { uriToMultipartPart(uri = it) }

                val response = RetrofitClient.api.addHomework(
                    bearerToken = "Bearer $token",
                    classId     = classId.trim().toRequestBody(plain),
                    title       = title.trim().toRequestBody(plain),
                    description = description.trim().toRequestBody(plain),
                    subject     = subject.trim().toRequestBody(plain),
                    dueDate     = dueDate.trim().toRequestBody(plain),
                    files       = fileParts
                )
                if (response.isSuccessful) {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, showAddDialog = false, selectedFileUris = emptyList())
                    load()
                } else {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, addError = "Failed to add homework")
                }
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isSubmitting = false, addError = "Cannot connect to server")
            }
        }
    }

    fun deleteHomework(id: String) {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            try {
                val response = RetrofitClient.api.deleteHomework("Bearer $token", id)
                if (response.isSuccessful) {
                    _uiState.value = _uiState.value.copy(
                        homeworkList = _uiState.value.homeworkList.filter { it.id != id }
                    )
                } else {
                    _uiState.value = _uiState.value.copy(error = "Failed to delete homework")
                }
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(error = "Cannot connect to server")
            }
        }
    }

    private fun uriToMultipartPart(uri: Uri): MultipartBody.Part? {
        return try {
            val context  = getApplication<Application>()
            val mimeType = context.contentResolver.getType(uri) ?: "application/octet-stream"
            val bytes    = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: return null
            val fileName = getFileName(uri)
            MultipartBody.Part.createFormData("files", fileName, bytes.toRequestBody(mimeType.toMediaType()))
        } catch (_: Exception) { null }
    }

    private fun getFileName(uri: Uri): String {
        var name = "attachment"
        val context = getApplication<Application>()
        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val col = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (col >= 0 && cursor.moveToFirst()) name = cursor.getString(col)
        }
        return name
    }
}
