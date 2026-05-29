package com.example.myapplication.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.myapplication.data.local.PreferenceManager
import com.example.myapplication.ui.attendance.AttendanceScreen
import com.example.myapplication.ui.exam.ExamListScreen
import com.example.myapplication.ui.exam.ExamResultsScreen
import com.example.myapplication.ui.exam.MarksEntryScreen
import com.example.myapplication.ui.homework.HomeworkScreen
import com.example.myapplication.ui.homework.SubmissionScreen
import com.example.myapplication.ui.home.HomeScreen
import com.example.myapplication.ui.home.HomeViewModel
import com.example.myapplication.ui.complaint.TeacherComplaintScreen
import com.example.myapplication.ui.leave.TeacherLeaveScreen
import com.example.myapplication.ui.login.LoginScreen
import com.example.myapplication.ui.notice.NoticeScreen
import com.example.myapplication.ui.students.StudentListScreen
import com.example.myapplication.ui.timetable.TimetableScreen

@Composable
fun AppNavigation(prefManager: PreferenceManager) {
    val navController    = rememberNavController()
    val startDestination = if (prefManager.isLoggedIn()) "home" else "login"
    val homeViewModel: HomeViewModel = viewModel()

    NavHost(navController = navController, startDestination = startDestination) {

        composable("login")     { LoginScreen(navController = navController, onLoginSuccess = { homeViewModel.loadMyClass() }) }
        composable("home")      { HomeScreen(navController = navController, viewModel = homeViewModel) }
        composable("students")  { StudentListScreen(navController = navController, homeViewModel = homeViewModel) }
        composable("attendance") { AttendanceScreen(navController = navController) }
        composable("homework")  { HomeworkScreen(navController = navController) }
        composable("exams")     { ExamListScreen(navController = navController) }

        composable("marks/{examId}") { backStackEntry ->
            MarksEntryScreen(examId = backStackEntry.arguments?.getString("examId") ?: "", navController = navController)
        }
        composable("results/{examId}") { backStackEntry ->
            ExamResultsScreen(examId = backStackEntry.arguments?.getString("examId") ?: "", navController = navController)
        }
        composable("submission/{homeworkId}") { backStackEntry ->
            SubmissionScreen(homeworkId = backStackEntry.arguments?.getString("homeworkId") ?: "", navController = navController)
        }
        composable("notices")   { NoticeScreen(navController = navController) }
        composable("timetable") { TimetableScreen(navController = navController) }
        composable("leaves")      { TeacherLeaveScreen(navController = navController) }
        composable("complaints")  { TeacherComplaintScreen(navController = navController) }
    }
}
