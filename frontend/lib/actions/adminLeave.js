'use server'

import { cookies } from 'next/headers'

const API = process.env.BACKEND_URL

async function getToken() {
  const jar = await cookies()
  return jar.get('erp_token')?.value
}

export async function fetchStudentLeaves(status, classId, page = 1) {
  const token = await getToken()
  if (!token) return { data: [], total: 0, pages: 1 }
  const params = new URLSearchParams({ page, limit: 20 })
  if (status)  params.set('status', status)
  if (classId) params.set('classId', classId)
  try {
    const res = await fetch(`${API}/api/leave-requests?${params}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    return res.ok ? res.json() : { data: [], total: 0, pages: 1 }
  } catch { return { data: [], total: 0, pages: 1 } }
}

export async function resolveStudentLeave(leaveId, action, rejectionNote = '') {
  const token = await getToken()
  try {
    const res = await fetch(`${API}/api/leave-requests/${leaveId}/resolve`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, rejectionNote }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message }
    return { success: true }
  } catch { return { error: 'Network error' } }
}

export async function fetchTeacherLeaves(status, page = 1) {
  const token = await getToken()
  if (!token) return { data: [], total: 0, pages: 1 }
  const params = new URLSearchParams({ page, limit: 20 })
  if (status) params.set('status', status)
  try {
    const res = await fetch(`${API}/api/teacher-leaves?${params}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    return res.ok ? res.json() : { data: [], total: 0, pages: 1 }
  } catch { return { data: [], total: 0, pages: 1 } }
}

export async function deleteStudentLeave(leaveId) {
  const token = await getToken()
  try {
    const res = await fetch(`${API}/api/leave-requests/${leaveId}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message }
    return { success: true }
  } catch { return { error: 'Network error' } }
}

export async function deleteTeacherLeave(leaveId) {
  const token = await getToken()
  try {
    const res = await fetch(`${API}/api/teacher-leaves/${leaveId}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message }
    return { success: true }
  } catch { return { error: 'Network error' } }
}

export async function resolveTeacherLeave(leaveId, action, rejectionNote = '') {
  const token = await getToken()
  try {
    const res = await fetch(`${API}/api/teacher-leaves/${leaveId}/resolve`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, rejectionNote }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message }
    return { success: true }
  } catch { return { error: 'Network error' } }
}
