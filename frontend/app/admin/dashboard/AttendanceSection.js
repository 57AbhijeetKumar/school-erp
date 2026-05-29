'use client'

import { useState, useTransition } from 'react'
import { fetchClassAttendance, markAdminAttendance } from '@/lib/actions/attendance'

const STATUS_STYLE = {
  present:      'bg-emerald-100 text-emerald-700',
  absent:       'bg-red-100    text-red-700',
  late:         'bg-amber-100  text-amber-700',
  'not-marked': 'bg-slate-100  text-slate-500',
}

function todayString() {
  return new Date().toISOString().split('T')[0]
}

export default function AttendanceSection({ classes }) {
  const [classId,     setClassId]     = useState(classes[0]?._id ?? '')
  const [date,        setDate]        = useState(todayString())
  const [attendance,  setAttendance]  = useState(null)
  const [editMode,    setEditMode]    = useState(false)
  const [editMap,     setEditMap]     = useState({})   // { studentId: 'present'|'absent'|'late' }
  const [saveMsg,     setSaveMsg]     = useState('')
  const [saveError,   setSaveError]   = useState('')
  const [isPending,   startTransition]  = useTransition()
  const [isSaving,    startSaveTransition] = useTransition()

  const selectedClass = classes.find(c => String(c._id) === String(classId))
  const hasClassTeacher = !!selectedClass?.classTeacher

  function load() {
    if (!classId) return
    setEditMode(false)
    setSaveMsg('')
    setSaveError('')
    startTransition(async () => {
      const data = await fetchClassAttendance(classId, date)
      setAttendance(data)
    })
  }

  function enterEditMode() {
    const initial = {}
    attendance.records.forEach(r => {
      initial[r.studentId] = r.status === 'not-marked' ? 'absent' : r.status
    })
    setEditMap(initial)
    setSaveMsg('')
    setSaveError('')
    setEditMode(true)
  }

  function handleStatusChange(studentId, status) {
    setEditMap(prev => ({ ...prev, [studentId]: status }))
  }

  function saveAttendance() {
    const records = Object.entries(editMap).map(([studentId, status]) => ({ studentId, status }))
    startSaveTransition(async () => {
      const result = await markAdminAttendance(classId, date, records)
      if (result?.error) {
        setSaveError(result.error)
      } else {
        setSaveMsg('Attendance saved successfully.')
        setSaveError('')
        setEditMode(false)
        // Reload to show updated data
        const data = await fetchClassAttendance(classId, date)
        setAttendance(data)
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-base">📋</div>
        <h2 className="text-base font-bold text-slate-800">Attendance</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={classId}
          onChange={e => { setClassId(e.target.value); setAttendance(null); setEditMode(false); setSaveMsg(''); setSaveError('') }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {classes.map(cls => (
            <option key={cls._id} value={cls._id}>
              {cls.name}{cls.section ? ` — ${cls.section}` : ''}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          max={todayString()}
          onChange={e => { setDate(e.target.value); setAttendance(null); setEditMode(false); setSaveMsg(''); setSaveError('') }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />

        <button
          onClick={load}
          disabled={isPending || !classId}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {isPending ? 'Loading…' : 'View'}
        </button>
      </div>

      {/* No class teacher warning */}
      {selectedClass && !hasClassTeacher && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="text-amber-500 mt-0.5">⚠</span>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">No class teacher assigned.</span> The teacher app cannot mark
            attendance for this class. Use <span className="font-semibold">Mark Attendance</span> below to
            enter it manually from the admin panel.
          </p>
        </div>
      )}

      {saveMsg  && <p className="mb-3 text-sm text-emerald-600 font-medium">{saveMsg}</p>}
      {saveError && <p className="mb-3 text-sm text-red-600">{saveError}</p>}

      {!attendance && !isPending && (
        <p className="text-sm text-slate-400 text-center py-8">
          Select a class and date, then click View
        </p>
      )}

      {isPending && (
        <p className="text-sm text-slate-400 text-center py-8">Loading attendance…</p>
      )}

      {attendance && !isPending && (
        <>
          {/* Summary row + action button */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-medium px-3 py-1.5 bg-slate-50 rounded-full text-slate-600">
              {selectedClass?.name}{selectedClass?.section ? ` — ${selectedClass.section}` : ''}
              &nbsp;·&nbsp;{attendance.date}
            </span>
            {attendance.isMarked ? (
              <>
                <span className="text-xs font-medium px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full">
                  ✓ Present: {attendance.presentCount}
                </span>
                <span className="text-xs font-medium px-3 py-1.5 bg-red-50 text-red-700 rounded-full">
                  ✗ Absent: {attendance.absentCount}
                </span>
                <span className="text-xs font-medium px-3 py-1.5 bg-slate-50 text-slate-500 rounded-full">
                  Total: {attendance.totalCount}
                </span>
              </>
            ) : (
              <span className="text-xs font-medium px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full">
                ⚠ Not marked yet
              </span>
            )}

            {/* Admin mark / override button */}
            {!editMode && attendance.records.length > 0 && (
              <button
                onClick={enterEditMode}
                className="ml-auto text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                {attendance.isMarked ? '✏ Override' : '✏ Mark Attendance'}
              </button>
            )}
          </div>

          {attendance.records.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No students in this class.</p>
          ) : editMode ? (
            /* ── Edit mode ── */
            <div>
              <p className="text-xs text-indigo-700 font-medium mb-3 px-1">
                Admin override — select status for each student and save.
              </p>
              <div className="overflow-x-auto rounded-xl border border-indigo-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-50 text-left">
                      <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide w-16">Roll</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Student Name</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attendance.records.map(r => (
                      <tr key={r.studentId} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.rollNumber ?? '—'}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{r.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {['present', 'absent', 'late'].map(s => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(r.studentId, s)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize transition-colors ${
                                  editMap[r.studentId] === s
                                    ? s === 'present' ? 'bg-emerald-500 text-white'
                                      : s === 'late'  ? 'bg-amber-500 text-white'
                                      : 'bg-red-500 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={saveAttendance}
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {isSaving ? 'Saving…' : 'Save Attendance'}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-5 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide w-16">Roll</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Student Name</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attendance.records.map(r => (
                    <tr key={r.studentId} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.rollNumber ?? '—'}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{r.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[r.status] ?? STATUS_STYLE['not-marked']}`}>
                          {r.status === 'not-marked' ? 'Not Marked' : r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
