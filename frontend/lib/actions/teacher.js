'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function addTeacher(_prevState, formData) {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  if (!token) return { error: 'Not authenticated' }

  const name    = formData.get('name')?.trim()
  const mobile  = formData.get('mobile')?.trim()
  const subject = formData.get('subject')?.trim() || undefined

  if (!name || !mobile) return { error: 'Name and mobile number are required' }
  if (!/^\d{10}$/.test(mobile)) return { error: 'Enter a valid 10-digit mobile number' }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, mobile, subject }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to add teacher' }

    revalidatePath('/admin/dashboard')
    return { success: true, teacher: data.teacher }
  } catch {
    return { error: 'Cannot reach server. Is the backend running?' }
  }
}

export async function toggleTeacherStatus(formData) {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  if (!token) return

  const teacherId = formData.get('teacherId')
  if (!teacherId) return

  try {
    await fetch(`${process.env.BACKEND_URL}/api/teachers/${teacherId}/status`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    revalidatePath('/admin/dashboard')
  } catch { /* silent */ }
}

export async function removeTeacher(formData) {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  if (!token) return

  const teacherId = formData.get('teacherId')
  if (!teacherId) return

  try {
    await fetch(`${process.env.BACKEND_URL}/api/teachers/${teacherId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    revalidatePath('/admin/dashboard')
  } catch { /* silent — page will revalidate anyway */ }
}
