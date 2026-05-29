'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  fetchStudentLeaves, resolveStudentLeave, deleteStudentLeave,
  fetchTeacherLeaves, resolveTeacherLeave, deleteTeacherLeave,
  fetchSubstitutionsForLeave, assignSubstitute, generateSubstitutions,
} from '@/lib/actions/adminLeave'

const STATUS_COLORS = {
  pending:  'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

function groupByDate(subs) {
  const grouped = {}
  for (const sub of subs) {
    const key = new Date(sub.date).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(sub)
  }
  return grouped
}

function SubstitutionPanel({ leave, teachers }) {
  const [open,        setOpen]       = useState(false)
  const [subs,        setSubs]       = useState(null)   // null = not yet loaded
  const [loading,     setLoading]    = useState(false)
  const [generating,  setGenerating] = useState(false)
  const [genError,    setGenError]   = useState('')
  const [selections,  setSelections] = useState({})     // subId → teacherId
  const [saving,      setSaving]     = useState({})     // subId → bool
  const [errors,      setErrors]     = useState({})

  async function load() {
    setLoading(true)
    const data = await fetchSubstitutionsForLeave(leave._id)
    setSubs(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenError('')
    const result = await generateSubstitutions(leave._id)
    if (result?.error) {
      setGenError(result.error)
    } else {
      setSubs(Array.isArray(result.substitutions) ? result.substitutions : [])
    }
    setGenerating(false)
  }

  function toggle() {
    if (!open && subs === null) load()
    setOpen(o => !o)
  }

  async function handleAssign(sub) {
    const teacherId = selections[sub._id]
    if (!teacherId) return
    const teacher = teachers.find(t => t._id === teacherId)
    if (!teacher) return
    setSaving(s => ({ ...s, [sub._id]: true }))
    setErrors(e => ({ ...e, [sub._id]: '' }))
    const result = await assignSubstitute(sub._id, teacherId, teacher.name)
    if (result?.error) {
      setErrors(e => ({ ...e, [sub._id]: result.error }))
    } else {
      setSubs(prev => prev.map(s =>
        s._id === sub._id
          ? { ...s, status: 'assigned', substituteTeacherName: teacher.name }
          : s
      ))
    }
    setSaving(s => ({ ...s, [sub._id]: false }))
  }

  const unassignedCount = subs ? subs.filter(s => s.status === 'unassigned').length : null
  const grouped = subs ? groupByDate(subs) : {}

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
        <span>Substitutions</span>
        {unassignedCount !== null && unassignedCount > 0 && (
          <span className="ml-1 bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-semibold">
            {unassignedCount} unassigned
          </span>
        )}
        {unassignedCount === 0 && subs !== null && (
          <span className="ml-1 bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5">all assigned</span>
        )}
      </button>

      {open && (
        <div className="mt-2">
          {loading && <p className="text-xs text-slate-400 py-1">Loading substitutions…</p>}

          {!loading && subs !== null && subs.length === 0 && (
            <div className="py-1">
              <p className="text-xs text-slate-400">
                No periods found — either the teacher has no periods on those days, or the leave was approved before this feature was deployed.
              </p>
              {genError && <p className="text-xs text-red-500 mt-1">{genError}</p>}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-2 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {generating ? 'Generating…' : 'Re-generate Substitutions'}
              </button>
            </div>
          )}

          {!loading && subs !== null && subs.length > 0 && (
            <div className="space-y-3 mt-2">
              {Object.entries(grouped).map(([dateLabel, daySubs]) => (
                <div key={dateLabel}>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{dateLabel}</p>
                  <div className="space-y-1.5">
                    {daySubs.map(sub => (
                      <div key={sub._id} className="bg-slate-50 rounded-lg px-3 py-2 text-xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <span className="font-medium text-slate-700">P{sub.periodNumber}: {sub.subject}</span>
                            <span className="text-slate-400 ml-2">{sub.className}</span>
                            {sub.startTime && (
                              <span className="text-slate-400 ml-2">{sub.startTime}–{sub.endTime}</span>
                            )}
                          </div>

                          {sub.status === 'assigned' ? (
                            <span className="text-emerald-600 font-medium shrink-0">
                              ✓ {sub.substituteTeacherName}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                              <select
                                value={selections[sub._id] || ''}
                                onChange={e => setSelections(s => ({ ...s, [sub._id]: e.target.value }))}
                                className="border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                              >
                                <option value="">Select teacher…</option>
                                {teachers.map(t => (
                                  <option key={t._id} value={t._id}>{t.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssign(sub)}
                                disabled={!selections[sub._id] || saving[sub._id]}
                                className="px-2.5 py-1 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                              >
                                {saving[sub._id] ? '…' : 'Assign'}
                              </button>
                            </div>
                          )}
                        </div>
                        {errors[sub._id] && (
                          <p className="text-red-500 mt-1">{errors[sub._id]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LeaveCard({ leave, onResolve, onDelete, isPending, nameField = 'student', teachers = null }) {
  const [rejectMode, setRejectMode] = useState(false)
  const [note,       setNote]       = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [deleteErr,  setDeleteErr]  = useState('')
  const name = leave[nameField]?.name || leave[nameField] || '—'

  async function handleDelete() {
    setDeleting(true)
    setDeleteErr('')
    const result = await onDelete(leave._id)
    if (result?.error) { setDeleteErr(result.error); setDeleting(false) }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-slate-800">{name}</span>
            {leave.rollNumber && <span className="text-xs text-slate-500">#{leave.rollNumber}</span>}
            <StatusBadge status={leave.status} />
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-medium">
              {new Date(leave.fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              {' – '}
              {new Date(leave.toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </p>
          <p className="text-sm text-slate-500 mt-1">{leave.reason}</p>
          {leave.leaveType && (
            <p className="text-xs text-slate-400 mt-0.5 capitalize">Type: {leave.leaveType}</p>
          )}
          {leave.rejectionNote && (
            <p className="text-xs text-red-500 mt-1">Note: {leave.rejectionNote}</p>
          )}
          {leave.resolvedByName && leave.status !== 'pending' && (
            <p className="text-xs text-slate-400 mt-1">
              {leave.status === 'approved' ? 'Approved' : 'Rejected'} by {leave.resolvedByName}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 items-end shrink-0">
          {/* Resolve buttons — only when pending */}
          {leave.status === 'pending' && !rejectMode && (
            <div className="flex gap-2">
              <button onClick={() => onResolve(leave._id, 'approve')} disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                Approve
              </button>
              <button onClick={() => setRejectMode(true)} disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">
                Reject
              </button>
            </div>
          )}
          {leave.status === 'pending' && rejectMode && (
            <div className="flex flex-col gap-2 w-52">
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Rejection note (optional)" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setRejectMode(false); setNote('') }}
                  className="px-2 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">
                  Cancel
                </button>
                <button onClick={() => onResolve(leave._id, 'reject', note)} disabled={isPending}
                  className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  Confirm
                </button>
              </div>
            </div>
          )}

          {/* Delete — always available */}
          {confirmDel ? (
            <div className="flex flex-col items-end gap-1">
              {deleteErr && <p className="text-xs text-red-600 max-w-36 text-right">{deleteErr}</p>}
              <div className="flex gap-1.5 items-center">
                <button onClick={handleDelete} disabled={deleting}
                  className="px-2 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                  {deleting ? '…' : 'Delete'}
                </button>
                <button onClick={() => { setConfirmDel(false); setDeleteErr('') }}
                  className="px-2 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  No
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} disabled={isPending}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Substitution panel — only for approved teacher leaves */}
      {teachers && leave.status === 'approved' && (
        <SubstitutionPanel leave={leave} teachers={teachers} />
      )}
    </div>
  )
}

export default function LeaveSection({ teachers = [] }) {
  const [tab,            setTab]            = useState('students')
  const [statusFilter,   setStatus]         = useState('')
  const [studentPage,    setStudentPage]    = useState(1)
  const [teacherPage,    setTeacherPage]    = useState(1)
  const [studentResult,  setStudentResult]  = useState({ data: [], total: 0, pages: 1 })
  const [teacherResult,  setTeacherResult]  = useState({ data: [], total: 0, pages: 1 })
  const [isPending,      startTransition]   = useTransition()

  useEffect(() => {
    fetchStudentLeaves(statusFilter || undefined, undefined, studentPage).then(setStudentResult)
  }, [statusFilter, studentPage])

  useEffect(() => {
    fetchTeacherLeaves(statusFilter || undefined, teacherPage).then(setTeacherResult)
  }, [statusFilter, teacherPage])

  function handleStudentResolve(id, action, note) {
    startTransition(async () => {
      await resolveStudentLeave(id, action, note)
      fetchStudentLeaves(statusFilter || undefined, undefined, studentPage).then(setStudentResult)
    })
  }

  function handleTeacherResolve(id, action, note) {
    startTransition(async () => {
      await resolveTeacherLeave(id, action, note)
      fetchTeacherLeaves(statusFilter || undefined, teacherPage).then(setTeacherResult)
    })
  }

  async function handleStudentDelete(id) {
    const result = await deleteStudentLeave(id)
    if (result?.error) return result
    setStudentResult(prev => ({ ...prev, data: prev.data.filter(l => l._id !== id) }))
  }

  async function handleTeacherDelete(id) {
    const result = await deleteTeacherLeave(id)
    if (result?.error) return result
    setTeacherResult(prev => ({ ...prev, data: prev.data.filter(l => l._id !== id) }))
  }

  const studentLeaves = studentResult.data
  const teacherLeaves = teacherResult.data
  const leaves  = tab === 'students' ? studentLeaves : teacherLeaves
  const result  = tab === 'students' ? studentResult : teacherResult
  const page    = tab === 'students' ? studentPage   : teacherPage
  const setPage = tab === 'students' ? setStudentPage : setTeacherPage

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Leave Requests</h2>
          <p className="text-sm text-slate-500 mt-0.5">Approve or reject student and teacher leave</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setStudentPage(1); setTeacherPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {['students', 'teachers'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t}
            {t === 'students' && studentLeaves.filter(l => l.status === 'pending').length > 0 && (
              <span className="ml-1.5 text-xs bg-amber-500 text-white rounded-full px-1.5 py-0.5">
                {studentLeaves.filter(l => l.status === 'pending').length}
              </span>
            )}
            {t === 'teachers' && teacherLeaves.filter(l => l.status === 'pending').length > 0 && (
              <span className="ml-1.5 text-xs bg-amber-500 text-white rounded-full px-1.5 py-0.5">
                {teacherLeaves.filter(l => l.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {leaves.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <span className="text-5xl mb-4">📋</span>
          <p className="text-slate-600 font-medium">No leave requests</p>
          <p className="text-slate-400 text-sm mt-1">
            {statusFilter ? `No ${statusFilter} requests found.` : 'No requests have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map(l => (
            <LeaveCard
              key={l._id}
              leave={l}
              nameField={tab === 'students' ? 'student' : 'teacher'}
              onResolve={tab === 'students' ? handleStudentResolve : handleTeacherResolve}
              onDelete={tab === 'students' ? handleStudentDelete : handleTeacherDelete}
              isPending={isPending}
              teachers={tab === 'teachers' ? teachers : null}
            />
          ))}
        </div>
      )}

      {result.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">{result.total} total · page {page} of {result.pages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || isPending}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">
              Prev
            </button>
            <button onClick={() => setPage(p => Math.min(result.pages, p + 1))} disabled={page >= result.pages || isPending}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
