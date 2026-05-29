'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const API = process.env.BACKEND_URL

async function getToken() {
  const jar = await cookies()
  return jar.get('erp_token')?.value
}

export async function fetchTimetable(classId) {
  const token = await getToken()
  if (!token || !classId) return null
  try {
    const res = await fetch(`${API}/api/timetable?classId=${classId}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

export async function clearTimetable(classId) {
  const token = await getToken()
  if (!token || !classId) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/timetable/${classId}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message }
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch { return { error: 'Network error' } }
}

export async function saveTimetable(_prevState, formData) {
  const token   = await getToken()
  const classId = formData.get('classId')
  let schedule
  try {
    schedule = JSON.parse(formData.get('schedule') || '[]')
  } catch {
    return { error: 'Invalid schedule format' }
  }

  try {
    const res = await fetch(`${API}/api/timetable`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ classId, schedule }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message }
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch { return { error: 'Network error' } }
}
