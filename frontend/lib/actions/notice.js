'use server'

import { cookies } from 'next/headers'

const API = process.env.BACKEND_URL

async function getToken() {
  const jar = await cookies()
  return jar.get('erp_token')?.value
}

export async function fetchNotices() {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/notices`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    return res.ok ? res.json() : []
  } catch { return [] }
}

export async function createNotice(_prevState, formData) {
  const token = await getToken()
  const body = {
    title:          formData.get('title'),
    content:        formData.get('content'),
    targetAudience: formData.get('targetAudience') || 'all',
  }
  try {
    const res = await fetch(`${API}/api/notices`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message }
    return { success: true, ts: Date.now() }
  } catch { return { error: 'Network error' } }
}

export async function updateNotice(noticeId, data) {
  const token = await getToken()
  try {
    const res = await fetch(`${API}/api/notices/${noticeId}`, {
      method:  'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    const body = await res.json()
    if (!res.ok) return { error: body.message }
    return { success: true }
  } catch { return { error: 'Network error' } }
}

export async function deleteNotice(noticeId) {
  const token = await getToken()
  try {
    const res = await fetch(`${API}/api/notices/${noticeId}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message }
    return { success: true }
  } catch { return { error: 'Network error' } }
}
