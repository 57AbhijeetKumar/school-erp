package com.example.erpparents.data.remote

import com.example.erpparents.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("api/parent/login")
    suspend fun parentLogin(@Body request: ParentLoginRequest): Response<ParentLoginResponse>

    @GET("api/parent/children")
    suspend fun getChildren(
        @Header("Authorization") token: String
    ): Response<List<ChildData>>

    @GET("api/parent/children/{studentId}/attendance")
    suspend fun getChildAttendance(
        @Header("Authorization") token: String,
        @Path("studentId") studentId: String,
        @Query("month") month: String
    ): Response<ChildAttendanceResponse>

    @GET("api/parent/children/{studentId}/homework")
    suspend fun getChildHomework(
        @Header("Authorization") token: String,
        @Path("studentId") studentId: String
    ): Response<List<ParentHomeworkItem>>

    @GET("api/parent/children/{studentId}/exams")
    suspend fun getChildExams(
        @Header("Authorization") token: String,
        @Path("studentId") studentId: String
    ): Response<List<ParentExamItem>>

    @GET("api/parent/children/{studentId}/fees")
    suspend fun getChildFees(
        @Header("Authorization") token: String,
        @Path("studentId") studentId: String
    ): Response<ChildFeesResponse>

    // ── Leave ─────────────────────────────────────────────────────────────────
    @POST("api/parent/children/{studentId}/leave")
    suspend fun submitLeave(
        @Header("Authorization") token: String,
        @Path("studentId") studentId: String,
        @Body request: SubmitLeaveRequest
    ): Response<com.google.gson.JsonObject>

    @GET("api/parent/children/{studentId}/leave")
    suspend fun getLeaveHistory(
        @Header("Authorization") token: String,
        @Path("studentId") studentId: String
    ): Response<List<StudentLeaveRecord>>

    // ── Timetable ─────────────────────────────────────────────────────────────
    @GET("api/parent/children/{studentId}/timetable")
    suspend fun getChildTimetable(
        @Header("Authorization") token: String,
        @Path("studentId") studentId: String
    ): Response<ChildTimetableResponse>

    // ── Notices ───────────────────────────────────────────────────────────────
    @GET("api/parent/notices")
    suspend fun getNotices(
        @Header("Authorization") token: String
    ): Response<List<ParentNoticeItem>>

    // ── Complaints ────────────────────────────────────────────────────────────
    @GET("api/parent/children/{studentId}/complaints")
    suspend fun getChildComplaints(
        @Header("Authorization") token: String,
        @Path("studentId") studentId: String
    ): Response<List<ParentComplaintItem>>

    @POST("api/parent/children/{studentId}/complaints")
    suspend fun submitChildComplaint(
        @Header("Authorization") token: String,
        @Path("studentId") studentId: String,
        @Body request: SubmitParentComplaintRequest
    ): Response<com.google.gson.JsonObject>

    @DELETE("api/parent/complaints/{id}")
    suspend fun deleteChildComplaint(
        @Header("Authorization") token: String,
        @Path("id") id: String
    ): Response<com.google.gson.JsonObject>
}
