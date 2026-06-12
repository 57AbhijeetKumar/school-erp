'use client'

import { useActionState, useEffect, useState } from 'react'
import { addTeacher, toggleTeacherStatus, removeTeacher, updateTeacher } from '@/lib/actions/teacher'

const PAGE_SIZE = 10

export default function TeacherSection({ teachers, subjects = [] }) {
  const [showForm,   setShowForm]   = useState(false)
  const [formKey,    setFormKey]    = useState(0)
  const [deletingId, setDeletingId] = useState(null)
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(1)
  const [state, action, pending]    = useActionState(addTeacher, null)

  // Edit state
  const [editingId,  setEditingId]  = useState(null)
  const [editData,   setEditData]   = useState({})
  const [editError,  setEditError]  = useState('')
  const [editSaving, setEditSaving] = useState(false)

  function startEdit(t) {
    setEditingId(t._id)
    setEditData({ name: t.name, mobile: t.mobile, subject: t.subject || '', email: t.email || '' })
    setEditError('')
  }

  function cancelEdit() { setEditingId(null); setEditError('') }

  async function saveEdit() {
    setEditSaving(true)
    setEditError('')
    const res = await updateTeacher(editingId, editData)
    setEditSaving(false)
    if (res?.error) { setEditError(res.error); return }
    setEditingId(null)
  }

  const filtered = teachers.filter(t => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return t.name?.toLowerCase().includes(q) ||
           t.mobile?.includes(q) ||
           t.subject?.toLowerCase().includes(q) ||
           t.email?.toLowerCase().includes(q)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    if (state?.success) {
      setShowForm(false)
      setFormKey(k => k + 1)
      setPage(1)
    }
  }, [state?.success])

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">👩‍🏫</span>
          <h2 className="font-semibold text-slate-800">Teachers</h2>
          <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
            {teachers.length}
          </span>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setFormKey(k => k + 1) }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? 'Cancel' : 'Add Teacher'}
        </button>
      </div>

      {/* Search */}
      {teachers.length > 0 && (
        <div className="px-6 py-3 border-b border-slate-100">
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, mobile, subject or email…"
            className="w-full sm:w-72 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      )}

      {/* Add Teacher Form */}
      {showForm && (
        <form key={formKey} action={action} className="px-6 py-5 bg-emerald-50 border-b border-emerald-100">
          <p className="text-sm font-semibold text-slate-700 mb-4">New Teacher Details</p>

          {state?.error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                maxLength={100}
                placeholder="Ramesh Kumar"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                name="mobile"
                required
                placeholder="9999999999"
                maxLength={10}
                pattern="[6-9]\d{9}"
                title="10-digit mobile starting with 6, 7, 8 or 9"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject <span className="text-slate-400">(optional)</span></label>
              {subjects.length > 0 ? (
                <select
                  name="subject"
                  defaultValue=""
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">— None —</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s.name}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-400 bg-slate-50">
                  No subjects yet — add them in the Subjects section
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email <span className="text-slate-400">(optional)</span>
            </label>
            <input
              name="email"
              type="email"
              maxLength={200}
              placeholder="teacher@school.com"
              className="w-full sm:w-72 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-slate-500">
              🔑 Default login password: <span className="font-semibold text-slate-700">123456</span>
              &nbsp;— share this with the teacher
            </p>
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-colors"
            >
              {pending ? 'Adding…' : 'Add Teacher'}
            </button>
          </div>
        </form>
      )}

      {/* Teacher Table */}
      {teachers.length === 0 ? (
        <div className="py-12 text-center">
          <span className="text-3xl block mb-2">👩‍🏫</span>
          <p className="text-slate-500 text-sm">No teachers added yet</p>
          <p className="text-slate-400 text-xs mt-1">Click &ldquo;Add Teacher&rdquo; to get started</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-slate-500 text-sm">No teachers match &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mobile (Login ID)</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Email</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((t, i) => (
                editingId === t._id ? (
                  /* ── Inline edit row ── */
                  <tr key={t._id} className="bg-emerald-50">
                    <td className="px-6 py-3 text-slate-400">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-3 py-2">
                      <input
                        value={editData.name}
                        onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                        maxLength={100}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={editData.mobile}
                        onChange={e => setEditData(d => ({ ...d, mobile: e.target.value }))}
                        maxLength={10}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {subjects.length > 0 ? (
                        <select
                          value={editData.subject}
                          onChange={e => setEditData(d => ({ ...d, subject: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="">— None —</option>
                          {subjects.map(s => (
                            <option key={s._id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={editData.subject}
                          onChange={e => setEditData(d => ({ ...d, subject: e.target.value }))}
                          placeholder="Subject"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell">
                      <input
                        value={editData.email}
                        onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                        type="email"
                        placeholder="Email (optional)"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {editError && <p className="text-xs text-red-600">{editError}</p>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={saveEdit}
                          disabled={editSaving}
                          className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors"
                        >
                          {editSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 text-slate-400">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-6 py-3 font-medium text-slate-800">{t.name}</td>
                  <td className="px-6 py-3">
                    <span className="font-mono text-slate-700">{t.mobile}</span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{t.subject || <span className="text-slate-400">—</span>}</td>
                  <td className="px-6 py-3 text-slate-500 text-xs hidden md:table-cell">{t.email || <span className="text-slate-300">—</span>}</td>
                  <td className="px-6 py-3">
                    {t.isActive !== false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Edit */}
                      <button onClick={() => startEdit(t)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        Edit
                      </button>

                      {/* Deactivate / Reactivate */}
                      <form action={toggleTeacherStatus}>
                        <input type="hidden" name="teacherId" value={t._id} />
                        <button type="submit"
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                            t.isActive !== false
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}>
                          {t.isActive !== false ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </form>

                      {/* Delete */}
                      {deletingId === t._id ? (
                        <div className="flex items-center gap-1">
                          <form action={removeTeacher}>
                            <input type="hidden" name="teacherId" value={t._id} />
                            <button type="submit"
                              className="px-3 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                              Confirm
                            </button>
                          </form>
                          <button onClick={() => setDeletingId(null)}
                            className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingId(t._id)}
                          className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {filtered.length} teacher{filtered.length !== 1 ? 's' : ''} · page {safePage} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  )
}
