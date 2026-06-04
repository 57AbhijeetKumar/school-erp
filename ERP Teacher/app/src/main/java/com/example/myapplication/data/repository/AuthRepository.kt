package com.example.myapplication.data.repository

import com.example.myapplication.data.model.LoginRequest
import com.example.myapplication.data.model.LoginResponse
import com.example.myapplication.data.model.ParentLoginRequest
import com.example.myapplication.data.model.ParentLoginResponse
import com.example.myapplication.data.remote.ApiService
import com.example.myapplication.data.util.NetworkResult
import com.example.myapplication.data.util.safeApiCall

class AuthRepository(private val api: ApiService) {

    suspend fun teacherLogin(mobile: String, password: String): NetworkResult<LoginResponse> =
        safeApiCall { api.teacherLogin(LoginRequest(mobile, password)) }

    suspend fun parentLogin(mobile: String, password: String): NetworkResult<ParentLoginResponse> =
        safeApiCall { api.parentLogin(ParentLoginRequest(mobile, password)) }
}
