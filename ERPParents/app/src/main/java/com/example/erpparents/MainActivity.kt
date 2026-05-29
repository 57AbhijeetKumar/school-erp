package com.example.erpparents

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.erpparents.data.local.PreferenceManager
import com.example.erpparents.navigation.AppNavigation
import com.example.erpparents.ui.theme.ERPParentsTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val prefManager = PreferenceManager(this)
        setContent {
            ERPParentsTheme {
                AppNavigation(prefManager = prefManager)
            }
        }
    }
}
