'use client'

import { Fragment, useActionState, useEffect, useTransition, useState } from 'react'
import {
  createClass   as createClassAction,
  assignTeacher as assignTeacherAction,
  deleteClass   as deleteClassAction,
  updateClass   as updateClassAction,
} from '@/lib/actions/class'
import {
  addStudent             as addStudentAction,
  updateStudent          as updateStudentAction,
  deleteStudent          as deleteStudentAction,
  fetchStudentDeleteInfo as fetchStudentDeleteInfoAction,
} from '@/lib/actions/student'

/* ─── Shared input styles ──────────────────────────────────────────── */
const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition bg-white placeholder-slate-400'
const sel = `${inp} cursor-pointer`

/* ─── Academic session options ─────────────────────────────────────── */
function getSessionOptions() {
  const now   = new Date()
  const year  = now.getFullYear()
  // India: new academic year starts in June (month index 5)
  const base  = now.getMonth() >= 5 ? year : year - 1
  return [
    `${base - 1}-${String(base).slice(-2)}`,
    `${base}-${String(base + 1).slice(-2)}`,
    `${base + 1}-${String(base + 2).slice(-2)}`,
  ]
}

/* ─── Student initials avatar ──────────────────────────────────────── */
function Avatar({ name }) {
  const initials = name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  const palettes = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ]
  const color = palettes[(name?.charCodeAt(0) || 0) % palettes.length]
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

/* ─── Error banner ─────────────────────────────────────────────────── */
function Err({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs mb-4">
      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9v2a1 1 0 002 0V9a1 1 0 00-2 0zm0 4a1 1 0 102 0 1 1 0 00-2 0z" clipRule="evenodd" />
      </svg>
      {msg}
    </div>
  )
}

