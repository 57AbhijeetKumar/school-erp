'use client'

import { useState } from 'react'
import { logout } from '@/lib/actions/auth'
import ThemeToggle from '@/components/ThemeToggle'
import SchoolsTab          from './SchoolsTab'
import RechargeRequestsTab from './RechargeRequestsTab'
import AnalyticsTab        from './AnalyticsTab'
import CreateSchoolModal   from './CreateSchoolModal'

const NAV = [
  { id: 'schools',   label: 'Schools',           icon: '🏫' },
  { id: 'requests',  label: 'Recharge Requests',  icon: '💳' },
  { id: 'analytics', label: 'Analytics',          icon: '📈' },
]

export default function SuperAdminLayout({ schools, requests, analytics }) {
  const [active, setActive] = useState('schools')

  const pending = requests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Top Nav */}
      <header className="bg-white border-b border-slate-200 px-6 py-0 h-14 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-base">🛡️</span>
            </div>
            <span className="font-bold text-slate-800">School ERP</span>
            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">Super Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                </svg>
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Schools',    value: schools.length,                         cls: 'text-slate-800'   },
            { label: 'Active Schools',   value: schools.filter(s => s.isActive).length, cls: 'text-emerald-600' },
            { label: 'Inactive',         value: schools.filter(s => !s.isActive).length,cls: 'text-red-600'     },
            { label: 'Pending Requests', value: pending,                                 cls: 'text-amber-600'   },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${cls}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                ${active === item.id
                  ? 'text-indigo-700 border-b-2 border-indigo-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.id === 'requests' && pending > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full leading-none">
                  {pending}
                </span>
              )}
            </button>
          ))}

          {/* Create school button — only on Schools tab */}
          {active === 'schools' && (
            <div className="ml-auto pb-2">
              <CreateSchoolModal />
            </div>
          )}
        </div>

        {/* Tab content */}
        {active === 'schools'   && <SchoolsTab          schools={schools}   />}
        {active === 'requests'  && <RechargeRequestsTab requests={requests} />}
        {active === 'analytics' && (
          <AnalyticsTab
            overview={analytics?.overview}
            expiring={analytics?.expiring}
            revenue={analytics?.revenue}
            growth={analytics?.growth}
          />
        )}

      </div>
    </div>
  )
}
