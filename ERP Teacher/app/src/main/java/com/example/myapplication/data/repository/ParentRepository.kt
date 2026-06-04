package com.example.myapplication.data.repository

import com.example.myapplication.data.model.*
import com.example.myapplication.data.remote.ApiService
import com.example.myapplication.data.util.NetworkResult
import com.example.myapplication.data.util.safeApiCall
import com.google.gson.JsonObject

class ParentRepository(private val api: ApiService) {

    suspend fun getChildren(token: String): NetworkResult<List<ParentChildData>> =
        safeApiCall { api.getParentChildren("Bearer $token") }

    suspend fun getChildAttendance(token: String, studentId: String, month: String): NetworkResult<ChildAttendanceResponse> =
        safeApiCall { api.getChildAttendance("Bearer $token", studentId, month) }

    suspend fun getChildHomework(token: String, studentId: String): NetworkResult<List<ParentHomeworkItem>> =
        safeApiCall { api.getChildHomework("Bearer $token", studentId) }

    suspend fun getChildExams(token: String, studentId: String): NetworkResult<List<ParentExamItem>> =
        safeApiCall { api.getChildExams("Bearer $token", studentId) }

    suspend fun getChildFees(token: String, studentId: String): NetworkResult<ChildFeesResponse> =
        safeApiCall { api.getChildFees("Bearer $token", studentId) }

    suspend fun submitLeave(token: String, studentId: String, request: ParentSubmitLeaveRequest): NetworkResult<JsonObject> =
        safeApiCall { api.submitParentLeave("Bearer $token", studentId, request) }

    suspend fun getLeaveHistory(token: String, studentId: String): NetworkResult<List<StudentLeaveRecord>> =
        safeApiCall { api.getParentLeaveHistory("Bearer $token", studentId) }

    suspend fun getChildTimetable(token: String, studentId: String): NetworkResult<ChildTimetableResponse> =
        safeApiCall { api.getChildTimetable("Bearer $token", studentId) }

    suspend fun getNotices(token: String): NetworkResult<List<ParentNoticeItem>> =
        safeApiCall { api.getParentNotices("Bearer $token") }

    suspend fun getChildComplaints(token: String, studentId: String): NetworkResult<List<ParentComplaintItem>> =
        safeApiCall { api.getChildComplaints("Bearer $token", studentId) }

    suspend fun submitChildComplaint(token: String, studentId: String, request: SubmitParentComplaintRequest): NetworkResult<JsonObject> =
        safeApiCall { api.submitChildComplaint("Bearer $token", studentId, request) }

    suspend fun deleteChildComplaint(token: String, id: String): NetworkResult<JsonObject> =
        safeApiCall { api.deleteChildComplaint("Bearer $token", id) }
}
