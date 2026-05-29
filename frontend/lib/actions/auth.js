'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginSuperAdmin(prevState, formData) {
  const email    = formData.get('email')?.trim()
  const password = formData.get('password')

  if (!email || !password) return { error: 'Email and password are required' }

  let redirectTo = null

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (!res.ok) return { error: data.message || 'Login failed' }
    if (data.user.role !== 'superadmin') return { error: 'Access denied. Not a super admin account.' }

    const jar = await cookies()
    jar.set('erp_token', data.token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })
    jar.set('erp_role',  'superadmin', { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })
    redirectTo = '/superadmin/dashboard'
  } catch {
    return { error: 'Cannot reach server. Is the backend running on port 8000?' }
  }

  redirect(redirectTo)
}

export async function loginAdmin(prevState, formData) {
  const email    = formData.get('email')?.trim()
  const password = formData.get('password')

  if (!email || !password) return { error: 'Email and password are required' }

  let redirectTo = null

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (!res.ok) return { error: data.message || 'Login failed' }
    if (data.user.role !== 'admin') return { error: 'Access denied. Not a school admin account.' }

    const jar = await cookies()
    jar.set('erp_token',   data.token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })
    jar.set('erp_role',    'admin',    { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })
    jar.set('erp_school',  JSON.stringify(data.user.school || {}), { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })
    jar.set('erp_user',    JSON.stringify({ name: data.user.name, email: data.user.email }), { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })
    redirectTo = '/admin/dashboard'
  } catch {
    return { error: 'Cannot reach server. Is the backend running on port 8000?' }
  }

  redirect(redirectTo)
}

export async function logout() {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value

  if (token) {
    try {
      await fetch(`${process.env.BACKEND_URL}/api/auth/logout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch { /* backend unreachable — local logout still proceeds */ }
  }

  jar.delete('erp_token')
  jar.delete('erp_role')
  jar.delete('erp_school')
  jar.delete('erp_user')
  redirect('/')
}
