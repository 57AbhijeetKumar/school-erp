'use client'

import { useActionState, useEffect, useState } from 'react'
import { submitRechargeRequest } from '@/lib/actions/subscription'

const PLANS = [
  { value: 'monthly',   label: 'Monthly',   days: 30,  desc: '30 days access' },
  { value: 'quarterly', label: 'Quarterly', days: 90,  desc: '90 days access' },
  { value: 'yearly',    label: 'Yearly',    days: 365, desc: '365 days access' },
]

function daysRemaining(endDate) {
  if (!endDate) return null
  const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

function StatusBadge({ isActive, daysLeft }) {
  if (!isActive) {
    return <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 rounded-full">Inactive</span>
  }
  if (daysLeft === null) {
    return <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-700 rounded-full">Active</span>
  }
  if (daysLeft <= 0) {
    return <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 rounded-full">Expired</span>
  }
  if (daysLeft <= 7) {
    return <span className="px-3 py-1 text-sm font-semibold bg-amber-100 text-amber-700 rounded-full">Expiring in {daysLeft}d</span>
  }
  return <span className="px-3 py-1 text-sm font-semibold bg-emerald-100 text-emerald-700 rounded-full">Active · {daysLeft} days left</span>
}

export default function SubscriptionSection({ subscription }) {
  const { isActive, subscription: sub, pendingRequest, lastApproved } = subscription || {}
  const [showForm, setShowForm] = useState(false)
  const [formKey, setFormKey]   = useState(0)
  const [state, action, pending] = useActionState(submitRechargeRequest, null)

  const daysLeft   = daysRemaining(sub?.endDate)
  const planLabel  = PLANS.find(p => p.value === sub?.plan)?.label || sub?.plan || '—'
  const endDateStr = sub?.endDate
    ? new Date(sub.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  useEffect(() => {
    if (state?.success) { setShowForm(false); setFormKey(k => k + 1) }
  }, [state?.success])

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Status card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <span className="text-xl">🔑</span>
          <h2 className="font-semibold text-slate-800">Subscription Status</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Status</span>
            <StatusBadge isActive={isActive} daysLeft={daysLeft} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Current Plan</span>
            <span className="text-sm font-semibold text-slate-800 capitalize">{planLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Valid Until</span>
            <span className="text-sm font-semibold text-slate-800">{endDateStr}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Monthly Charge</span>
            <span className="text-sm font-semibold text-slate-800">
              ₹{(sub?.monthlyCharge || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Pending request banner */}
      {pendingRequest && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">⏳</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Recharge Request Pending</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Your <span className="capitalize font-medium">{pendingRequest.plan}</span> plan request
              for ₹{Number(pendingRequest.amount).toLocaleString('en-IN')} is awaiting approval.
              Our team will process it shortly.
            </p>
          </div>
        </div>
      )}

      {/* Last approved */}
      {lastApproved && !pendingRequest && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">✅</span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Last Recharge Approved</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              <span className="capitalize font-medium">{lastApproved.plan}</span> plan ·
              ₹{Number(lastApproved.amount).toLocaleString('en-IN')} ·
              {' '}{new Date(lastApproved.resolvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* Request recharge */}
      {!pendingRequest && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💳</span>
              <h2 className="font-semibold text-slate-800">Request Recharge</h2>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                + New Request
              </button>
            )}
          </div>

          {showForm ? (
            <form key={formKey} action={action} className="p-6 space-y-5">
              {state?.error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {state.error}
                </div>
              )}

              {/* Plan selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Plan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PLANS.map(p => (
                    <label key={p.value} className="relative cursor-pointer">
                      <input type="radio" name="plan" value={p.value} className="sr-only peer" required />
                      <div className="border-2 border-slate-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 rounded-xl p-4 text-center transition-all">
                        <p className="font-semibold text-slate-800 text-sm">{p.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Amount You Will Pay (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  name="amount"
                  type="number"
                  min="1"
                  required
                  defaultValue={sub?.monthlyCharge || ''}
                  placeholder="e.g. 499"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Contact your administrator to confirm the amount before submitting.
                </p>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (optional)</label>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="e.g. Payment done via UPI to 9XXXXXXX"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-colors"
                >
                  {pending ? 'Submitting…' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 text-center py-10">
              <span className="text-3xl block mb-2">💳</span>
              <p className="text-slate-500 text-sm">Click &ldquo;New Request&rdquo; to request a subscription recharge.</p>
              <p className="text-slate-400 text-xs mt-1">Your school administrator will approve it manually.</p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
