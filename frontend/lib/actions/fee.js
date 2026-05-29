'use server'

import { cookies } from 'next/headers'

const API = process.env.BACKEND_URL

async function getToken() {
  const jar = await cookies()
  return jar.get('erp_token')?.value
}

export async function fetchClassFees(classId, month) {
  const token = await getToken()
  if (!token) return null
  try {
    const res = await fetch(`${API}/api/fees?classId=${classId}&month=${month}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

export async function markStudentFee(studentId, month, status, amount, note) {
  const token = await getToken()
  if (!token) return { ok: false, message: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/fees/mark`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ studentId, month, status, amount, note }),
    })
    const data = await res.json()
    return { ok: res.ok, message: data.message }
  } catch { return { ok: false, message: 'Network error' } }
}

export async function markBulkFee(classId, month, status, amount) {
  const token = await getToken()
  if (!token) return { ok: false, message: 'Not authenticated' }
  try {
    const res = await fetch(`${API}/api/fees/mark-bulk`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ classId, month, status, amount }),
    })
    const data = await res.json()
    return { ok: res.ok, message: data.message }
  } catch { return { ok: false, message: 'Network error' } }
}
