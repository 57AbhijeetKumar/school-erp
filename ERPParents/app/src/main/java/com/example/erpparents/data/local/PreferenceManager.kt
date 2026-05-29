package com.example.erpparents.data.local

import android.content.Context
import com.example.erpparents.data.model.ChildData
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class PreferenceManager(context: Context) {

    private val prefs = context.getSharedPreferences("erp_parent_prefs", Context.MODE_PRIVATE)
    private val gson  = Gson()

    fun saveToken(token: String)  { prefs.edit().putString("token",  token).apply() }
    fun getToken(): String?        = prefs.getString("token", null)

    fun saveMobile(mobile: String) { prefs.edit().putString("mobile", mobile).apply() }
    fun getMobile(): String?       = prefs.getString("mobile", null)

    fun saveChildren(children: List<ChildData>) {
        prefs.edit().putString("children", gson.toJson(children)).apply()
    }

    fun getChildren(): List<ChildData> {
        val json = prefs.getString("children", null) ?: return emptyList()
        val type = object : TypeToken<List<ChildData>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun clear() { prefs.edit().clear().apply() }
}
