package com.example.myapplication.data.repository

import com.example.myapplication.data.model.ClassData
import com.example.myapplication.data.model.ComplaintsResponse
import com.example.myapplication.data.model.MyClassResponse
import com.example.myapplication.data.model.StudentData
import com.example.myapplication.data.model.SubmitComplaintRequest
import com.example.myapplication.data.remote.ApiService
import com.example.myapplication.data.util.NetworkResult
import com.example.myapplication.data.util.safeApiCall
import com.google.gson.JsonObject

class ComplaintRepository(private val api: ApiService) {

    suspend fun getComplaints(token: String): NetworkResult<ComplaintsResponse> =
        safeApiCall { api.getComplaints("Bearer $token") }

    suspend fun getSchoolStudents(token: String): NetworkResult<List<StudentData>> =
        safeApiCall { api.getSchoolStudents("Bearer $token") }

    suspend fun getSchoolClasses(token: String): NetworkResult<List<ClassData>> =
        safeApiCall { api.getSchoolClasses("Bearer $token") }

    suspend fun getMyClass(token: String): NetworkResult<MyClassResponse> =
        safeApiCall { api.getMyClass("Bearer $token") }

    suspend fun submitComplaint(token: String, request: SubmitComplaintRequest): NetworkResult<JsonObject> =
        safeApiCall { api.submitComplaint("Bearer $token", request) }

    suspend fun deleteComplaint(token: String, id: String): NetworkResult<JsonObject> =
        safeApiCall { api.deleteComplaint("Bearer $token", id) }
}
