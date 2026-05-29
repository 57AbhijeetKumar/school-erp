'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getToken() {
  const jar = await cookies()
  return jar.get('erp_token')?.value
}

export async function addStudent(_prevState, formData) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  const name             = formData.get('name')?.trim()
  const classId          = formData.get('classId')
  const rollNumber       = formData.get('rollNumber')?.trim()       || undefined
  const parentName       = formData.get('parentName')?.trim()       || undefined
  const parentMobile     = formData.get('parentMobile')?.trim()     || undefined
  const admissionSession = formData.get('admissionSession')?.trim() || undefined

  if (!name)    return { error: 'Student name is required' }
  if (!classId) return { error: 'Class is required' }

  if (parentMobile && !/^\d{10}$/.test(parentMobile)) {
    return { error: 'Parent mobile must be 10 digits' }
  }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, classId, rollNumber, parentName, parentMobile, admissionSession }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to add student' }

    revalidatePath('/admin/dashboard')
    return { success: true, ts: Date.now() }
  } catch {
    return { error: 'Cannot reach server.' }
  }
}

export async function updateStudent(_prevState, formData) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  const studentId   = formData.get('studentId')
  const name        = formData.get('name')?.trim()
  const rollNumber  = formData.get('rollNumber')?.trim()   || undefined
  const parentName  = formData.get('parentName')?.trim()   || undefined
  const parentMobile = formData.get('parentMobile')?.trim() || undefined

  if (!name)      return { error: 'Student name is required' }
  if (!studentId) return { error: 'Student ID missing' }

  if (parentMobile && !/^\d{10}$/.test(parentMobile)) {
    return { error: 'Parent mobile must be 10 digits' }
  }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/students/${studentId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ name, rollNumber, parentName, parentMobile }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to update student' }

    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch {
    return { error: 'Cannot reach server.' }
  }
}

export async function fetchStudentsByClass(classId) {
  const token = await getToken()
  if (!token) return []
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/students/class/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    return res.ok ? res.json() : []
  } catch { return [] }
}

export async function promoteStudents(studentIds, toClassId, toSession) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/students/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ studentIds, toClassId, toSession }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to promote students' }
    revalidatePath('/admin/dashboard')
    return { success: true, promoted: data.promoted, message: data.message }
  } catch {
    return { error: 'Cannot reach server.' }
  }
}

export async function fetchStudentDeleteInfo(studentId) {
  const token = await getToken()
  if (!token) return null
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/students/${studentId}/delete-info`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

export async function deleteStudent(studentId) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/students/${studentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to delete student' }
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch {
    return { error: 'Cannot reach server.' }
  }
}
