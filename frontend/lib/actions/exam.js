'use server'

import { cookies } from 'next/headers'

const API = process.env.BACKEND_URL

async function getToken() {
  const jar = await cookies()
  return jar.get('erp_token')?.value
}

export async function fetchExams() {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/exams`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
    })
    if (!res.ok) return []
    const body = await res.json()
    // Backend returns paginated { data, total, pages } — extract the array
    return Array.isArray(body) ? body : (body.data ?? [])
  } catch { return [] }
}

export async function fetchExamResults(examId) {
  const token = await getToken()
  if (!token) return null
  try {
    const res = await fetch(`${API}/api/exams/${examId}/results`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

export async function createExam(data) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/exams`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await res.json()
    if (!res.ok) return { error: body.message || 'Failed to create exam' }
    return { success: true }
  } catch { return { error: 'Cannot connect to server' } }
}

export async function publishExam(examId) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/exams/${examId}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    if (!res.ok) return { error: body.message || 'Failed to publish' }
    return { success: true }
  } catch { return { error: 'Cannot connect to server' } }
}

export async function deleteExam(examId) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/exams/${examId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    if (!res.ok) return { error: body.message || 'Failed to delete exam' }
    return { success: true }
  } catch { return { error: 'Cannot connect to server' } }
}

export async function updateExam(examId, data) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/exams/${examId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await res.json()
    if (!res.ok) return { error: body.message || 'Failed to update exam' }
    return { success: true }
  } catch { return { error: 'Cannot connect to server' } }
}

export async function fetchExamStudents(examId) {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/exams/${examId}/students`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    return res.ok ? res.json() : []
  } catch { return [] }
}

export async function unpublishExam(examId) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/exams/${examId}/unpublish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    if (!res.ok) return { error: body.message || 'Failed to unpublish' }
    return { success: true }
  } catch { return { error: 'Cannot connect to server' } }
}

export async function adminEnterMarks(examId, results) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/exams/${examId}/marks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ results }),
    })
    const body = await res.json()
    if (!res.ok) return { error: body.message || 'Failed to save marks' }
    return { success: true }
  } catch { return { error: 'Cannot connect to server' } }
}
