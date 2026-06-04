package com.example.myapplication.data.repository

import com.example.myapplication.data.model.SubstitutionItem
import com.example.myapplication.data.model.TimetableResponse
import com.example.myapplication.data.remote.ApiService
import com.example.myapplication.data.util.NetworkResult
import com.example.myapplication.data.util.safeApiCall

class TimetableRepository(private val api: ApiService) {

    suspend fun getTimetable(token: String): NetworkResult<TimetableResponse> =
        safeApiCall { api.getTimetable("Bearer $token") }

    suspend fun getTodaySubstitutions(token: String): NetworkResult<List<SubstitutionItem>> =
        safeApiCall { api.getTodaySubstitutions("Bearer $token") }
}
