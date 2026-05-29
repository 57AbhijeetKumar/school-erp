package com.example.myapplication.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit

class PreferenceManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("school_erp_prefs", Context.MODE_PRIVATE)

    // ── Token ──────────────────────────────────────────────────────────────

    fun saveToken(token: String) =
        prefs.edit { putString(KEY_TOKEN, token) }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun isLoggedIn(): Boolean = getToken() != null

    // ── Teacher info (stored at login for offline display) ─────────────────

    fun saveTeacher(id: String, name: String, mobile: String, subject: String?) {
        prefs.edit {
            putString(KEY_TEACHER_ID, id)
                .putString(KEY_TEACHER_NAME, name)
                .putString(KEY_TEACHER_MOBILE, mobile)
                .putString(KEY_TEACHER_SUBJECT, subject)
        }
    }

    fun getTeacherName(): String    = prefs.getString(KEY_TEACHER_NAME, "Teacher") ?: "Teacher"
    fun getTeacherMobile(): String  = prefs.getString(KEY_TEACHER_MOBILE, "") ?: ""
    fun getTeacherSubject(): String? = prefs.getString(KEY_TEACHER_SUBJECT, null)

    // ── Clear (logout) ─────────────────────────────────────────────────────

    fun clear() = prefs.edit { clear() }

    // ── Keys ───────────────────────────────────────────────────────────────

    companion object {
        private const val KEY_TOKEN           = "token"
        private const val KEY_TEACHER_ID      = "teacher_id"
        private const val KEY_TEACHER_NAME    = "teacher_name"
        private const val KEY_TEACHER_MOBILE  = "teacher_mobile"
        private const val KEY_TEACHER_SUBJECT = "teacher_subject"
    }
}
