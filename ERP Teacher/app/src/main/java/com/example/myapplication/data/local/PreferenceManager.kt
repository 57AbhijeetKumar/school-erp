package com.example.myapplication.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import com.example.myapplication.data.model.ParentChildData
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class PreferenceManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("school_erp_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    // ── Role ───────────────────────────────────────────────────────────────

    fun saveRole(role: String) = prefs.edit { putString(KEY_ROLE, role) }
    fun getRole(): String?     = prefs.getString(KEY_ROLE, null)

    // ── Teacher token ──────────────────────────────────────────────────────

    fun saveToken(token: String) = prefs.edit { putString(KEY_TOKEN, token) }
    fun getToken(): String?      = prefs.getString(KEY_TOKEN, null)

    // ── Teacher info (stored at login for offline display) ─────────────────

    fun saveTeacher(id: String, name: String, mobile: String, subject: String?) {
        prefs.edit {
            putString(KEY_TEACHER_ID, id)
                .putString(KEY_TEACHER_NAME, name)
                .putString(KEY_TEACHER_MOBILE, mobile)
                .putString(KEY_TEACHER_SUBJECT, subject)
        }
    }

    fun getTeacherName(): String     = prefs.getString(KEY_TEACHER_NAME, "Teacher") ?: "Teacher"
    fun getTeacherMobile(): String   = prefs.getString(KEY_TEACHER_MOBILE, "") ?: ""
    fun getTeacherSubject(): String? = prefs.getString(KEY_TEACHER_SUBJECT, null)

    // ── Parent token + info ────────────────────────────────────────────────

    fun saveParentToken(token: String) = prefs.edit { putString(KEY_PARENT_TOKEN, token) }
    fun getParentToken(): String?      = prefs.getString(KEY_PARENT_TOKEN, null)

    fun saveParentMobile(mobile: String) = prefs.edit { putString(KEY_PARENT_MOBILE, mobile) }
    fun getParentMobile(): String?       = prefs.getString(KEY_PARENT_MOBILE, null)

    fun saveParentChildren(children: List<ParentChildData>) =
        prefs.edit { putString(KEY_PARENT_CHILDREN, gson.toJson(children)) }

    fun getParentChildren(): List<ParentChildData> {
        val json = prefs.getString(KEY_PARENT_CHILDREN, null) ?: return emptyList()
        val type = object : TypeToken<List<ParentChildData>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    // ── Clear (logout) ─────────────────────────────────────────────────────

    fun clearTeacher() = prefs.edit {
        remove(KEY_TOKEN); remove(KEY_TEACHER_ID); remove(KEY_TEACHER_NAME)
        remove(KEY_TEACHER_MOBILE); remove(KEY_TEACHER_SUBJECT); remove(KEY_ROLE)
    }

    fun clearParent() = prefs.edit {
        remove(KEY_PARENT_TOKEN); remove(KEY_PARENT_MOBILE)
        remove(KEY_PARENT_CHILDREN); remove(KEY_ROLE)
    }

    fun clear() = prefs.edit { clear() }

    // ── Startup helpers ────────────────────────────────────────────────────

    /** True if an existing teacher session exists before role was introduced. */
    fun isLegacyTeacherSession(): Boolean = getToken() != null && getRole() == null

    companion object {
        private const val KEY_ROLE             = "role"
        private const val KEY_TOKEN            = "token"
        private const val KEY_TEACHER_ID       = "teacher_id"
        private const val KEY_TEACHER_NAME     = "teacher_name"
        private const val KEY_TEACHER_MOBILE   = "teacher_mobile"
        private const val KEY_TEACHER_SUBJECT  = "teacher_subject"
        private const val KEY_PARENT_TOKEN     = "parent_token"
        private const val KEY_PARENT_MOBILE    = "parent_mobile"
        private const val KEY_PARENT_CHILDREN  = "parent_children"
    }
}
