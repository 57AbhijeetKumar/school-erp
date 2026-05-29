'use server'

import { cookies } from 'next/headers'

const API = process.env.BACKEND_URL

async function getToken() {
  const jar = await cookies()
  return jar.get('erp_token')?.value
}

export async function fetchClassAttendance(classId, date) {
  const token = await getToken()
  if (!token) return null
  try {
    const res = await fetch(
      `${API}/api/attendance/class/${classId}?date=${date}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function markAdminAttendance(classId, date, records) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/attendance/class/${classId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ date, records }),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.message || 'Failed to save attendance' }
    return { success: true }
  } catch {
    return { error: 'Cannot connect to server' }
  }
}

export async function fetchAttendanceDates(classId) {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await fetch(
      `${API}/api/attendance/class/${classId}/dates`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}
