package com.example.myapplication.data.repository

import com.example.myapplication.data.model.NoticeItem
import com.example.myapplication.data.remote.ApiService
import com.example.myapplication.data.util.NetworkResult
import com.example.myapplication.data.util.safeApiCall

class NoticeRepository(private val api: ApiService) {

    suspend fun getNotices(token: String): NetworkResult<List<NoticeItem>> =
        safeApiCall { api.getNotices("Bearer $token") }
}
