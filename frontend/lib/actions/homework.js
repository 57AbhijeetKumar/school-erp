'use server'

import { cookies } from 'next/headers'

const API = process.env.BACKEND_URL

async function getToken() {
  const jar = await cookies()
  return jar.get('erp_token')?.value
}

export async function fetchClassHomework(classId) {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/homework/class/${classId}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    return res.ok ? res.json() : []
  } catch { return [] }
}

export async function fetchHomeworkSubmissions(homeworkId) {
  const token = await getToken()
  if (!token) return null
  try {
    const res = await fetch(`${API}/api/homework/${homeworkId}/submissions`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

export async function adminCreateHomework({ classId, title, description, subject, dueDate }) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/homework`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ classId, title, description, subject: subject || undefined, dueDate: dueDate || undefined }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to create homework' }
    return { success: true, homework: data }
  } catch { return { error: 'Cannot connect to server' } }
}

export async function adminUpdateHomework(homeworkId, { title, description, subject, dueDate }) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/homework/${homeworkId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, description, subject: subject || undefined, dueDate: dueDate || null }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to update homework' }
    return { success: true, homework: data }
  } catch { return { error: 'Cannot connect to server' } }
}

export async function adminDeleteHomework(homeworkId) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/homework/${homeworkId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    if (!res.ok) return { error: body.message || 'Failed to delete' }
    return { success: true }
  } catch { return { error: 'Cannot connect to server' } }
}
