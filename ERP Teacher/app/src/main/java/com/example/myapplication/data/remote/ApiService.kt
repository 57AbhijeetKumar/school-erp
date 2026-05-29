package com.example.myapplication.data.remote

import com.example.myapplication.data.model.*
import com.google.gson.JsonObject
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("api/auth/teacher/login")
    suspend fun teacherLogin(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/auth/teacher/logout")
    suspend fun teacherLogout(@Header("Authorization") bearerToken: String): Response<JsonObject>

    @GET("api/app/my-class")
    suspend fun getMyClass(@Header("Authorization") bearerToken: String): Response<MyClassResponse>

    @GET("api/app/attendance")
    suspend fun getAttendance(@Header("Authorization") bearerToken: String, @Query("date") date: String): Response<AttendanceResponse>

    @POST("api/app/attendance")
    suspend fun markAttendance(@Header("Authorization") bearerToken: String, @Body request: MarkAttendanceRequest): Response<JsonObject>

    @GET("api/app/classes")
    suspend fun getSchoolClasses(@Header("Authorization") bearerToken: String): Response<List<ClassData>>

    @GET("api/app/students")
    suspend fun getSchoolStudents(@Header("Authorization") bearerToken: String): Response<List<StudentData>>

    @GET("api/app/homework")
    suspend fun getHomework(@Header("Authorization") bearerToken: String): Response<List<HomeworkItem>>

    @Multipart
    @POST("api/app/homework")
    suspend fun addHomework(
        @Header("Authorization") bearerToken: String,
        @Part("classId")     classId:     RequestBody,
        @Part("title")       title:       RequestBody,
        @Part("description") description: RequestBody,
        @Part("subject")     subject:     RequestBody,
        @Part("dueDate")     dueDate:     RequestBody,
        @Part files: List<MultipartBody.Part>
    ): Response<JsonObject>

    @DELETE("api/app/homework/{id}")
    suspend fun deleteHomework(@Header("Authorization") bearerToken: String, @Path("id") id: String): Response<JsonObject>

    @GET("api/app/homework/{id}/submissions")
    suspend fun getSubmissions(@Header("Authorization") bearerToken: String, @Path("id") id: String): Response<SubmissionsResponse>

    @POST("api/app/homework/{id}/submissions")
    suspend fun markSubmissions(@Header("Authorization") bearerToken: String, @Path("id") id: String, @Body request: MarkSubmissionsRequest): Response<JsonObject>

    @GET("api/app/exams")
    suspend fun getExams(@Header("Authorization") bearerToken: String): Response<List<ExamItem>>

    @GET("api/app/exams/{id}/marks")
    suspend fun getExamForMarks(@Header("Authorization") bearerToken: String, @Path("id") id: String): Response<ExamMarksResponse>

    @POST("api/app/exams/{id}/marks")
    suspend fun submitMarks(@Header("Authorization") bearerToken: String, @Path("id") id: String, @Body request: SubmitMarksRequest): Response<JsonObject>

    @GET("api/app/exams/{id}/results")
    suspend fun getExamResults(@Header("Authorization") bearerToken: String, @Path("id") id: String): Response<ExamResultsData>

    // ── Notice ────────────────────────────────────────────────────────────────
    @GET("api/app/notices")
    suspend fun getNotices(@Header("Authorization") bearerToken: String): Response<List<NoticeItem>>

    // ── Timetable ─────────────────────────────────────────────────────────────
    @GET("api/app/timetable")
    suspend fun getTimetable(@Header("Authorization") bearerToken: String): Response<TimetableResponse>

    // ── Teacher Leave ─────────────────────────────────────────────────────────
    @POST("api/app/teacher-leave")
    suspend fun submitTeacherLeave(@Header("Authorization") bearerToken: String, @Body request: SubmitLeaveRequest): Response<JsonObject>

    @GET("api/app/teacher-leave")
    suspend fun getMyLeaves(@Header("Authorization") bearerToken: String): Response<List<TeacherLeaveItem>>

    // ── Student Leave (class teacher) ─────────────────────────────────────────
    @GET("api/app/leave-requests")
    suspend fun getStudentLeaveRequests(@Header("Authorization") bearerToken: String): Response<List<StudentLeaveItem>>

    @PATCH("api/app/leave-requests/{id}/resolve")
    suspend fun resolveStudentLeave(@Header("Authorization") bearerToken: String, @Path("id") id: String, @Body request: ResolveLeaveRequest): Response<JsonObject>

    // ── Complaints ────────────────────────────────────────────────────────────
    @GET("api/app/complaints")
    suspend fun getComplaints(@Header("Authorization") bearerToken: String): Response<ComplaintsResponse>

    @POST("api/app/complaints")
    suspend fun submitComplaint(
        @Header("Authorization") bearerToken: String,
        @Body request: SubmitComplaintRequest
    ): Response<JsonObject>

    @DELETE("api/app/complaints/{id}")
    suspend fun deleteComplaint(
        @Header("Authorization") bearerToken: String,
        @Path("id") id: String
    ): Response<JsonObject>

    // ── Subjects ──────────────────────────────────────────────────────────────
    @GET("api/app/subjects")
    suspend fun getSubjects(@Header("Authorization") bearerToken: String): Response<List<SubjectItem>>
}
