package com.example.myapplication.data.repository

import com.example.myapplication.data.model.AttendanceResponse
import com.example.myapplication.data.model.MarkAttendanceRequest
import com.example.myapplication.data.remote.ApiService
import com.example.myapplication.data.util.NetworkResult
import com.example.myapplication.data.util.safeApiCall
import com.google.gson.JsonObject

class AttendanceRepository(private val api: ApiService) {

    suspend fun getAttendance(token: String, date: String): NetworkResult<AttendanceResponse> =
        safeApiCall { api.getAttendance("Bearer $token", date) }

    suspend fun markAttendance(token: String, request: MarkAttendanceRequest): NetworkResult<JsonObject> =
        safeApiCall { api.markAttendance("Bearer $token", request) }
}
