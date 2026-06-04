package com.example.myapplication.data.repository

import com.example.myapplication.data.model.ExamItem
import com.example.myapplication.data.model.ExamMarksResponse
import com.example.myapplication.data.model.ExamResultsData
import com.example.myapplication.data.model.SubmitMarksRequest
import com.example.myapplication.data.remote.ApiService
import com.example.myapplication.data.util.NetworkResult
import com.example.myapplication.data.util.safeApiCall
import com.google.gson.JsonObject

class ExamRepository(private val api: ApiService) {

    suspend fun getExams(token: String): NetworkResult<List<ExamItem>> =
        safeApiCall { api.getExams("Bearer $token") }

    suspend fun getExamForMarks(token: String, examId: String): NetworkResult<ExamMarksResponse> =
        safeApiCall { api.getExamForMarks("Bearer $token", examId) }

    suspend fun submitMarks(token: String, examId: String, request: SubmitMarksRequest): NetworkResult<JsonObject> =
        safeApiCall { api.submitMarks("Bearer $token", examId, request) }

    suspend fun getExamResults(token: String, examId: String): NetworkResult<ExamResultsData> =
        safeApiCall { api.getExamResults("Bearer $token", examId) }
}
