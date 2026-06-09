'use client'

import { useState, useEffect, useTransition } from 'react'
import { fetchClassFees, markStudentFee, markBulkFee } from '@/lib/actions/fee'

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(m) {
  const [y, mo] = m.split('-')
  return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

function prevMonths(n = 12) {
  const months = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const y  = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${mo}`)
    d.setMonth(d.getMonth() - 1)
  }
  return months
}

export default function FeeSection({ classes }) {
  const [selectedClass, setSelectedClass] = useState(classes[0]?._id || '')
  const [month,         setMonth]         = useState(currentMonth())
  const [data,          setData]          = useState(null)
  const [error,         setError]         = useState(null)
  const [loading,       startLoad]        = useTransition()
  const [saving,        startSave]        = useTransition()
  const [amountInput,   setAmountInput]   = useState('')

  useEffect(() => {
    if (!selectedClass) return
    setData(null); setError(null)
    startLoad(async () => {
      const result = await fetchClassFees(selectedClass, month)
      if (result) setData(result)
      else setError('Failed to load fee data.')
    })
  }, [selectedClass, month])

  async function markOne(studentId, status) {
    if (status === 'paid' && (!amountInput || Number(amountInput) <= 0)) {
      setError('Enter a valid fee amount before marking as paid.')
      return
    }
    startSave(async () => {
      const amt = amountInput ? Number(amountInput) : 0
      await markStudentFee(studentId, month, status, amt, null)
      const result = await fetchClassFees(selectedClass, month)
      if (result) setData(result)
    })
  }

  async function markAll(status) {
    if (status === 'paid' && (!amountInput || Number(amountInput) <= 0)) {
      setError('Enter a valid fee amount before marking all as paid.')
      return
    }
    startSave(async () => {
      const amt = amountInput ? Number(amountInput) : 0
      await markBulkFee(selectedClass, month, status, amt)
      const result = await fetchClassFees(selectedClass, month)
      if (result) setData(result)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <h2 className="font-bold text-slate-800">Fee Management</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1 font-medium">Class</label>
          <select
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setData(null) }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {classes.map(c => (
              <option key={c._id} value={c._id}>
                {c.section ? `${c.name} - ${c.section}` : c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1 font-medium">Month</label>
          <select
            value={month}
            onChange={e => { setMonth(e.target.value); setData(null) }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {prevMonths().map(m => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1 font-medium">Fee Amount (₹)</label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={amountInput}
            onChange={e => { const v = e.target.value; if (v === '' || Number(v) >= 0) setAmountInput(v) }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Content */}
      {error && (
        <p className="text-sm text-red-500 text-center py-8">{error}</p>
      )}

      {!data && !error && !loading && (
        <p className="text-sm text-slate-400 text-center py-8">Select a class to view fees.</p>
      )}

      {loading && (
        <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
      )}

      {data && (
        <div className="px-6 py-4 space-y-4">
          {/* Summary */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Total',  value: data.summary.total, cls: 'bg-slate-50  text-slate-700'   },
              { label: 'Paid',   value: data.summary.paid,  cls: 'bg-emerald-50 text-emerald-700' },
              { label: 'Due',    value: data.summary.due,   cls: 'bg-red-50    text-red-700'      },
            ].map(s => (
              <div key={s.label} className={`px-4 py-2 rounded-xl text-sm font-semibold ${s.cls}`}>
                {s.label}: {s.value}
              </div>
            ))}
          </div>

          {/* Bulk actions */}
          <div className="flex gap-2">
            <button
              onClick={() => markAll('paid')}
              disabled={saving}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Mark All Paid
            </button>
            <button
              onClick={() => markAll('due')}
              disabled={saving}
              className="text-xs bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Mark All Due
            </button>
          </div>

          {/* Student table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-12">Roll</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid On</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Marked By</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.students.map(s => (
                  <tr key={s.studentId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{s.rollNumber || '—'}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        s.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {s.status === 'paid' ? 'Paid' : 'Due'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {s.amount ? `₹${s.amount}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">
                      {s.paidAt ? new Date(s.paidAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">
                      {s.markedByName || '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.status === 'due' ? (
                        <button
                          onClick={() => markOne(s.studentId, 'paid')}
                          disabled={saving}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg font-medium transition-colors"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <button
                          onClick={() => markOne(s.studentId, 'due')}
                          disabled={saving}
                          className="text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 px-3 py-1 rounded-lg font-medium transition-colors"
                        >
                          Mark Due
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
