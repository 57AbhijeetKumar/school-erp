package com.example.erpparents.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary          = BluePrimary,
    secondary        = BlueAccent,
    tertiary         = BlueDark,
    primaryContainer = BlueSurface,
    background       = BlueLight,
    surface          = Color.White,
    onBackground     = Color(0xFF1E293B),
    onSurface        = Color(0xFF1E293B),
    onSurfaceVariant = Color(0xFF64748B),
)

private val DarkColorScheme = darkColorScheme(
    primary          = Color(0xFF90CAF9),
    secondary        = Color(0xFF64B5F6),
    tertiary         = Color(0xFF42A5F5),
    primaryContainer = Color(0xFF0D2A4A),
    background       = Color(0xFF0A0F1E),
    surface          = Color(0xFF141C2E),
    onBackground     = Color(0xFFE2E8F0),
    onSurface        = Color(0xFFE2E8F0),
    onSurfaceVariant = Color(0xFF94A3B8),
)

@Composable
fun ERPParentsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography  = Typography,
        content     = content
    )
}
