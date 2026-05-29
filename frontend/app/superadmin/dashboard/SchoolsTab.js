'use client'

import { useActionState, useState, useTransition } from 'react'
import { toggleSchool, setSchoolSubscription } from '@/lib/actions/subscription'

const PLANS = ['monthly', 'quarterly', 'yearly']

function daysRemaining(endDate) {
  if (!endDate) return null
  return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function SubBadge({ school }) {
  const daysLeft = daysRemaining(school.subscription?.endDate)
  const plan     = school.subscription?.plan

  if (!school.isActive) {
    return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">Inactive</span>
  }
  if (plan === 'trial') {
    return (
      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
        Trial{daysLeft !== null ? ` · ${daysLeft}d` : ''}
      </span>
    )
  }
  if (daysLeft !== null && daysLeft <= 0) {
    return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">Expired</span>
  }
  if (daysLeft !== null && daysLeft <= 7) {
    return <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Expiring · {daysLeft}d</span>
  }
  return (
    <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full capitalize">
      {plan || 'Active'}{daysLeft !== null ? ` · ${daysLeft}d` : ''}
    </span>
  )
}

function SetSubscriptionModal({ school, onClose }) {
  const [state, action, pending] = useActionState(setSchoolSubscription, null)

  if (state?.success) { onClose(); return null }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Set Subscription</h2>
            <p className="text-xs text-slate-500 mt-0.5">{school.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={action} className="px-6 py-5 space-y-4">
          <input type="hidden" name="schoolId" value={school._id} />

          {state?.error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{state.error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Plan <span className="text-red-500">*</span></label>
            <select
              name="plan"
              required
              defaultValue={school.subscription?.plan === 'trial' ? 'monthly' : (school.subscription?.plan || 'monthly')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {PLANS.map(p => (
                <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Extends from current expiry if still valid, otherwise from today.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Monthly Charge (₹)</label>
            <input
              name="amount"
              type="number"
              min="0"
              defaultValue={school.subscription?.monthlyCharge || 0}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={pending}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors">
              {pending ? 'Saving…' : 'Activate & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SchoolsTab({ schools }) {
  const [togglePending, startToggle] = useTransition()
  const [toggleError,   setToggleError]   = useState(null)
  const [subModal,      setSubModal]      = useState(null) // school object

  function handleToggle(schoolId) {
    setToggleError(null)
    startToggle(async () => {
      const result = await toggleSchool(schoolId)
      if (result?.error) setToggleError(result.error)
    })
  }

  return (
    <>
      {toggleError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{toggleError}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {schools.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl block mb-3">🏫</span>
            <p className="text-slate-500 font-medium">No schools yet</p>
            <p className="text-slate-400 text-sm mt-1">Click &ldquo;Create School&rdquo; to add your first school</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">School</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Charge / mo</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expiry</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.map((school, i) => (
                  <tr key={String(school._id || i)} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{school.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 capitalize">
                        {school.type}
                        {school.city ? ` · ${school.city}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      <div>{school.adminUser?.name || '—'}</div>
                      <div className="text-slate-400">{school.adminUser?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-medium">
                      ₹{(school.subscription?.monthlyCharge || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {school.subscription?.endDate
                        ? new Date(school.subscription.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <SubBadge school={school} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleToggle(school._id)}
                          disabled={togglePending}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                            school.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {school.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setSubModal(school)}
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          Set Sub
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {subModal && <SetSubscriptionModal school={subModal} onClose={() => setSubModal(null)} />}
    </>
  )
}
