'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function createSchool(prevState, formData) {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  if (!token) return { error: 'Not authenticated' }

  const payload = {
    name:          formData.get('name')?.trim(),
    type:          formData.get('type'),
    city:          formData.get('city')?.trim(),
    state:         formData.get('state')?.trim(),
    phone:         formData.get('phone')?.trim(),
    email:         formData.get('email')?.trim(),
    subscription:  { monthlyCharge: Number(formData.get('monthlyCharge') || 0) },
    adminName:     formData.get('adminName')?.trim(),
    adminEmail:    formData.get('adminEmail')?.trim(),
    adminPassword: formData.get('adminPassword'),
  }

  if (!payload.name || !payload.adminName || !payload.adminEmail || !payload.adminPassword) {
    return { error: 'School name, admin name, admin email and password are required' }
  }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/schools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.message || 'Failed to create school' }

    revalidatePath('/superadmin/dashboard')
    return { success: true, school: data.school }
  } catch {
    return { error: 'Cannot reach server.' }
  }
}
