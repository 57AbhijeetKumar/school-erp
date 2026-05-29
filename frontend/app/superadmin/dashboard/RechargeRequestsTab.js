'use client'

import { useTransition, useState } from 'react'
import { resolveRechargeRequest } from '@/lib/actions/subscription'

const PLAN_DAYS = { monthly: '30 days', quarterly: '90 days', yearly: '365 days' }

function StatusBadge({ status }) {
  if (status === 'approved') return <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Approved</span>
  if (status === 'rejected') return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">Rejected</span>
  return <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Pending</span>
}

function RejectModal({ requestId, onClose, onDone }) {
  const [note, setNote]   = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState(null)

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await resolveRechargeRequest(requestId, 'reject', note)
      if (result?.error) { setError(result.error); return }
      onDone()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Reject Request</h2>
          <p className="text-xs text-slate-500 mt-0.5">Optionally provide a reason for rejection.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Rejection reason (optional)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="flex justify-end gap-3">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={submit} disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors">
              {isPending ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RechargeRequestsTab({ requests }) {
  const [approvePending, startApprove] = useTransition()
  const [error,          setError]     = useState(null)
  const [rejectModal,    setRejectModal] = useState(null) // requestId
  const [localRequests,  setLocalRequests] = useState(requests)

  function handleApprove(requestId) {
    setError(null)
    startApprove(async () => {
      const result = await resolveRechargeRequest(requestId, 'approve')
      if (result?.error) { setError(result.error); return }
      setLocalRequests(prev => prev.map(r => r._id === requestId ? { ...r, status: 'approved' } : r))
    })
  }

  const pending  = localRequests.filter(r => r.status === 'pending')
  const resolved = localRequests.filter(r => r.status !== 'pending')

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Pending requests */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <span className="text-lg">⏳</span>
          <h2 className="font-semibold text-slate-800">Pending Requests</h2>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">{pending.length}</span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="py-12 text-center">
            <span className="text-3xl block mb-2">✅</span>
            <p className="text-slate-400 text-sm">No pending requests</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.map((r, i) => (
              <div key={String(r._id || i)} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">{r.school?.name || '—'}</p>
                      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full capitalize">{r.school?.type}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-sm text-slate-600 capitalize font-medium">{r.plan}</span>
                      <span className="text-xs text-slate-400">{PLAN_DAYS[r.plan]}</span>
                      <span className="text-sm font-bold text-indigo-700">₹{Number(r.amount).toLocaleString('en-IN')}</span>
                    </div>
                    {r.note && (
                      <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{r.note}&rdquo;</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      by {r.requestedBy?.name || '—'} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(r._id)}
                      disabled={approvePending}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-colors"
                    >
                      {approvePending ? '…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setRejectModal(r._id)}
                      disabled={approvePending}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved requests */}
      {resolved.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h2 className="font-semibold text-slate-800">Past Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">School</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resolved.map((r, i) => (
                  <tr key={String(r._id || i)} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-800">{r.school?.name || '—'}</td>
                    <td className="px-6 py-3 text-slate-600 capitalize">{r.plan}</td>
                    <td className="px-6 py-3 text-slate-800 font-medium">₹{Number(r.amount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-3 text-slate-400 text-xs">
                      {r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rejectModal && (
        <RejectModal
          requestId={rejectModal}
          onClose={() => setRejectModal(null)}
          onDone={() => setLocalRequests(prev => prev.map(r => r._id === rejectModal ? { ...r, status: 'rejected' } : r))}
        />
      )}
    </div>
  )
}
