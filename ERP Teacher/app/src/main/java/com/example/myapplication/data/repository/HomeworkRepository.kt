package com.example.myapplication.data.repository

import com.example.myapplication.data.model.ClassData
import com.example.myapplication.data.model.HomeworkItem
import com.example.myapplication.data.model.MarkSubmissionsRequest
import com.example.myapplication.data.model.SubjectItem
import com.example.myapplication.data.model.SubmissionsResponse
import com.example.myapplication.data.remote.ApiService
import com.example.myapplication.data.util.NetworkResult
import com.example.myapplication.data.util.safeApiCall
import com.google.gson.JsonObject
import okhttp3.MultipartBody
import okhttp3.RequestBody

class HomeworkRepository(private val api: ApiService) {

    suspend fun getHomework(token: String): NetworkResult<List<HomeworkItem>> =
        safeApiCall { api.getHomework("Bearer $token") }

    suspend fun addHomework(
        token: String,
        classId: RequestBody,
        title: RequestBody,
        description: RequestBody,
        subject: RequestBody,
        dueDate: RequestBody,
        files: List<MultipartBody.Part>
    ): NetworkResult<JsonObject> = safeApiCall {
        api.addHomework("Bearer $token", classId, title, description, subject, dueDate, files)
    }

    suspend fun deleteHomework(token: String, id: String): NetworkResult<JsonObject> =
        safeApiCall { api.deleteHomework("Bearer $token", id) }

    suspend fun getSubmissions(token: String, id: String): NetworkResult<SubmissionsResponse> =
        safeApiCall { api.getSubmissions("Bearer $token", id) }

    suspend fun markSubmissions(token: String, id: String, request: MarkSubmissionsRequest): NetworkResult<JsonObject> =
        safeApiCall { api.markSubmissions("Bearer $token", id, request) }

    suspend fun getSchoolClasses(token: String): NetworkResult<List<ClassData>> =
        safeApiCall { api.getSchoolClasses("Bearer $token") }

    suspend fun getSubjects(token: String): NetworkResult<List<SubjectItem>> =
        safeApiCall { api.getSubjects("Bearer $token") }
}
