package com.example.myapplication.data.repository

import com.example.myapplication.data.model.MyClassResponse
import com.example.myapplication.data.model.ResolveLeaveRequest
import com.example.myapplication.data.model.StudentLeaveItem
import com.example.myapplication.data.model.SubmitLeaveRequest
import com.example.myapplication.data.model.TeacherLeaveItem
import com.example.myapplication.data.remote.ApiService
import com.example.myapplication.data.util.NetworkResult
import com.example.myapplication.data.util.safeApiCall
import com.google.gson.JsonObject

class LeaveRepository(private val api: ApiService) {

    suspend fun getMyLeaves(token: String): NetworkResult<List<TeacherLeaveItem>> =
        safeApiCall { api.getMyLeaves("Bearer $token") }

    suspend fun getMyClass(token: String): NetworkResult<MyClassResponse> =
        safeApiCall { api.getMyClass("Bearer $token") }

    suspend fun getStudentLeaveRequests(token: String): NetworkResult<List<StudentLeaveItem>> =
        safeApiCall { api.getStudentLeaveRequests("Bearer $token") }

    suspend fun submitLeave(token: String, request: SubmitLeaveRequest): NetworkResult<JsonObject> =
        safeApiCall { api.submitTeacherLeave("Bearer $token", request) }

    suspend fun resolveStudentLeave(token: String, leaveId: String, request: ResolveLeaveRequest): NetworkResult<JsonObject> =
        safeApiCall { api.resolveStudentLeave("Bearer $token", leaveId, request) }
}
