import { cookies }  from 'next/headers'
import { redirect } from 'next/navigation'
import AdminLayout   from './AdminLayout'

// Returns the parsed JSON body, [] for general errors, or null for 401/403 (access denied).
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

export default async function AdminDashboard() {
  const jar   = await cookies()
  const token = jar.get('erp_token')?.value
  const role  = jar.get('erp_role')?.value

  if (!token || role !== 'admin') redirect('/admin/login')

  let school = {}
  let user   = {}
  try {
    school = JSON.parse(jar.get('erp_school')?.value || '{}')
    user   = JSON.parse(jar.get('erp_user')?.value   || '{}')
  } catch { /* malformed cookie */ }

  const [teachers, classes, examsRaw, subscriptionRaw, subjects] = await Promise.all([
    apiFetch('/api/teachers',    token),
    apiFetch('/api/classes',     token),
    apiFetch('/api/exams',       token),
    apiFetch('/api/subscription', token),
    apiFetch('/api/subjects',    token),
  ])
  // Backend returns paginated { data, total, pages } — extract the array for SSR props
  const exams = Array.isArray(examsRaw) ? examsRaw : (examsRaw?.data ?? [])

  // null means 401/403 — subscription deactivated or token invalid; force re-login
  if (teachers === null || subscriptionRaw === null) {
    redirect('/admin/login?reason=subscription_deactivated')
  }

  const subscription = subscriptionRaw && !Array.isArray(subscriptionRaw) ? subscriptionRaw : {}

  const classesWithStudents = await Promise.all(
    classes.map(async cls => ({
      ...cls,
      students: await apiFetch(`/api/students/class/${cls._id}`, token),
    }))
  )

  return (
    <AdminLayout
      school={school}
      user={user}
      teachers={teachers}
      classes={classes}
      classesWithStudents={classesWithStudents}
      exams={exams}
      subscription={subscription}
      subjects={subjects ?? []}
    />
  )
}