/* ─── Spinner icon ─────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function ClassSection({ classes, teachers }) {

  /* ── All state & effects — unchanged from original ── */
  const [showCreate, setShowCreate] = useState(false)
  const [createKey,  setCreateKey]  = useState(0)
  const [createState, createAction, createPending] = useActionState(createClassAction, null)

  useEffect(() => {
    if (createState?.success) { setShowCreate(false); setCreateKey(k => k + 1) }
  }, [createState?.success])

  const [expandedId, setExpandedId] = useState(null)
  const [studentKey, setStudentKey] = useState(0)
  const [studentState, studentAction, studentPending] = useActionState(addStudentAction, null)

  useEffect(() => {
    if (studentState?.success) setStudentKey(k => k + 1)
  }, [studentState?.ts])

  const [assigningId, setAssigningId] = useState(null)
  const [assignState, assignAction, assignPending] = useActionState(assignTeacherAction, null)

  useEffect(() => {
    if (assignState?.success) setAssigningId(null)
  }, [assignState?.success])

  const [editingStudent, setEditingStudent] = useState(null)
  const [editKey,        setEditKey]        = useState(0)
  const [editState, editAction, editPending] = useActionState(updateStudentAction, null)

  useEffect(() => {
    if (editState?.success) { setEditingStudent(null); setEditKey(k => k + 1) }
  }, [editState?.success])

  const [renamingId,   setRenamingId]   = useState(null)
  const [renameData,   setRenameData]   = useState({ name: '', section: '' })
  const [renameError,  setRenameError]  = useState('')
  const [renameSaving, setRenameSaving] = useState(false)

  function startRename(cls) {
    setRenamingId(cls._id)
    setRenameData({ name: cls.name, section: cls.section || '' })
    setRenameError('')
  }

  async function saveRename() {
    setRenameSaving(true)
    setRenameError('')
    const res = await updateClassAction(renamingId, renameData)
    setRenameSaving(false)
    if (res?.error) { setRenameError(res.error); return }
    setRenamingId(null)
  }

  const [deletingClassId,  setDeletingClassId]  = useState(null)
  const [classDeleteError, setClassDeleteError] = useState('')
  const [isClassDeleting,  startClassDelete]    = useTransition()
  const [deletePreview,    setDeletePreview]    = useState(null) // { student, counts }
  const [fetchingDeleteId, setFetchingDeleteId] = useState(null)
  const [deletingConfirm,  setDeletingConfirm]  = useState(false)
  const [studentDeleteErr, setStudentDeleteErr] = useState('')

  async function openDeleteConfirm(s) {
    setFetchingDeleteId(s._id)
    setEditingStudent(null)
    setStudentDeleteErr('')
    const info = await fetchStudentDeleteInfoAction(s._id)
    setFetchingDeleteId(null)
    setDeletePreview({ student: s, counts: info?.counts || { attendance: 0, exams: 0, homework: 0, fees: 0 } })
  }

  async function confirmDeleteStudent(studentId) {
    setDeletingConfirm(true)
    setStudentDeleteErr('')
    const result = await deleteStudentAction(studentId)
    setDeletingConfirm(false)
    if (result?.error) { setStudentDeleteErr(result.error); return }
    setDeletePreview(null)
  }

  function handleClassDelete(classId) {
    setClassDeleteError('')
    startClassDelete(async () => {
      const fd = new FormData()
      fd.set('classId', classId)
      const result = await deleteClassAction(fd)
      if (result?.error) { setClassDeleteError(result.error); return }
      setDeletingClassId(null)
    })
  }

  /* ── Derived totals ── */
  const totalStudents = classes.reduce((sum, c) => sum + (c.students?.length ?? c.studentCount ?? 0), 0)
  const unmanagedCount = classes.filter(c => !c.classTeacher).length

  /* ═══════════════ RENDER ═══════════════════════════════════════════ */
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

      {/* ── Section header ─────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🏫</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">Classes & Students</h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">{classes.length}</span>
              {unmanagedCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full" title="Classes with no class teacher assigned">
                  ⚠ {unmanagedCount} unmanaged
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{totalStudents} students enrolled</p>
          </div>
        </div>
        <button
          onClick={() => { setShowCreate(v => !v); setCreateKey(k => k + 1) }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showCreate ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
          </svg>
          {showCreate ? 'Cancel' : 'New Class'}
        </button>
      </div>

      {/* ── Create class form ──────────────────────────────────────── */}
      {showCreate && (
        <div className="px-6 py-5 bg-blue-50/60 border-b border-blue-100">
          <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">+</span>
            Create New Class
          </p>
          <Err msg={createState?.error} />
          <form key={createKey} action={createAction}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Class Name <span className="text-red-400">*</span>
                </label>
                <input name="name" required maxLength={50} placeholder='e.g. "Class 5" or "10th"' className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Section <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input name="section" placeholder='e.g. "A", "B"' className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Class Teacher <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <select name="classTeacherId" defaultValue="" className={sel}>
                  <option value="">— Assign later —</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name}{t.subject ? ` (${t.subject})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button type="submit" disabled={createPending}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition-colors shadow-sm">
                {createPending ? <><Spinner /> Creating…</> : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {classes.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🏫</div>
          <p className="text-slate-600 font-semibold">No classes yet</p>
          <p className="text-slate-400 text-sm mt-1">Click &ldquo;New Class&rdquo; to get started</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {classes.map((cls, i) => {
            const label       = cls.section ? `${cls.name} — ${cls.section}` : cls.name
            const isExpanded  = expandedId === cls._id
            const isAssigning = assigningId === cls._id
            const isDeleting  = deletingClassId === cls._id
            const stuCount    = cls.students?.length ?? cls.studentCount ?? 0

            return (
              <Fragment key={String(cls._id || i)}>

                {/* ── Class row ─────────────────────────────────────── */}
                <div className={`px-6 py-4 flex items-center justify-between gap-4 transition-colors ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50/60'}`}>

                  {/* Left: index + class info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      {/* Class name / rename form */}
                      {renamingId === cls._id ? (
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <input
                            value={renameData.name}
                            onChange={e => setRenameData(d => ({ ...d, name: e.target.value }))}
                            placeholder="Class name"
                            maxLength={100}
                            className="px-2 py-1 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 w-28"
                          />
                          <input
                            value={renameData.section}
                            onChange={e => setRenameData(d => ({ ...d, section: e.target.value }))}
                            placeholder="Section (opt)"
                            className="px-2 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-24"
                          />
                          <button onClick={saveRename} disabled={renameSaving}
                            className="px-2 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg">
                            {renameSaving ? '…' : 'Save'}
                          </button>
                          <button onClick={() => setRenamingId(null)}
                            className="px-2 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                            Cancel
                          </button>
                          {renameError && <p className="text-xs text-red-600 w-full">{renameError}</p>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 text-sm">{label}</p>
                          <button onClick={() => startRename(cls)}
                            className="text-xs px-1.5 py-0.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Rename class">
                            ✏️
                          </button>
                        </div>
                      )}

                      {/* Teacher display / assign form */}
                      {isAssigning ? (
                        <form action={assignAction} className="flex items-center gap-2 mt-1.5">
                          <input type="hidden" name="classId" value={cls._id} />
                          <select name="classTeacherId" defaultValue={cls.classTeacher?._id || ''}
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                            <option value="">— Remove teacher —</option>
                            {teachers.map(t => (
                              <option key={t._id} value={t._id}>{t.name}{t.subject ? ` (${t.subject})` : ''}</option>
                            ))}
                          </select>
                          <button type="submit" disabled={assignPending}
                            className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg">
                            {assignPending ? '…' : 'Save'}
                          </button>
                          <button type="button" onClick={() => setAssigningId(null)}
                            className="px-3 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2 mt-0.5">
                          {cls.classTeacher ? (
                            <>
                              <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-xs text-slate-500">{cls.classTeacher.name}</span>
                              {cls.classTeacher.subject && (
                                <span className="text-xs text-slate-400">· {cls.classTeacher.subject}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-amber-600 font-medium">⚠ No class teacher</span>
                          )}
                          <button onClick={() => setAssigningId(cls._id)}
                            className="text-xs px-2 py-0.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md font-medium transition-colors">
                            {cls.classTeacher ? 'Change' : 'Assign'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: student count + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20H5a2 2 0 01-2-2v-1a5 5 0 015-5h8a5 5 0 015 5v1a2 2 0 01-2 2zM12 11a4 4 0 100-8 4 4 0 000 8z" />
                      </svg>
                      <span className="text-xs font-bold text-slate-600">{stuCount}</span>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : cls._id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                        isExpanded ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                      </svg>
                      Students
                    </button>

                    {isDeleting ? (
                      <div className="flex flex-col items-end gap-1">
                        {classDeleteError && (
                          <p className="text-xs text-red-600 max-w-40 text-right">{classDeleteError}</p>
                        )}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleClassDelete(cls._id)}
                            disabled={isClassDeleting}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-xl transition-colors">
                            {isClassDeleting ? 'Deleting…' : 'Confirm Delete'}
                          </button>
                          <button onClick={() => { setDeletingClassId(null); setClassDeleteError('') }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingClassId(cls._id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Expanded students panel ───────────────────────── */}
                {isExpanded && (
                  <div className="border-t border-blue-100 bg-slate-50">
                    <div className="p-5 space-y-4">

                      {/* Add student form */}
                      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                          <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          Add Student to <span className="text-blue-600 font-extrabold">{label}</span>
                        </h3>
                        <Err msg={studentState?.error} />
                        <form key={`${cls._id}-${studentKey}`} action={studentAction}>
                          <input type="hidden" name="classId" value={cls._id} />
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Student Name <span className="text-red-400">*</span>
                              </label>
                              <input name="name" required maxLength={100} placeholder="Full name" className={inp} />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Roll No. <span className="text-slate-400 font-normal">(optional)</span>
                              </label>
                              <input name="rollNumber" placeholder="e.g. 01" className={inp} />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Parent Mobile <span className="text-slate-400 font-normal">(optional)</span>
                              </label>
                              <input name="parentMobile" placeholder="10-digit number" maxLength={10} className={inp} />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Session <span className="text-amber-500 font-normal">(recommended)</span>
                              </label>
                              <select name="admissionSession" defaultValue={getSessionOptions()[1]} className={sel}>
                                <option value="">— Not set —</option>
                                {getSessionOptions().map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end">
                              <button type="submit" disabled={studentPending}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-xl transition-colors shadow-sm">
                                {studentPending ? <><Spinner />Adding…</> : <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add Student
                                </>}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>

                      {/* Student list */}
                      {!cls.students || cls.students.length === 0 ? (
                        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-12 text-center">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20H5a2 2 0 01-2-2v-1a5 5 0 015-5h8a5 5 0 015 5v1a2 2 0 01-2 2zM12 11a4 4 0 100-8 4 4 0 000 8z" />
                            </svg>
                          </div>
                          <p className="text-slate-500 font-semibold text-sm">No students enrolled yet</p>
                          <p className="text-slate-400 text-xs mt-1">Use the form above to add your first student</p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          {/* List header */}
                          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                              {cls.students.length} Student{cls.students.length !== 1 ? 's' : ''}
                            </span>
                            <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                              <span className="hidden sm:block w-16 text-center">Roll No.</span>
                              <span className="hidden md:block w-28">Parent Mobile</span>
                              <span className="w-20 text-right">Actions</span>
                            </div>
                          </div>

                          {/* Student rows */}
                          <div className="divide-y divide-slate-100">
                            {cls.students.map((s, si) => {
                              const isEditing        = editingStudent?._id === s._id
                              const hasDeletePreview = deletePreview?.student._id === s._id
                              const isFetchingDelete = fetchingDeleteId === s._id

                              /* Delete-confirm mode */
                              if (hasDeletePreview) return (
                                <div key={s._id} className="px-5 py-4 bg-red-50/70 border-l-2 border-red-400">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <Avatar name={s.name} />
                                      <div className="min-w-0">
                                        <p className="text-xs text-red-600 font-bold uppercase tracking-wide mb-0.5">Archive student?</p>
                                        <p className="text-sm font-bold text-slate-800">{s.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                          {deletePreview.counts.attendance} attendance&nbsp;&middot;&nbsp;
                                          {deletePreview.counts.exams} exam results&nbsp;&middot;&nbsp;
                                          {deletePreview.counts.homework} homework&nbsp;&middot;&nbsp;
                                          {deletePreview.counts.fees} fee records retained
                                        </p>
                                        {studentDeleteErr && (
                                          <p className="text-xs text-red-600 mt-1">{studentDeleteErr}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <button onClick={() => confirmDeleteStudent(s._id)} disabled={deletingConfirm}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors">
                                        {deletingConfirm ? <><Spinner />Archiving…</> : 'Confirm Archive'}
                                      </button>
                                      <button onClick={() => { setDeletePreview(null); setStudentDeleteErr('') }}
                                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )

                              /* Edit mode */
                              if (isEditing) return (
                                <div key={s._id} className="px-5 py-4 bg-amber-50/70">
                                  <div className="flex items-center gap-3 mb-4">
                                    <Avatar name={s.name} />
                                    <div>
                                      <p className="text-xs text-amber-600 font-bold uppercase tracking-wide">Editing</p>
                                      <p className="text-sm font-bold text-slate-800">{s.name}</p>
                                    </div>
                                  </div>
                                  <Err msg={editState?.error} />
                                  <form key={editKey} action={editAction}>
                                    <input type="hidden" name="studentId" value={s._id} />
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                      <div className="col-span-2 lg:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Name <span className="text-red-400">*</span></label>
                                        <input name="name" required maxLength={100} defaultValue={s.name} className={inp} />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Roll No. <span className="text-slate-400 font-normal">(optional)</span></label>
                                        <input name="rollNumber" defaultValue={s.rollNumber || ''} placeholder="01" className={inp} />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Parent Name <span className="text-slate-400 font-normal">(optional)</span></label>
                                        <input name="parentName" maxLength={100} defaultValue={s.parentName || ''} placeholder="Father / Mother name" className={inp} />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Parent Mobile <span className="text-slate-400 font-normal">(optional)</span></label>
                                        <input name="parentMobile" defaultValue={s.parentMobile || ''} placeholder="9999999999" maxLength={10} className={inp} />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                      <button type="submit" disabled={editPending}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 rounded-lg transition-colors shadow-sm">
                                        {editPending ? <><Spinner />Saving…</> : '✓ Save Changes'}
                                      </button>
                                      <button type="button" onClick={() => setEditingStudent(null)}
                                        className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              )

                              /* Normal row */
                              return (
                                <div key={s._id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className="text-xs text-slate-400 font-mono w-5 text-right flex-shrink-0">{si + 1}</span>
                                    <Avatar name={s.name} />
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                                      {s.parentName && (
                                        <p className="text-xs text-slate-400 truncate">Parent: {s.parentName}</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 flex-shrink-0">
                                    <span className="hidden sm:block text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md w-16 text-center">
                                      {s.rollNumber || '—'}
                                    </span>
                                    {s.parentMobile ? (
                                      <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 w-28">
                                        <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {s.parentMobile}
                                      </span>
                                    ) : (
                                      <span className="hidden md:block text-xs text-slate-300 w-28 pl-4">—</span>
                                    )}

                                    <div className="flex items-center gap-1.5 w-20 justify-end">
                                      <button
                                        onClick={() => { setEditingStudent(s); setDeletePreview(null) }}
                                        className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => openDeleteConfirm(s)}
                                        disabled={isFetchingDelete}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-colors">
                                        {isFetchingDelete ? <Spinner /> : (
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
