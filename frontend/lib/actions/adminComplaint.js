'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const API = process.env.BACKEND_URL

async function getToken() {
  const jar = await cookies()
  return jar.get('erp_token')?.value
}

export async function fetchComplaints(status, severity, raisedByRole, classId) {
  const token = await getToken()
  if (!token) return []
  const params = new URLSearchParams()
  if (status)      params.set('status', status)
  if (severity)    params.set('severity', severity)
  if (raisedByRole) params.set('raisedByRole', raisedByRole)
  if (classId)     params.set('classId', classId)
  try {
    const res = await fetch(`${API}/api/complaints?${params}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    return res.ok ? res.json() : []
  } catch { return [] }
}

export async function acknowledgeComplaint(id) {
  const token = await getToken()
  try {
    const res = await fetch(`${API}/api/complaints/${id}/acknowledge`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message }
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch { return { error: 'Network error' } }
}

export async function resolveComplaint(id, resolvedNote) {
  const token = await getToken()
  try {
    const res = await fetch(`${API}/api/complaints/${id}/resolve`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ resolvedNote }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message }
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch { return { error: 'Network error' } }
}

export async function deleteComplaint(id) {
  const token = await getToken()
  try {
    const res = await fetch(`${API}/api/complaints/${id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message }
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch { return { error: 'Network error' } }
}
