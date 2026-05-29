'use client'

import { useState, useEffect, useTransition } from 'react'
import { fetchTimetable, saveTimetable, clearTimetable } from '@/lib/actions/timetable'

const DAYS    = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]

function emptySchedule() {
  return DAYS.map(day => ({
    day,
    periods: PERIODS.map(n => ({ periodNumber: n, subject: '', teacherName: '', startTime: '', endTime: '' })),
  }))
}

export default function TimetableSection({ classes, subjects = [], teachers = [] }) {
  const [selectedClass, setSelectedClass] = useState(classes[0]?._id || '')
  const [schedule,      setSchedule]      = useState(emptySchedule())
  const [loading,       setLoading]       = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState('')
  const [confirmClear,  setConfirmClear]  = useState(false)
  const [isPending,     startTransition]  = useTransition()

  useEffect(() => {
    if (!selectedClass) return
    setLoading(true)
    fetchTimetable(selectedClass).then(tt => {
      setSchedule(tt?.schedule?.length ? tt.schedule : emptySchedule())
      setLoading(false)
    })
  }, [selectedClass])

  function updateCell(dayIdx, periodIdx, field, value) {
    setSchedule(prev => {
      const next = prev.map(d => ({ ...d, periods: [...d.periods] }))
      next[dayIdx].periods[periodIdx] = { ...next[dayIdx].periods[periodIdx], [field]: value }
      return next
    })
  }

  function handleSave() {
    setSaved(false); setError('')
    startTransition(async () => {
      const fd = new FormData()
      fd.set('classId',  selectedClass)
      fd.set('schedule', JSON.stringify(schedule))
      const result = await saveTimetable(null, fd)
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  if (!classes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
        <span className="text-5xl mb-4">📅</span>
        <p className="text-slate-600 font-medium">No classes yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Timetable</h2>
          <p className="text-sm text-slate-500 mt-0.5">Set the weekly schedule for each class</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {classes.map(c => (
              <option key={String(c._id)} value={String(c._id)}>
                {c.name}{c.section ? ` — ${c.section}` : ''}
              </option>
            ))}
          </select>
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Clear all periods?</span>
              <button
                onClick={() => startTransition(async () => {
                  const res = await clearTimetable(selectedClass)
                  if (!res?.error) { setSchedule(emptySchedule()); setSaved(false) }
                  else setError(res.error)
                  setConfirmClear(false)
                })}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isPending ? 'Clearing…' : 'Yes, Clear'}
              </button>
              <button onClick={() => setConfirmClear(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmClear(true)} disabled={isPending || loading}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg transition-colors">
              Clear
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

      {saved  && <p className="text-emerald-600 text-sm font-medium">Timetable saved successfully.</p>}
      {error  && <p className="text-red-600   text-sm">{error}</p>}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-4">
          {schedule.map((dayObj, dayIdx) => (
            <div key={dayObj.day} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-700 text-sm">{dayObj.day}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100">
                      <th className="px-3 py-2 text-left font-medium">Period</th>
                      <th className="px-3 py-2 text-left font-medium">Subject</th>
                      <th className="px-3 py-2 text-left font-medium">Teacher</th>
                      <th className="px-3 py-2 text-left font-medium">Start</th>
                      <th className="px-3 py-2 text-left font-medium">End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayObj.periods.map((p, pIdx) => (
                      <tr key={p.periodNumber} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-1.5 text-slate-500 font-medium">{p.periodNumber}</td>
                        <td className="px-3 py-1.5">
                          {subjects.length > 0 ? (
                            <select
                              value={p.subject}
                              onChange={e => updateCell(dayIdx, pIdx, 'subject', e.target.value)}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
                            >
                              <option value="">—</option>
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
                        <td className="px-3 py-1.5">
                          {teachers.length > 0 ? (
                            <select
                              value={p.teacherName}
                              onChange={e => updateCell(dayIdx, pIdx, 'teacherName', e.target.value)}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
                            >
                              <option value="">— Select —</option>
                              {teachers.map(t => (
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
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="time" value={p.startTime}
                            onChange={e => updateCell(dayIdx, pIdx, 'startTime', e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="time" value={p.endTime}
                            onChange={e => updateCell(dayIdx, pIdx, 'endTime', e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
