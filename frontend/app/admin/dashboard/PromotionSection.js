'use client'

import { useState, useEffect, useTransition } from 'react'
import { fetchStudentsByClass, promoteStudents } from '@/lib/actions/student'

function getSessionOptions() {
  const now  = new Date()
  const year = now.getFullYear()
  const base = now.getMonth() >= 5 ? year : year - 1
  return [
    `${base - 1}-${String(base).slice(-2)}`,
    `${base}-${String(base + 1).slice(-2)}`,
    `${base + 1}-${String(base + 2).slice(-2)}`,
  ]
}

export default function PromotionSection({ classes }) {
  const [fromClassId,      setFromClassId]      = useState('')
  const [students,         setStudents]         = useState([])
  const [selectedIds,      setSelectedIds]      = useState(new Set())
  const [toClassId,        setToClassId]        = useState('')
  const [toSession,        setToSession]        = useState(getSessionOptions()[2])
  const [loadingStudents,  setLoadingStudents]  = useState(false)
  const [confirming,       setConfirming]       = useState(false)
  const [result,           setResult]           = useState(null)
  const [isPending,        startTransition]     = useTransition()

  const sessions = getSessionOptions()

  useEffect(() => {
    setStudents([])
    setSelectedIds(new Set())
    if (!fromClassId) { setLoadingStudents(false); return }
    setLoadingStudents(true)
    fetchStudentsByClass(fromClassId).then(data => {
      const list = Array.isArray(data) ? data : []
      setStudents(list)
      setSelectedIds(new Set(list.map(s => s._id)))
      setLoadingStudents(false)
    })
  }, [fromClassId])

  const allSelected = students.length > 0 && selectedIds.size === students.length

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(students.map(s => s._id)))
  }

  function toggleStudent(id) {
    setSelectedIds(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function handlePromote() {
    if (!canPromote) return
    setResult(null)
    setConfirming(true)
  }

  function confirmPromote() {
    setConfirming(false)
    startTransition(async () => {
      const res = await promoteStudents([...selectedIds], toClassId, toSession)
      if (res.error) {
        setResult({ ok: false, message: res.error })
      } else {
        setResult({ ok: true, message: res.message })
        setStudents([])
        setSelectedIds(new Set())
        setFromClassId('')
      }
    })
  }

  const fromClass  = classes.find(c => String(c._id) === fromClassId)
  const toClass    = classes.find(c => String(c._id) === toClassId)
  const canPromote = fromClassId && toClassId && fromClassId !== toClassId && selectedIds.size > 0 && !loadingStudents

  const classLabel = c => c ? `${c.name}${c.section ? ` — ${c.section}` : ''}` : ''

  if (!classes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
        <span className="text-5xl mb-4">🏫</span>
        <p className="text-slate-600 font-medium">No classes yet</p>
        <p className="text-slate-400 text-sm mt-1">Create classes first from the Classes &amp; Students section.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Student Promotion</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Move students to their next class at the end of the academic year.
          All historical records are preserved automatically.
        </p>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm border ${
          result.ok
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          <span className="text-base shrink-0">{result.ok ? '✓' : '✕'}</span>
          <div>
            <p className="font-semibold">{result.message}</p>
            {result.ok && (
              <p className="text-xs opacity-75 mt-0.5">
                Refresh the page to see updated class rosters.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ── Left: source class + student checklist ─────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700 text-sm">Step 1 — Select source class &amp; students</h3>
          </div>
          <div className="p-4 space-y-3">
            <select
              value={fromClassId}
              onChange={e => { setFromClassId(e.target.value); setResult(null) }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">— Choose source class —</option>
              {classes.map(c => (
                <option key={String(c._id)} value={String(c._id)}>{classLabel(c)}</option>
              ))}
            </select>

            {loadingStudents && (
              <p className="text-sm text-slate-400 text-center py-6">Loading students…</p>
            )}

            {!loadingStudents && fromClassId && students.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">No students enrolled in this class.</p>
                <p className="text-xs text-slate-300 mt-1">Add students first from Classes &amp; Students.</p>
              </div>
            )}

            {!loadingStudents && students.length > 0 && (
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                {/* Select-all row */}
                <button
                  type="button"
                  onClick={toggleAll}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition-colors text-left"
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-emerald-500"
                    onClick={e => e.stopPropagation()}
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    {allSelected ? 'Deselect All' : 'Select All'} &nbsp;
                    <span className="font-normal text-slate-400">({students.length} students)</span>
                  </span>
                  <span className="ml-auto text-xs text-emerald-600 font-medium">{selectedIds.size} selected</span>
                </button>

                {/* Student rows */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {students.map(s => (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => toggleStudent(s._id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        selectedIds.has(s._id) ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s._id)}
                        onChange={() => toggleStudent(s._id)}
                        className="w-4 h-4 accent-emerald-500 shrink-0"
                        onClick={e => e.stopPropagation()}
                      />
                      <span className="text-sm text-slate-700 flex-1 truncate">{s.name}</span>
                      {s.rollNumber && (
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {s.rollNumber}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: destination + session + summary ──────────────────── */}
        <div className="space-y-4">

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-semibold text-slate-700 text-sm">Step 2 — Set destination &amp; session</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Promote to class *</label>
                <select
                  value={toClassId}
                  onChange={e => setToClassId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">— Choose destination class —</option>
                  {classes
                    .filter(c => String(c._id) !== fromClassId)
                    .map(c => (
                      <option key={String(c._id)} value={String(c._id)}>{classLabel(c)}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  If the destination class doesn't exist yet, create it in Classes &amp; Students first.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">New academic session *</label>
                <select
                  value={toSession}
                  onChange={e => setToSession(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {sessions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Summary card */}
          {fromClass && toClass && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">Promotion Summary</p>
              <div className="space-y-2 text-sm">
                {[
                  ['From',     classLabel(fromClass)],
                  ['To',       classLabel(toClass)],
                  ['Session',  toSession],
                  ['Students', `${selectedIds.size} selected out of ${students.length}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-400 w-20 shrink-0">{label}</span>
                    <span className={`font-semibold ${label === 'Students' ? 'text-emerald-700' : 'text-slate-700'}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handlePromote}
            disabled={!canPromote || isPending}
            className="w-full py-3 text-sm font-semibold rounded-xl transition-colors
              bg-emerald-600 hover:bg-emerald-700 text-white
              disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {isPending
              ? 'Promoting…'
              : canPromote
                ? `Promote ${selectedIds.size} Student${selectedIds.size !== 1 ? 's' : ''} →`
                : 'Select class, students and destination'}
          </button>

          {/* How it works info box */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700 space-y-1">
            <p className="font-semibold mb-1">How promotion works</p>
            <p>• Student moves to the new class immediately.</p>
            <p>• Old attendance, exam results, fees &amp; homework remain accessible under the previous class records.</p>
            <p>• Students who failed can be re-enrolled in the same grade by creating a duplicate class (e.g. Class 5 — Repeat) and promoting them there.</p>
            <p>• Roll numbers are cleared on promotion — please assign new roll numbers in the destination class.</p>
          </div>
        </div>
      </div>

      {/* ── Confirm modal ──────────────────────────────────────────────── */}
      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirming(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-1">Confirm Promotion</h3>
            <p className="text-sm text-slate-500 mb-4">This will update the enrolled class for the selected students.</p>

            <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm space-y-2 mb-4">
              <div className="flex gap-2">
                <span className="text-slate-400 w-20 shrink-0">Students</span>
                <span className="font-bold text-emerald-700">{selectedIds.size}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-20 shrink-0">From</span>
                <span className="font-semibold text-slate-700">{classLabel(fromClass)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-20 shrink-0">To</span>
                <span className="font-semibold text-slate-700">{classLabel(toClass)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-20 shrink-0">Session</span>
                <span className="font-semibold text-slate-700">{toSession}</span>
              </div>
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-5">
              Historical records are preserved. This action can be undone by promoting students back if needed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPromote}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Confirm Promote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
