import { cookies }  from 'next/headers'
import { redirect } from 'next/navigation'
import SuperAdminLayout from './SuperAdminLayout'

async function apiFetch(path, token) {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.status === 401 || res.status === 403) return null
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function SuperAdminDashboard() {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  const role  = jar.get('erp_role')?.value

  if (!token || role !== 'superadmin') redirect('/superadmin/login')

  const [schools, requests, overview, expiring, revenue, growth] = await Promise.all([
    apiFetch('/api/schools',                                  token),
    apiFetch('/api/subscription/requests',                    token),
    apiFetch('/api/superadmin/analytics/overview',            token),
    apiFetch('/api/superadmin/analytics/expiry-alerts',       token),
    apiFetch('/api/superadmin/analytics/revenue',             token),
    apiFetch('/api/superadmin/analytics/school-growth',       token),
  ])

  if (schools === null || requests === null) redirect('/superadmin/login')

  return (
    <SuperAdminLayout
      schools={schools   || []}
      requests={requests || []}
      analytics={{ overview, expiring: expiring || [], revenue: revenue || [], growth: growth || [] }}
    />
  )
}
