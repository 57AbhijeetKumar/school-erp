'use server'

import { cookies }      from 'next/headers'
import { revalidatePath } from 'next/cache'

// ── Admin actions ─────────────────────────────────────────────────────────────

export async function submitRechargeRequest(_prevState, formData) {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  if (!token) return { error: 'Not authenticated' }

  const plan   = formData.get('plan')
  const amount = formData.get('amount')
  const note   = formData.get('note')?.trim() || ''

  if (!plan)   return { error: 'Please select a plan' }
  if (!amount) return { error: 'Please enter an amount' }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/subscription/request`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ plan, amount: Number(amount), note }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to submit request' }

    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch {
    return { error: 'Cannot reach server.' }
  }
}

// ── SuperAdmin actions ────────────────────────────────────────────────────────

export async function toggleSchool(schoolId) {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  if (!token) return { error: 'Not authenticated' }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/schools/${schoolId}/toggle`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to toggle school' }

    revalidatePath('/superadmin/dashboard')
    return { success: true, isActive: data.isActive, message: data.message }
  } catch {
    return { error: 'Cannot reach server.' }
  }
}

export async function setSchoolSubscription(_prevState, formData) {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  if (!token) return { error: 'Not authenticated' }

  const schoolId = formData.get('schoolId')
  const plan     = formData.get('plan')
  const amount   = formData.get('amount')

  if (!plan) return { error: 'Please select a plan' }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/schools/${schoolId}/subscription`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ plan, amount: amount ? Number(amount) : undefined }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to update subscription' }

    revalidatePath('/superadmin/dashboard')
    return { success: true }
  } catch {
    return { error: 'Cannot reach server.' }
  }
}

export async function resolveRechargeRequest(requestId, action, rejectionNote = '') {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  if (!token) return { error: 'Not authenticated' }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/subscription/requests/${requestId}/resolve`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ action, rejectionNote }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to resolve request' }

    revalidatePath('/superadmin/dashboard')
    return { success: true }
  } catch {
    return { error: 'Cannot reach server.' }
  }
}
