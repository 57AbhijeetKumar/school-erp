'use client'

import { useActionState, useEffect, useState } from 'react'
import { addSubject, updateSubject, removeSubject } from '@/lib/actions/subject'

export default function SubjectSection({ subjects }) {
  const [showForm,   setShowForm]   = useState(false)
  const [formKey,    setFormKey]    = useState(0)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId,  setEditingId]  = useState(null)
  const [editName,   setEditName]   = useState('')
  const [editCode,   setEditCode]   = useState('')
  const [editErr,    setEditErr]    = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [state, action, pending]    = useActionState(addSubject, null)

  function startEdit(s) {
    setEditingId(s._id)
    setEditName(s.name)
    setEditCode(s.code || '')
    setEditErr('')
  }

  async function saveEdit(id) {
    if (!editName.trim()) { setEditErr('Name is required'); return }
    setEditSaving(true)
    const res = await updateSubject(id, { name: editName, code: editCode })
    setEditSaving(false)
    if (res?.error) { setEditErr(res.error); return }
    setEditingId(null)
  }

  useEffect(() => {
    if (state?.success) {
      setShowForm(false)
      setFormKey(k => k + 1)
    }
  }, [state?.success])

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📖</span>
          <h2 className="font-semibold text-slate-800">Subjects</h2>
          <span className="px-2 py-0.5 text-xs font-semibold bg-violet-100 text-violet-700 rounded-full">
            {subjects.length}
          </span>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setFormKey(k => k + 1) }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? 'Cancel' : 'Add Subject'}
        </button>
      </div>

      {/* Add Subject Form */}
      {showForm && (
        <form key={formKey} action={action} className="px-6 py-5 bg-violet-50 border-b border-violet-100">
          <p className="text-sm font-semibold text-slate-700 mb-4">New Subject</p>

          {state?.error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="e.g. Mathematics, Science, English"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Short Code <span className="text-slate-400">(optional)</span>
              </label>
              <input
                name="code"
                placeholder="e.g. MATH, SCI"
                maxLength={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 rounded-lg transition-colors"
            >
              {pending ? 'Adding…' : 'Add Subject'}
            </button>
          </div>
        </form>
      )}

      {/* Subject List */}
      {subjects.length === 0 ? (
        <div className="py-12 text-center">
          <span className="text-4xl block mb-3">📖</span>
          <p className="text-slate-600 font-medium text-sm">No subjects added yet</p>
          <p className="text-slate-400 text-xs mt-1">
            Add subjects here — then assign them to teachers and use them in timetables &amp; exams
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {subjects.map((s, i) => (
            <div key={s._id} className="px-6 py-3 hover:bg-slate-50 transition-colors">
              {editingId === s._id ? (
                /* ── Inline edit row ── */
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-6 text-xs text-slate-400 text-right shrink-0">{i + 1}</span>
                  <input
                    value={editName}
                    onChange={e => { setEditName(e.target.value); setEditErr('') }}
                    className="flex-1 min-w-0 px-2 py-1 border border-violet-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    placeholder="Subject name"
                    autoFocus
                  />
                  <input
                    value={editCode}
                    onChange={e => setEditCode(e.target.value)}
                    maxLength={8}
                    className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
                    placeholder="Code"
                  />
                  <button
                    onClick={() => saveEdit(s._id)}
                    disabled={editSaving}
                    className="px-3 py-1 text-xs font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {editSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  {editErr && <p className="w-full text-xs text-red-600 pl-8">{editErr}</p>}
                </div>
              ) : (
                /* ── Normal row ── */
                <div className="flex items-center gap-3">
                  <span className="w-6 text-xs text-slate-400 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="font-medium text-slate-800 text-sm">{s.name}</span>
                    {s.code && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-violet-50 text-violet-600 rounded-md">
                        {s.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(s)}
                      className="px-3 py-1 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    {deletingId === s._id ? (
                      <>
                        <form action={removeSubject}>
                          <input type="hidden" name="subjectId" value={s._id} />
                          <button type="submit" className="px-3 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                            Confirm
                          </button>
                        </form>
                        <button onClick={() => setDeletingId(null)} className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setDeletingId(s._id)} className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
