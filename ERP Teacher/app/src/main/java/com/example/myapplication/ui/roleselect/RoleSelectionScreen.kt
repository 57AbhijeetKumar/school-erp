package com.example.myapplication.ui.roleselect

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.myapplication.ui.theme.BlueDark
import com.example.myapplication.ui.theme.BluePrimary
import com.example.myapplication.ui.theme.GreenDark
import com.example.myapplication.ui.theme.GreenPrimary

@Composable
fun RoleSelectionScreen(navController: NavController) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0F172A), Color(0xFF1E293B))))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text("🏫", fontSize = 56.sp)
            Spacer(Modifier.height(16.dp))
            Text(
                "School ERP",
                fontSize    = 30.sp,
                fontWeight  = FontWeight.ExtraBold,
                color       = Color.White
            )
            Text(
                "Select your role to continue",
                fontSize = 14.sp,
                color    = Color.White.copy(alpha = 0.65f),
                modifier = Modifier.padding(top = 6.dp, bottom = 48.dp)
            )

            RoleCard(
                emoji    = "👩‍🏫",
                title    = "Teacher",
                subtitle = "Attendance · Homework · Exams · Leaves",
                gradient = listOf(GreenDark, GreenPrimary),
                onClick  = { navController.navigate("login") }
            )

            Spacer(Modifier.height(20.dp))

            RoleCard(
                emoji    = "👨‍👩‍👧‍👦",
                title    = "Parent",
                subtitle = "Track your child's progress & fees",
                gradient = listOf(BlueDark, BluePrimary),
                onClick  = { navController.navigate("parent_login") }
            )
        }
    }
}

@Composable
private fun RoleCard(
    emoji:    String,
    title:    String,
    subtitle: String,
    gradient: List<Color>,
    onClick:  () -> Unit
) {
    Card(
        onClick   = onClick,
        modifier  = Modifier.fillMaxWidth(),
        shape     = RoundedCornerShape(20.dp),
        colors    = CardDefaults.cardColors(containerColor = Color.Transparent),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.horizontalGradient(gradient), RoundedCornerShape(20.dp))
                .padding(24.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(emoji, fontSize = 28.sp)
                }
                Spacer(Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(title, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color.White)
                    Text(
                        subtitle,
                        fontSize  = 12.sp,
                        color     = Color.White.copy(alpha = 0.8f),
                        textAlign = TextAlign.Start,
                        lineHeight = 17.sp,
                        modifier  = Modifier.padding(top = 3.dp)
                    )
                }
                Text("→", fontSize = 22.sp, color = Color.White.copy(alpha = 0.7f))
            }
        }
    }
}
