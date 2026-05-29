'use client'

import { useState, useEffect, useTransition } from 'react'
import { createExam, fetchExams, fetchExamResults, publishExam, unpublishExam, deleteExam, updateExam, fetchExamStudents, adminEnterMarks } from '@/lib/actions/exam'

const GRADES = { 'A+': 'bg-emerald-100 text-emerald-700', A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-yellow-100 text-yellow-700', D: 'bg-orange-100 text-orange-700', F: 'bg-red-100 text-red-700' }

const DEFAULT_MARKS = { unit_test: 25, annual: 100 }

function AnnualSubjects({ formSubjects, subjectList, onAdd, onRemove, onUpdate }) {
  const allTaken = subjectList.length > 0 &&
    formSubjects.filter(s => s.name).length >= subjectList.length

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-slate-600">
          Subjects * <span className="text-slate-400 font-normal">({formSubjects.length} added)</span>
        </label>
        <button
          onClick={onAdd}
          disabled={allTaken}
          className="text-xs text-violet-600 hover:text-violet-800 font-semibold disabled:text-slate-300 disabled:cursor-not-allowed"
        >
          + Add Subject
        </button>
      </div>
      <div className="space-y-2">
        {formSubjects.map((s, i) => {
          const usedByOthers = formSubjects
            .filter((_, idx) => idx !== i)
            .map(x => x.name)
            .filter(Boolean)
          const available = subjectList.filter(sub => !usedByOthers.includes(sub.name))
          return (
            <div key={i} className="flex gap-2 items-center">
              {subjectList.length > 0 ? (
                <select
                  value={s.name}
                  onChange={e => onUpdate(i, 'name', e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                >
                  <option value="">— Select subject —</option>
                  {available.map(sub => (
                    <option key={sub._id} value={sub.name}>
                      {sub.name}{sub.code ? ` (${sub.code})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={s.name}
                  onChange={e => onUpdate(i, 'name', e.target.value)}
                  placeholder="Subject name"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              )}
              <input
                type="number" min="1"
                value={s.maxMarks}
                onChange={e => onUpdate(i, 'maxMarks', e.target.value)}
                placeholder="Max"
                className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              {formSubjects.length > 1 && (
                <button
                  onClick={() => onRemove(i)}
                  className="text-red-400 hover:text-red-600 text-lg font-bold leading-none"
                >×</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Edit Exam Modal ────────────────────────────────────────────────────────────
function EditExamModal({ exam, subjects, onClose, onSaved }) {
  const [name,         setName]         = useState(exam.name)
  const [examDate,     setExamDate]     = useState(exam.examDate || '')
  const [editSubjects, setEditSubjects] = useState(exam.subjects.map(s => ({ ...s })))
  const [err,          setErr]          = useState('')
  const [isPending,    startTransition] = useTransition()

  const canEditSubjects = !exam.marksEntered

  function addRow()     { setEditSubjects(s => [...s, { name: '', maxMarks: DEFAULT_MARKS[exam.type] }]) }
  function removeRow(i) { setEditSubjects(s => s.filter((_, idx) => idx !== i)) }
  function updateRow(i, k, v) {
    setEditSubjects(s => { const n = [...s]; n[i] = { ...n[i], [k]: v }; return n })
  }

  function handleSave() {
    if (!name.trim()) { setErr('Exam name is required'); return }
    if (canEditSubjects) {
      if (editSubjects.some(s => !s.name.trim())) { setErr('All subject names are required'); return }
      if (editSubjects.some(s => !s.maxMarks || Number(s.maxMarks) < 1)) { setErr('Max marks must be at least 1'); return }
      const names = editSubjects.map(s => s.name.trim().toLowerCase())
      if (new Set(names).size < names.length) { setErr('Duplicate subjects are not allowed'); return }
    }
    setErr('')
    startTransition(async () => {
      const data = { name: name.trim(), examDate }
      if (canEditSubjects) {
        data.subjects = editSubjects.map(s => ({ name: s.name.trim(), maxMarks: Number(s.maxMarks) }))
      }
      const res = await updateExam(exam.id, data)
      if (res?.error) { setErr(res.error); return }
      onSaved()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Edit Exam</h3>
        <p className="text-xs text-slate-400 mb-4">{exam.name}</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Exam Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Exam Date</label>
            <input
              type="date" value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {canEditSubjects ? (
            exam.type === 'unit_test' ? (
              <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl">
                <p className="text-xs font-semibold text-violet-700 mb-2.5">Subject &amp; Marks</p>
                <div className="flex gap-2 items-center">
                  {subjects.length > 0 ? (
                    <select
                      value={editSubjects[0]?.name ?? ''}
                      onChange={e => updateRow(0, 'name', e.target.value)}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                    >
                      <option value="">— Select subject —</option>
                      {subjects.map(sub => (
                        <option key={sub._id} value={sub.name}>{sub.name}{sub.code ? ` (${sub.code})` : ''}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={editSubjects[0]?.name ?? ''}
                      onChange={e => updateRow(0, 'name', e.target.value)}
                      placeholder="Subject name *"
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  )}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number" min="1"
                      value={editSubjects[0]?.maxMarks ?? ''}
                      onChange={e => updateRow(0, 'maxMarks', e.target.value)}
                      className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-center"
                    />
                    <span className="text-xs text-slate-400 whitespace-nowrap">max marks</span>
                  </div>
                </div>
              </div>
            ) : (
              <AnnualSubjects
                formSubjects={editSubjects}
                subjectList={subjects}
                onAdd={addRow}
                onRemove={removeRow}
                onUpdate={updateRow}
              />
            )
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Subjects (locked — marks already entered)</p>
              <div className="flex flex-wrap gap-2">
                {editSubjects.map(s => (
                  <span key={s.name} className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600">
                    {s.name} <span className="text-slate-400">/{s.maxMarks}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Marks Entry Modal ──────────────────────────────────────────────────────────
function MarksEntryModal({ exam, onClose, onSaved }) {
  const [students,  setStudents]  = useState([])
  const [marksMap,  setMarksMap]  = useState({})
  const [loading,   setLoading]   = useState(true)
  const [err,       setErr]       = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchExamStudents(exam.id).then(data => {
      // Backend returns a flat array: [{id, name, rollNumber, marks:[]}]
      const list = Array.isArray(data) ? data : (data?.students ?? [])
      setStudents(list)
      const map = {}
      list.forEach(s => {
        const sid = s.id ?? s._id
        map[sid] = {}
        ;(s.marks ?? []).forEach(m => {
          map[sid][m.subject] = String(m.obtained)
        })
      })
      setMarksMap(map)
      setLoading(false)
    })
  }, [exam.id])

  function setMark(studentId, subject, value) {
    setMarksMap(m => ({
      ...m,
      [studentId]: { ...(m[studentId] ?? {}), [subject]: value },
    }))
  }

  function handleSubmit() {
    for (const s of students) {
      const sid = s.id ?? s._id
      for (const sub of exam.subjects) {
        const raw = marksMap[sid]?.[sub.name]
        if (raw === undefined || raw === '') {
          setErr(`${s.name}: marks for "${sub.name}" are required`)
          return
        }
        const val = Number(raw)
        if (isNaN(val) || val < 0 || val > sub.maxMarks) {
          setErr(`${s.name}: marks for "${sub.name}" must be 0–${sub.maxMarks}`)
          return
        }
      }
    }
    setErr('')
    const results = students.map(s => {
      const sid = s.id ?? s._id
      return {
        studentId: sid,
        marks: exam.subjects.map(sub => ({
          subject:  sub.name,
          obtained: Number(marksMap[sid]?.[sub.name]),
          maxMarks: sub.maxMarks,
        })),
      }
    })
    startTransition(async () => {
      const res = await adminEnterMarks(exam.id, results)
      if (res?.error) { setErr(res.error); return }
      onSaved()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-0.5">Enter Marks</h3>
        <p className="text-xs text-slate-400 mb-4">
          {exam.name} · {exam.class?.name}{exam.class?.section ? ` — ${exam.class.section}` : ''}
        </p>

        {loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Loading students…</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No students found in this class.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="px-3 py-2 font-semibold text-slate-500 w-12">Roll</th>
                    <th className="px-3 py-2 font-semibold text-slate-500">Name</th>
                    {exam.subjects.map(s => (
                      <th key={s.name} className="px-3 py-2 font-semibold text-slate-500 text-center whitespace-nowrap">
                        {s.name}<br/><span className="text-slate-400 font-normal">/{s.maxMarks}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {students.map(s => {
                    const sid = s.id ?? s._id
                    return (
                      <tr key={sid} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-slate-400 font-mono">{s.rollNumber ?? '—'}</td>
                        <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">{s.name}</td>
                        {exam.subjects.map(sub => (
                          <td key={sub.name} className="px-2 py-1.5 text-center">
                            <input
                              type="number" min="0" max={sub.maxMarks}
                              value={marksMap[sid]?.[sub.name] ?? ''}
                              onChange={e => setMark(sid, sub.name, e.target.value)}
                              className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-violet-400"
                              placeholder="—"
                            />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {err && <p className="text-xs text-red-600 mt-3">{err}</p>}

            <div className="flex gap-3 mt-5">
              <button
                onClick={onClose}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {isPending ? 'Saving…' : 'Save Marks'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Section ───────────────────────────────────────────────────────────────
export default function ExamSection({ classes, initialExams, subjects = [] }) {
  const [exams,        setExams]        = useState(initialExams)
  const [expandedId,   setExpandedId]   = useState(null)
  const [results,      setResults]      = useState({})
  const [showCreate,   setShowCreate]   = useState(false)
  const [deletingId,   setDeletingId]   = useState(null)
  const [deleteErr,    setDeleteErr]    = useState('')
  const [editingExam,  setEditingExam]  = useState(null)
  const [marksExam,    setMarksExam]    = useState(null)
  const [isPending,    startTransition] = useTransition()

  // ── Create form state ──────────────────────────────────────────────────────
  function blankForm(type = 'unit_test') {
    return { name: '', type, classId: classes[0]?._id ?? '', examDate: '', subjects: [{ name: '', maxMarks: DEFAULT_MARKS[type] }] }
  }
  const [form,    setForm]    = useState(() => blankForm())
  const [formErr, setFormErr] = useState('')

  function changeType(type) {
    setForm(f => ({
      ...f,
      type,
      subjects: [{ name: f.subjects[0]?.name ?? '', maxMarks: DEFAULT_MARKS[type] }],
    }))
  }

  function addSubjectRow()        { setForm(f => ({ ...f, subjects: [...f.subjects, { name: '', maxMarks: DEFAULT_MARKS[f.type] }] })) }
  function removeSubjectRow(i)    { setForm(f => ({ ...f, subjects: f.subjects.filter((_, idx) => idx !== i) })) }
  function updateSubject(i, k, v) {
    setForm(f => {
      const s = [...f.subjects]; s[i] = { ...s[i], [k]: v }; return { ...f, subjects: s }
    })
  }

  function handleCreate() {
    if (!form.name.trim())   { setFormErr('Exam name is required'); return }
    if (!form.classId)       { setFormErr('Select a class'); return }
    if (form.subjects.some(s => !s.name.trim())) { setFormErr('All subject names are required'); return }
    if (form.subjects.some(s => !s.maxMarks || Number(s.maxMarks) < 1)) { setFormErr('Max marks must be at least 1'); return }
    const names = form.subjects.map(s => s.name.trim().toLowerCase())
    if (new Set(names).size < names.length) { setFormErr('Duplicate subjects are not allowed'); return }
    setFormErr('')
    startTransition(async () => {
      const res = await createExam(form)
      if (res.error) { setFormErr(res.error); return }
      const updated = await fetchExams()
      setExams(updated)
      setShowCreate(false)
      setForm(blankForm())
    })
  }

  function toggleExpand(id) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!results[id]) {
      startTransition(async () => {
        const data = await fetchExamResults(id)
        if (data) setResults(r => ({ ...r, [id]: data }))
      })
    }
  }

  function handlePublish(examId) {
    startTransition(async () => {
      const res = await publishExam(examId)
      if (!res.error) {
        setExams(ex => ex.map(e => e.id === examId ? { ...e, isPublished: true } : e))
      }
    })
  }

  function handleUnpublish(examId) {
    startTransition(async () => {
      const res = await unpublishExam(examId)
      if (!res.error) {
        setExams(ex => ex.map(e => e.id === examId ? { ...e, isPublished: false } : e))
        setResults(r => { const n = { ...r }; delete n[examId]; return n })
      }
    })
  }

  function handleDelete(examId) {
    setDeleteErr('')
    startTransition(async () => {
      const res = await deleteExam(examId)
      if (res?.error) {
        setDeleteErr(res.error)
        // keep deletingId open so user sees the error inline
      } else {
        setExams(ex => ex.filter(e => e.id !== examId))
        if (expandedId === examId) setExpandedId(null)
        setDeletingId(null)
      }
    })
  }

  async function refreshExams() {
    const updated = await fetchExams()
    setExams(updated)
    setResults({})
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center text-base">📝</div>
          <h2 className="text-base font-bold text-slate-800">Exams &amp; Results</h2>
        </div>
        <button
          onClick={() => { setShowCreate(true); setForm(blankForm()); setFormErr('') }}
          className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Create Exam
        </button>
      </div>

      {/* Exam list */}
      {exams.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No exams created yet.</p>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => (
            <div key={exam.id} className="border border-slate-100 rounded-xl overflow-hidden">
              {/* Exam header row — left half expands/collapses, right side has action buttons */}
              <div className="flex items-center px-4 py-3 hover:bg-slate-50/60 transition-colors">
                {/* Clickable info area */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => toggleExpand(exam.id)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{exam.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.type === 'annual' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {exam.type === 'annual' ? 'Annual' : 'Unit Test'}
                    </span>
                    <span className="text-xs text-slate-500">{exam.class?.name}{exam.class?.section ? ` — ${exam.class.section}` : ''}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {exam.subjects.map(s => `${s.name} (${s.maxMarks})`).join(' · ')}
                    {exam.examDate && ` · 📅 ${exam.examDate}`}
                  </p>
                </div>

                {/* Action buttons + status badge */}
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {/* Status badge */}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${exam.isPublished ? 'bg-emerald-100 text-emerald-700' : exam.marksEntered ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {exam.isPublished ? 'Published' : exam.marksEntered ? 'Marks Entered' : 'Pending'}
                  </span>

                  {/* Enter Marks — available when not yet published */}
                  {!exam.isPublished && (
                    <button
                      onClick={() => setMarksExam(exam)}
                      disabled={isPending}
                      className="px-2.5 py-1 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {exam.marksEntered ? 'Edit Marks' : 'Enter Marks'}
                    </button>
                  )}

                  {/* Edit */}
                  <button
                    onClick={() => setEditingExam(exam)}
                    disabled={isPending}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40"
                  >
                    Edit
                  </button>

                  {/* Delete with inline confirm — hidden for published exams */}
                  {!exam.isPublished && deletingId === exam.id ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">Delete?</span>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          disabled={isPending}
                          className="px-2 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                        >
                          {isPending ? '…' : 'Yes'}
                        </button>
                        <button
                          onClick={() => { setDeletingId(null); setDeleteErr('') }}
                          className="px-2 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          No
                        </button>
                      </div>
                      {deleteErr && (
                        <span className="text-xs text-red-500 max-w-[200px] text-right">{deleteErr}</span>
                      )}
                    </div>
                  ) : !exam.isPublished ? (
                    <button
                      onClick={() => { setDeletingId(exam.id); setDeleteErr('') }}
                      disabled={isPending}
                      className="px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    >
                      Delete
                    </button>
                  ) : null}

                  {/* Expand chevron */}
                  <span
                    className="text-slate-400 text-sm cursor-pointer select-none ml-1"
                    onClick={() => toggleExpand(exam.id)}
                  >
                    {expandedId === exam.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Expanded results */}
              {expandedId === exam.id && (
                <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/50">
                  {isPending && !results[exam.id] ? (
                    <p className="text-sm text-slate-400 text-center py-4">Loading results…</p>
                  ) : !results[exam.id] || results[exam.id].results.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-400">No marks entered yet.</p>
                      {!exam.isPublished && (
                        <button
                          onClick={() => setMarksExam(exam)}
                          className="mt-2 text-xs font-medium text-violet-600 hover:text-violet-800"
                        >
                          + Enter marks now
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Publish / Unpublish */}
                      <div className="flex justify-end mb-3">
                        {!exam.isPublished ? (
                          <button
                            onClick={() => handlePublish(exam.id)}
                            disabled={isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                          >
                            🚀 Publish Result
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-medium">✓ Result Published</span>
                            <button
                              onClick={() => handleUnpublish(exam.id)}
                              disabled={isPending}
                              className="text-xs text-amber-600 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 px-3 py-1.5 rounded-lg font-medium transition-colors"
                            >
                              Unpublish
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Results table */}
                      <div className="overflow-x-auto rounded-lg border border-slate-100">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-left">
                              <th className="px-3 py-2 font-semibold text-slate-500 w-12">Roll</th>
                              <th className="px-3 py-2 font-semibold text-slate-500">Name</th>
                              {results[exam.id].exam.subjects.map(s => (
                                <th key={s.name} className="px-3 py-2 font-semibold text-slate-500 text-center whitespace-nowrap">
                                  {s.name}<br/><span className="text-slate-400 font-normal">/{s.maxMarks}</span>
                                </th>
                              ))}
                              <th className="px-3 py-2 font-semibold text-slate-500 text-center">Total</th>
                              <th className="px-3 py-2 font-semibold text-slate-500 text-center">%</th>
                              <th className="px-3 py-2 font-semibold text-slate-500 text-center">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 bg-white">
                            {results[exam.id].results.map(r => (
                              <tr key={r.studentId} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2 text-slate-400 font-mono">{r.rollNumber ?? '—'}</td>
                                <td className="px-3 py-2 font-medium text-slate-700">{r.name}</td>
                                {r.marks.map(m => (
                                  <td key={m.subject} className="px-3 py-2 text-center text-slate-600">{m.obtained}</td>
                                ))}
                                <td className="px-3 py-2 text-center font-semibold text-slate-700">{r.totalObtained}/{r.totalMax}</td>
                                <td className="px-3 py-2 text-center text-slate-600">{r.percentage}%</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${GRADES[r.grade] ?? 'bg-slate-100 text-slate-500'}`}>{r.grade}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Create Exam</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Exam Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Unit Test 1, Annual Exam"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Type *</label>
                  <select value={form.type} onChange={e => changeType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    <option value="unit_test">Unit Test</option>
                    <option value="annual">Annual Exam</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Class *</label>
                  <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}{cls.section ? ` — ${cls.section}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Exam Date (optional)</label>
                <input type="date" value={form.examDate} min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

              {/* Subjects — layout differs by exam type */}
              {form.type === 'unit_test' ? (
                <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl">
                  <p className="text-xs font-semibold text-violet-700 mb-2.5">Subject &amp; Marks</p>
                  <div className="flex gap-2 items-center">
                    {subjects.length > 0 ? (
                      <select
                        value={form.subjects[0].name}
                        onChange={e => updateSubject(0, 'name', e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                      >
                        <option value="">— Select subject —</option>
                        {subjects.map(sub => (
                          <option key={sub._id} value={sub.name}>{sub.name}{sub.code ? ` (${sub.code})` : ''}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={form.subjects[0].name}
                        onChange={e => updateSubject(0, 'name', e.target.value)}
                        placeholder="Subject name *"
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    )}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number" min="1"
                        value={form.subjects[0].maxMarks}
                        onChange={e => updateSubject(0, 'maxMarks', e.target.value)}
                        className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-center"
                      />
                      <span className="text-xs text-slate-400 whitespace-nowrap">max marks</span>
                    </div>
                  </div>
                </div>
              ) : (
                <AnnualSubjects
                  formSubjects={form.subjects}
                  subjectList={subjects}
                  onAdd={addSubjectRow}
                  onRemove={removeSubjectRow}
                  onUpdate={updateSubject}
                />
              )}

              {formErr && <p className="text-xs text-red-600">{formErr}</p>}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {isPending ? 'Creating…' : 'Create Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {editingExam && (
        <EditExamModal
          exam={editingExam}
          subjects={subjects}
          onClose={() => setEditingExam(null)}
          onSaved={refreshExams}
        />
      )}

      {/* Marks Entry Modal */}
      {marksExam && (
        <MarksEntryModal
          exam={marksExam}
          onClose={() => setMarksExam(null)}
          onSaved={() => {
            setExams(ex => ex.map(e => e.id === marksExam.id ? { ...e, marksEntered: true } : e))
            setResults(r => { const n = { ...r }; delete n[marksExam.id]; return n })
          }}
        />
      )}
    </div>
  )
}
