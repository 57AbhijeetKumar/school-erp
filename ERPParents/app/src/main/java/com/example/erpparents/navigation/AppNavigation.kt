package com.example.erpparents.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.erpparents.data.local.PreferenceManager
import com.example.erpparents.ui.child.ChildDetailScreen
import com.example.erpparents.ui.home.HomeScreen
import com.example.erpparents.ui.login.LoginScreen
import com.example.erpparents.ui.notice.NoticeScreen

@Composable
fun AppNavigation(prefManager: PreferenceManager) {
    val navController = rememberNavController()
    val startDest     = if (prefManager.getToken() != null) "home" else "login"

    NavHost(navController = navController, startDestination = startDest) {

        composable("login") {
            LoginScreen(navController = navController)
        }

        composable("home") {
            HomeScreen(navController = navController)
        }

        composable("notices") {
            NoticeScreen(navController = navController)
        }

        composable(
            route = "child/{studentId}/{studentName}",
            arguments = listOf(
                navArgument("studentId")   { type = NavType.StringType },
                navArgument("studentName") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            ChildDetailScreen(
                studentId   = backStackEntry.arguments?.getString("studentId")   ?: "",
                studentName = backStackEntry.arguments?.getString("studentName")  ?: "",
                navController = navController
            )
        }
    }
}
