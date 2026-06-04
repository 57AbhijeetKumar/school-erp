package com.example.myapplication.data.repository

import com.example.myapplication.data.model.MyClassResponse
import com.example.myapplication.data.remote.ApiService
import com.example.myapplication.data.util.NetworkResult
import com.example.myapplication.data.util.safeApiCall

class TeacherRepository(private val api: ApiService) {

    suspend fun getMyClass(token: String): NetworkResult<MyClassResponse> =
        safeApiCall { api.getMyClass("Bearer $token") }
}
