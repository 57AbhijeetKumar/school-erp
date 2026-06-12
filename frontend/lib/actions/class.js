'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getToken() {
  const jar = await cookies()
  return jar.get('erp_token')?.value
}

export async function createClass(prevState, formData) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  const name            = formData.get('name')?.trim()
  const section         = formData.get('section')?.trim() || undefined
  const classTeacherId  = formData.get('classTeacherId') || undefined

  if (!name) return { error: 'Class name is required' }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, section, classTeacherId }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to create class' }

    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch {
    return { error: 'Cannot reach server. Is the backend running?' }
  }
}

export async function updateClass(classId, data) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  const name    = data.name?.trim()
  const section = data.section?.trim() || undefined

  if (!name) return { error: 'Class name is required' }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/classes/${classId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ name, section }),
    })
    const body = await res.json()
    if (!res.ok) return { error: body.message || 'Failed to update class' }
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch {
    return { error: 'Cannot reach server. Is the backend running?' }
  }
}

export async function assignTeacher(prevState, formData) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  const classId        = formData.get('classId')
  const classTeacherId = formData.get('classTeacherId') || null

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/classes/${classId}/teacher`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ classTeacherId }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to assign teacher' }

    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch {
    return { error: 'Cannot reach server.' }
  }
}

export async function deleteClass(formData) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  const classId = formData.get('classId')
  if (!classId) return { error: 'No class selected' }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/classes/${classId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to delete class' }
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch {
    return { error: 'Cannot reach server. Is the backend running?' }
  }
}
