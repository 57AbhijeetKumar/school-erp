'use server'

import { cookies }        from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function addSubject(_prev, formData) {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  if (!token) return { error: 'Not authenticated' }

  const name = formData.get('name')?.trim()
  const code = formData.get('code')?.trim() || undefined

  if (!name) return { error: 'Subject name is required' }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/subjects`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ name, code }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to add subject' }

    revalidatePath('/admin/dashboard')
    return { success: true, subject: data }
  } catch {
    return { error: 'Cannot reach server. Is the backend running?' }
  }
}

export async function updateSubject(subjectId, data) {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  if (!token) return { error: 'Not authenticated' }

  const name = data.name?.trim()
  const code = data.code?.trim() || undefined
  if (!name) return { error: 'Subject name is required' }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/subjects/${subjectId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ name, code }),
    })
    const body = await res.json()
    if (!res.ok) return { error: body.message || 'Failed to update subject' }
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch {
    return { error: 'Cannot reach server. Is the backend running?' }
  }
}

export async function removeSubject(formData) {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  if (!token) return

  const subjectId = formData.get('subjectId')
  if (!subjectId) return

  try {
    await fetch(`${process.env.BACKEND_URL}/api/subjects/${subjectId}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    revalidatePath('/admin/dashboard')
  } catch { /* silent */ }
}
