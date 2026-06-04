package com.example.myapplication.data.util

import retrofit2.Response
import java.io.IOException

sealed class NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error(val code: Int = -1, val message: String) : NetworkResult<Nothing>()
    object NetworkError : NetworkResult<Nothing>()
}

suspend fun <T> safeApiCall(call: suspend () -> Response<T>): NetworkResult<T> = try {
    val response = call()
    when {
        response.isSuccessful && response.body() != null -> NetworkResult.Success(response.body()!!)
        response.isSuccessful -> NetworkResult.Error(response.code(), "Empty response")
        response.code() == 401 || response.code() == 403 -> NetworkResult.Error(response.code(), "Session expired")
        else -> NetworkResult.Error(response.code(), "Server error: ${response.code()}")
    }
} catch (e: IOException) {
    NetworkResult.NetworkError
} catch (e: Exception) {
    NetworkResult.Error(message = e.message ?: "Unknown error")
}
