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
import com.example.myapplication.data.model.UpdateHomeworkRequest
import com.example.myapplication.data.remote.RetrofitClient
import com.example.myapplication.data.repository.HomeworkRepository
import com.example.myapplication.data.util.NetworkResult
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

data class HomeworkUiState(
    val isLoading:        Boolean            = true,
    val homeworkList:     List<HomeworkItem> = emptyList(),
    val classes:          List<ClassData>    = emptyList(),
    val subjects:         List<SubjectItem>  = emptyList(),
    val error:            String?            = null,
    val showAddDialog:    Boolean            = false,
    val isSubmitting:     Boolean            = false,
    val addError:         String?            = null,
    val selectedFileUris: List<Uri>          = emptyList(),
    val editingHomework:  HomeworkItem?      = null,
    val editError:        String?            = null
)

class HomeworkViewModel(app: Application) : AndroidViewModel(app) {

    private val prefManager = PreferenceManager(app)
    private val repository  = HomeworkRepository(RetrofitClient.api)

    private val _uiState = MutableStateFlow(HomeworkUiState())
    val uiState: StateFlow<HomeworkUiState> = _uiState.asStateFlow()

    val teacherSubject: String? get() = prefManager.getTeacherSubject()

    init { load() }

    fun load() {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val (hwResult, classResult, subjectResult) = coroutineScope {
                    Triple(
                        async { repository.getHomework(token) }.await(),
                        async { repository.getSchoolClasses(token) }.await(),
                        async { repository.getSubjects(token) }.await()
                    )
                }
                _uiState.value = HomeworkUiState(
                    isLoading    = false,
                    homeworkList = if (hwResult is NetworkResult.Success) hwResult.data else emptyList(),
                    classes      = if (classResult is NetworkResult.Success) classResult.data else emptyList(),
                    subjects     = if (subjectResult is NetworkResult.Success) subjectResult.data else emptyList()
                )
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Cannot connect to server")
            }
        }
    }

    fun openAddDialog()  { _uiState.value = _uiState.value.copy(showAddDialog = true,  addError = null) }
    fun closeAddDialog() { _uiState.value = _uiState.value.copy(showAddDialog = false, addError = null, selectedFileUris = emptyList()) }

    fun openEditDialog(hw: HomeworkItem) { _uiState.value = _uiState.value.copy(editingHomework = hw, editError = null) }
    fun closeEditDialog() { _uiState.value = _uiState.value.copy(editingHomework = null, editError = null) }

    fun updateHomework(id: String, title: String, description: String, subject: String, dueDate: String) {
        val token = prefManager.getToken() ?: return
        if (title.isBlank())       { _uiState.value = _uiState.value.copy(editError = "Title is required");       return }
        if (description.isBlank()) { _uiState.value = _uiState.value.copy(editError = "Description is required"); return }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, editError = null)
            when (val result = repository.updateHomework(token, id, UpdateHomeworkRequest(title.trim(), description.trim(), subject.trim(), dueDate.trim()))) {
                is NetworkResult.Success -> {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, editingHomework = null)
                    load()
                }
                is NetworkResult.Error -> _uiState.value = _uiState.value.copy(
                    isSubmitting = false, editError = result.message ?: "Failed to update homework"
                )
                is NetworkResult.NetworkError -> _uiState.value = _uiState.value.copy(
                    isSubmitting = false, editError = "Cannot connect to server"
                )
            }
        }
    }

    fun addFiles(uris: List<Uri>) {
        _uiState.value = _uiState.value.copy(
            selectedFileUris = (_uiState.value.selectedFileUris + uris).take(5)
        )
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
            val plain     = "text/plain".toMediaType()
            val fileParts = _uiState.value.selectedFileUris.mapNotNull { uriToMultipartPart(it) }
            when (repository.addHomework(
                token,
                classId.trim().toRequestBody(plain),
                title.trim().toRequestBody(plain),
                description.trim().toRequestBody(plain),
                subject.trim().toRequestBody(plain),
                dueDate.trim().toRequestBody(plain),
                fileParts
            )) {
                is NetworkResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false, showAddDialog = false, selectedFileUris = emptyList()
                    )
                    load()
                }
                else -> _uiState.value = _uiState.value.copy(
                    isSubmitting = false, addError = "Failed to add homework"
                )
            }
        }
    }

    fun deleteHomework(id: String) {
        val token = prefManager.getToken() ?: return
        viewModelScope.launch {
            when (repository.deleteHomework(token, id)) {
                is NetworkResult.Success -> _uiState.value = _uiState.value.copy(
                    homeworkList = _uiState.value.homeworkList.filter { it.id != id }
                )
                else -> _uiState.value = _uiState.value.copy(error = "Failed to delete homework")
            }
        }
    }

    private fun uriToMultipartPart(uri: Uri): MultipartBody.Part? {
        return try {
            val context  = getApplication<Application>()
            val mimeType = context.contentResolver.getType(uri) ?: "application/octet-stream"
            val bytes    = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: return null
            MultipartBody.Part.createFormData("files", getFileName(uri), bytes.toRequestBody(mimeType.toMediaType()))
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
