'use server'

import { cookies } from 'next/headers'

const API = process.env.BACKEND_URL

async function getToken() {
  const jar = await cookies()
  return jar.get('erp_token')?.value
}

async function get(path) {
  const token = await getToken()
  if (!token) return null
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

export async function fetchRosterReport(classId) {
  return get(`/api/reports/students?classId=${encodeURIComponent(classId)}`)
}

export async function fetchAttendanceReport(classId, from, to) {
  return get(`/api/reports/attendance?classId=${encodeURIComponent(classId)}&from=${from}&to=${to}`)
}

export async function fetchExamsList(classId) {
  return get(`/api/reports/exams-list?classId=${encodeURIComponent(classId)}`) ?? []
}

export async function fetchExamResultsReport(examId) {
  return get(`/api/reports/exam-results?examId=${encodeURIComponent(examId)}`)
}

export async function fetchFeeReport(classId, from, to) {
  return get(`/api/reports/fees?classId=${encodeURIComponent(classId)}&from=${from}&to=${to}`)
}

export async function fetchReportCard(studentId, academicYear) {
  return get(`/api/reports/report-card?studentId=${encodeURIComponent(studentId)}&academicYear=${encodeURIComponent(academicYear)}`)
}
