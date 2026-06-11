'use client'

import { useState } from 'react'
import { logout } from '@/lib/actions/auth'
import DashboardHome   from './DashboardHome'
import TeacherSection  from './TeacherSection'
import ClassSection    from './ClassSection'
import AttendanceSection from './AttendanceSection'
import HomeworkSection from './HomeworkSection'
import ExamSection     from './ExamSection'
import FeeSection          from './FeeSection'
import SubscriptionSection from './SubscriptionSection'
import NoticeSection   from './NoticeSection'
import TimetableSection  from './TimetableSection'
import LeaveSection     from './LeaveSection'
import ComplaintSection from './ComplaintSection'
import SubjectSection   from './SubjectSection'
import PromotionSection from './PromotionSection'
import ReportSection   from './ReportSection'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',         icon: '📊' },
  { id: 'teachers',   label: 'Teachers',           icon: '👩‍🏫' },
  { id: 'subjects',   label: 'Subjects',           icon: '📖' },
  { id: 'classes',    label: 'Classes & Students', icon: '🏫' },
  { id: 'attendance', label: 'Attendance',         icon: '📋' },
  { id: 'homework',   label: 'Homework',           icon: '📚' },
  { id: 'exams',      label: 'Exams & Results',    icon: '📝' },
  { id: 'fees',         label: 'Fee Management',     icon: '💰' },
  { id: 'notices',      label: 'Notice Board',        icon: '📢' },
  { id: 'timetable',    label: 'Timetable',           icon: '📅' },
  { id: 'leaves',       label: 'Leave Requests',      icon: '🗓️' },
  { id: 'complaints',   label: 'Complaints',          icon: '⚠️' },
  { id: 'promotion',    label: 'Promotion',           icon: '🎓' },
  { id: 'reports',      label: 'Reports & Export',    icon: '📊' },
  { id: 'subscription', label: 'Subscription',        icon: '🔑' },
]

function NoClasses() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4">🏫</span>
      <p className="text-slate-600 font-medium">No classes yet</p>
      <p className="text-slate-400 text-sm mt-1">Create a class first from the Classes & Students section.</p>
    </div>
  )
}

export default function AdminLayout({ school, user, teachers, classes, classesWithStudents, exams, subscription, subjects }) {
  const [active,      setActive]      = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const nav = active === 'dashboard'  ? 'Dashboard'
            : active === 'teachers'   ? 'Teachers'
            : active === 'subjects'   ? 'Subjects'
            : active === 'classes'    ? 'Classes & Students'
            : active === 'attendance' ? 'Attendance'
            : active === 'homework'   ? 'Homework'
            : active === 'exams'      ? 'Exams & Results'
            : active === 'fees'         ? 'Fee Management'
            : active === 'notices'      ? 'Notice Board'
            : active === 'timetable'    ? 'Timetable'
            : active === 'leaves'       ? 'Leave Requests'
            : active === 'complaints'   ? 'Complaints'
            : active === 'promotion'    ? 'Student Promotion'
            : active === 'reports'      ? 'Reports & Export'
            : active === 'subscription' ? 'Subscription'
            : ''

  function go(id) { setActive(id); setSidebarOpen(false) }

  function renderSection() {
    switch (active) {
      case 'dashboard':
        return <DashboardHome school={school} user={user} teachers={teachers} classesWithStudents={classesWithStudents} exams={exams} />
      case 'teachers':
        return <TeacherSection teachers={teachers} subjects={subjects} />
      case 'subjects':
        return <SubjectSection subjects={subjects} />
      case 'classes':
        return <ClassSection classes={classesWithStudents} teachers={teachers} />
      case 'attendance':
        return classesWithStudents.length > 0 ? <AttendanceSection classes={classesWithStudents} /> : <NoClasses />
      case 'homework':
        return classesWithStudents.length > 0 ? <HomeworkSection classes={classesWithStudents} /> : <NoClasses />
      case 'exams':
        return classesWithStudents.length > 0 ? <ExamSection classes={classes} initialExams={exams} subjects={subjects} /> : <NoClasses />
      case 'fees':
        return classesWithStudents.length > 0 ? <FeeSection classes={classesWithStudents} /> : <NoClasses />
      case 'notices':
        return <NoticeSection />
      case 'timetable':
        return classesWithStudents.length > 0 ? <TimetableSection classes={classesWithStudents} subjects={subjects} teachers={teachers} /> : <NoClasses />
      case 'leaves':
        return <LeaveSection teachers={teachers} />
      case 'complaints':
        return <ComplaintSection />
      case 'promotion':
        return <PromotionSection classes={classesWithStudents} />
      case 'reports':
        return <ReportSection classes={classesWithStudents} school={school} />
      case 'subscription':
        return <SubscriptionSection subscription={subscription} />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-slate-200
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-auto lg:z-auto
      `} style={{ colorScheme: 'inherit' }}>

        {/* School identity */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-lg">📚</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{school.name || 'School ERP'}</p>
              <p className="text-xs text-slate-500 capitalize">{school.type || 'School'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors text-left
                ${active === item.id
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }
              `}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {active === item.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold shrink-0">
              {(user.name?.[0] || 'A').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.name || 'Admin'}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
          <form action={logout} className="w-full">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
              </svg>
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 h-14 flex items-center gap-4 z-30">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Admin</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">{nav}</span>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:block text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {school.name || 'School ERP'}
            </span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderSection()}
        </main>
      </div>

    </div>
  )
}
