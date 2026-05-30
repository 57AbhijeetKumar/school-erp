'use client'

import { useState, useEffect, useTransition } from 'react'
import { fetchTimetable, saveTimetable, clearTimetable } from '@/lib/actions/timetable'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function emptyDay(day) {
  return { day, periods: [] }
}

// Always produces all 6 days; merges saved periods in by day name
function buildSchedule(savedTt) {
  const base = DAYS.map(emptyDay)
  if (!savedTt?.schedule?.length) return base
  for (const savedDay of savedTt.schedule) {
    const idx = base.findIndex(d => d.day === savedDay.day)
    if (idx !== -1) base[idx].periods = savedDay.periods.map(p => ({ ...p }))
  }
  return base
}

function nextPeriodNumber(periods) {
  if (!periods.length) return 1
  return Math.max(...periods.map(p => p.periodNumber)) + 1
}

export default function TimetableSection({ classes, subjects = [], teachers = [] }) {
  const [selectedClass,  setSelectedClass]  = useState(classes[0]?._id || '')
  const [schedule,       setSchedule]       = useState(DAYS.map(emptyDay))
  const [loading,        setLoading]        = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [error,          setError]          = useState('')
  const [confirmClear,   setConfirmClear]   = useState(false)  // top-level clear
  const [clearDayIdx,    setClearDayIdx]    = useState(null)   // per-day clear confirm
  const [isPending,      startTransition]   = useTransition()

  useEffect(() => {
    if (!selectedClass) return
    // Clear immediately so switching classes never shows the previous class's data
    setSchedule(DAYS.map(emptyDay))
    setLoading(true)
    setSaved(false)
    setError('')
    fetchTimetable(selectedClass).then(tt => {
      setSchedule(buildSchedule(tt))
      setLoading(false)
    })
  }, [selectedClass])

  // ── teachers helpers ────────────────────────────────────────────────────────

  function teachersForSubject(subjectName) {
    if (!subjectName) return teachers
    return teachers.filter(t =>
      t.subject && t.subject.toLowerCase() === subjectName.toLowerCase()
    )
  }

  // ── period mutations ────────────────────────────────────────────────────────

  function addPeriod(dayIdx) {
    setSchedule(prev => {
      const next = prev.map(d => ({ ...d, periods: [...d.periods] }))
      next[dayIdx].periods.push({
        periodNumber: nextPeriodNumber(next[dayIdx].periods),
        subject:      '',
        teacherName:  '',
        startTime:    '',
        endTime:      '',
      })
      return next
    })
  }

  function deletePeriod(dayIdx, pIdx) {
    setSchedule(prev => {
      const next = prev.map(d => ({ ...d, periods: [...d.periods] }))
      next[dayIdx].periods.splice(pIdx, 1)
      return next
    })
  }

  function clearDay(dayIdx) {
    setSchedule(prev => {
      const next = prev.map(d => ({ ...d, periods: [...d.periods] }))
      next[dayIdx].periods = []
      return next
    })
    setClearDayIdx(null)
  }

  function updateCell(dayIdx, pIdx, field, value) {
    setSchedule(prev => {
      const next = prev.map(d => ({ ...d, periods: [...d.periods] }))
      const cell = { ...next[dayIdx].periods[pIdx], [field]: value }
      if (field === 'subject') {
        const matched = teachersForSubject(value)
        cell.teacherName = matched.length === 1 ? matched[0].name : ''
      }
      next[dayIdx].periods[pIdx] = cell
      return next
    })
  }

  // ── save ────────────────────────────────────────────────────────────────────

  function handleSave() {
    setSaved(false); setError('')
    startTransition(async () => {
      const fd = new FormData()
      fd.set('classId', selectedClass)
      // Only persist days that have at least one filled period
      const filteredSchedule = schedule
        .map(dayObj => ({
          ...dayObj,
          periods: dayObj.periods.filter(p => p.subject?.trim()),
        }))
        .filter(dayObj => dayObj.periods.length > 0)
      fd.set('schedule', JSON.stringify(filteredSchedule))
      const result = await saveTimetable(null, fd)
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  // ── clear entire timetable ──────────────────────────────────────────────────

  function handleClearAll() {
    startTransition(async () => {
      const res = await clearTimetable(selectedClass)
      if (!res?.error) {
        setSchedule(DAYS.map(emptyDay))
        setSaved(false)
      } else {
        setError(res.error)
      }
      setConfirmClear(false)
    })
  }

  // ── empty state ─────────────────────────────────────────────────────────────

  if (!classes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
        <span className="text-5xl mb-4">📅</span>
        <p className="text-slate-600 font-medium">No classes yet</p>
      </div>
    )
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Timetable</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage the weekly schedule for each class</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setClearDayIdx(null) }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {classes.map(c => (
              <option key={String(c._id)} value={String(c._id)}>
                {c.name}{c.section ? ` — ${c.section}` : ''}
              </option>
            ))}
          </select>

          {/* Clear all confirm */}
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Clear entire timetable?</span>
              <button
                onClick={handleClearAll}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isPending ? 'Clearing…' : 'Yes, Clear All'}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={isPending || loading}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isPending || loading}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving…' : 'Save Timetable'}
          </button>
        </div>
      </div>

      {saved && <p className="text-emerald-600 text-sm font-medium">Timetable saved successfully.</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* ── Day cards ── */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          Loading…
        </div>
      ) : (
        <div className="space-y-4">
          {schedule.map((dayObj, dayIdx) => {
            const hasPeriods      = dayObj.periods.length > 0
            const isClearingDay   = clearDayIdx === dayIdx

            return (
              <div key={dayObj.day} className="bg-white border border-slate-200 rounded-xl overflow-hidden">

                {/* Day header */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700 text-sm">{dayObj.day}</h3>

                  {hasPeriods && (
                    isClearingDay ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Clear {dayObj.day}?</span>
                        <button
                          onClick={() => clearDay(dayIdx)}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                        >
                          Yes, Clear
                        </button>
                        <button
                          onClick={() => setClearDayIdx(null)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setClearDayIdx(dayIdx)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Clear day
                      </button>
                    )
                  )}
                </div>

                {/* Periods table */}
                {hasPeriods ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-100">
                          <th className="px-3 py-2 text-left font-medium w-10">#</th>
                          <th className="px-3 py-2 text-left font-medium">Subject</th>
                          <th className="px-3 py-2 text-left font-medium">Teacher</th>
                          <th className="px-3 py-2 text-left font-medium">Start</th>
                          <th className="px-3 py-2 text-left font-medium">End</th>
                          <th className="px-3 py-2 w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {dayObj.periods.map((p, pIdx) => (
                          <tr key={pIdx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">

                            {/* Period number */}
                            <td className="px-3 py-1.5 text-slate-400 font-mono font-medium">{p.periodNumber}</td>

                            {/* Subject */}
                            <td className="px-3 py-1.5">
                              {subjects.length > 0 ? (
                                <select
                                  value={p.subject}
                                  onChange={e => updateCell(dayIdx, pIdx, 'subject', e.target.value)}
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
                                >
                                  <option value="">— Select —</option>
                                  {subjects.map(s => (
                                    <option key={s._id} value={s.name}>{s.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  value={p.subject}
                                  onChange={e => updateCell(dayIdx, pIdx, 'subject', e.target.value)}
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                  placeholder="Subject"
                                />
                              )}
                            </td>

                            {/* Teacher */}
                            <td className="px-3 py-1.5">
                              {(() => {
                                const matched = teachersForSubject(p.subject)
                                if (p.subject && matched.length === 1) {
                                  return (
                                    <span className="inline-block px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded border border-emerald-200">
                                      {p.teacherName}
                                    </span>
                                  )
                                }
                                const options = matched.length > 1 ? matched : teachers
                                return options.length > 0 ? (
                                  <select
                                    value={p.teacherName}
                                    onChange={e => updateCell(dayIdx, pIdx, 'teacherName', e.target.value)}
                                    className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
                                  >
                                    <option value="">— Select —</option>
                                    {options.map(t => (
                                      <option key={t._id} value={t.name}>{t.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    value={p.teacherName}
                                    onChange={e => updateCell(dayIdx, pIdx, 'teacherName', e.target.value)}
                                    className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                    placeholder="Teacher"
                                  />
                                )
                              })()}
                            </td>

                            {/* Start time */}
                            <td className="px-3 py-1.5">
                              <input
                                type="time"
                                value={p.startTime}
                                onChange={e => updateCell(dayIdx, pIdx, 'startTime', e.target.value)}
                                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                              />
                            </td>

                            {/* End time */}
                            <td className="px-3 py-1.5">
                              <input
                                type="time"
                                value={p.endTime}
                                onChange={e => updateCell(dayIdx, pIdx, 'endTime', e.target.value)}
                                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                              />
                            </td>

                            {/* Delete period */}
                            <td className="px-2 py-1.5 text-center">
                              <button
                                onClick={() => deletePeriod(dayIdx, pIdx)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded"
                                title="Remove this period"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-4 py-3 text-xs text-slate-400 italic">No periods set for this day.</p>
                )}

                {/* Add period button */}
                <div className="px-4 py-2.5 border-t border-slate-100">
                  <button
                    onClick={() => addPeriod(dayIdx)}
                    className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Period
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
