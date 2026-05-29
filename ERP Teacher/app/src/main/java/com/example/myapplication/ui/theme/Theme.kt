package com.example.myapplication.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary          = Green40,
    secondary        = GreenGrey40,
    tertiary         = Teal40,
    primaryContainer = GreenSurface,
    background       = GreenLight,
    surface          = Color.White,
    onBackground     = Color(0xFF1E293B),
    onSurface        = Color(0xFF1E293B),
    onSurfaceVariant = Color(0xFF64748B),
)

private val DarkColorScheme = darkColorScheme(
    primary          = Green80,
    secondary        = GreenGrey80,
    tertiary         = Teal80,
    primaryContainer = Color(0xFF1A3A2A),
    background       = Color(0xFF0F1117),
    surface          = Color(0xFF1C2033),
    onBackground     = Color(0xFFE2E8F0),
    onSurface        = Color(0xFFE2E8F0),
    onSurfaceVariant = Color(0xFF94A3B8),
)

@Composable
fun MyApplicationTheme(content: @Composable () -> Unit) {
    val colorScheme = if (isSystemInDarkTheme()) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography  = Typography,
        content     = content
    )
}
