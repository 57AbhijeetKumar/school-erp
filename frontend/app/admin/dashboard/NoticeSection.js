'use client'

import { useState, useEffect, useActionState, useTransition } from 'react'
import { fetchNotices, createNotice, updateNotice, deleteNotice } from '@/lib/actions/notice'

const AUDIENCES = [
  { value: 'all',      label: 'Everyone' },
  { value: 'teachers', label: 'Teachers only' },
  { value: 'parents',  label: 'Parents only' },
]

function AudienceBadge({ audience }) {
  const map = { all: 'bg-blue-50 text-blue-700', teachers: 'bg-violet-50 text-violet-700', parents: 'bg-amber-50 text-amber-700' }
  const label = { all: 'Everyone', teachers: 'Teachers', parents: 'Parents' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[audience] || 'bg-slate-100 text-slate-600'}`}>
      {label[audience] || audience}
    </span>
  )
}

export default function NoticeSection() {
  const [notices,    setNotices]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [content,    setContent]    = useState('')
  const [deleting,   setDeleting]   = useState(null)
  const [editingId,  setEditingId]  = useState(null)
  const [editData,   setEditData]   = useState({ title: '', content: '', targetAudience: 'all', expiryDate: '' })
  const [editErr,    setEditErr]    = useState('')
  const [isPending,  startTransition] = useTransition()

  const [state, formAction, isSubmitting] = useActionState(createNotice, null)

  function startEdit(n) {
    setEditingId(n._id)
    setEditData({ title: n.title, content: n.content, targetAudience: n.targetAudience, expiryDate: n.expiryDate || '' })
    setEditErr('')
  }

  function handleSaveEdit(id) {
    if (!editData.title.trim() || !editData.content.trim()) { setEditErr('Title and content are required'); return }
    startTransition(async () => {
      const res = await updateNotice(id, editData)
      if (res?.error) { setEditErr(res.error); return }
      setEditingId(null)
      fetchNotices().then(setNotices)
    })
  }

  useEffect(() => {
    fetchNotices().then(data => { setNotices(data); setLoading(false) })
  }, [])

  useEffect(() => {
    if (state?.success) {
      setShowForm(false)
      setContent('')
      fetchNotices().then(setNotices)
    }
  }, [state?.ts])

  function handleDelete(id) {
    setDeleting(id)
    startTransition(async () => {
      await deleteNotice(id)
      await fetchNotices().then(setNotices)
      setDeleting(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Notice Board</h2>
          <p className="text-sm text-slate-500 mt-0.5">Publish announcements to teachers and parents</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); if (showForm) setContent('') }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <span className="text-base">+</span> New Notice
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Create Notice</h3>
          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                name="title" required
                maxLength={200}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Notice title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
              <textarea
                name="content" required rows={4}
                maxLength={5000}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Write your notice here..."
              />
              <p className="text-xs text-slate-400 text-right mt-0.5">{content.length} / 5000</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Audience</label>
                <select
                  name="targetAudience"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="date" name="expiryDate"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
            <div className="flex gap-3">
              <button
                type="submit" disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Publishing…' : 'Publish Notice'}
              </button>
              <button
                type="button" onClick={() => { setShowForm(false); setContent('') }}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-400 text-sm">Loading notices…</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <span className="text-5xl mb-4">📢</span>
          <p className="text-slate-600 font-medium">No notices yet</p>
          <p className="text-slate-400 text-sm mt-1">Click &ldquo;New Notice&rdquo; to publish an announcement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n._id} className="bg-white border border-slate-200 rounded-xl p-5">
              {editingId === n._id ? (
                /* ── Inline edit ── */
                <div className="space-y-3">
                  <input
                    value={editData.title}
                    onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Title"
                  />
                  <textarea
                    value={editData.content}
                    onChange={e => setEditData(d => ({ ...d, content: e.target.value }))}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Content"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={editData.targetAudience}
                      onChange={e => setEditData(d => ({ ...d, targetAudience: e.target.value }))}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                    <div>
                      <label className="text-xs text-slate-500 mb-0.5 block">Expiry Date (optional)</label>
                      <input
                        type="date"
                        value={editData.expiryDate}
                        onChange={e => setEditData(d => ({ ...d, expiryDate: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  {editErr && <p className="text-xs text-red-600">{editErr}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(n._id)}
                      disabled={isPending}
                      className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {isPending ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Normal view ── */
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-800">{n.title}</h3>
                      <AudienceBadge audience={n.targetAudience} />
                    </div>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{n.content}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {n.createdByName && (
                        <span className="ml-2">· by <span className="font-medium">{n.createdByName}</span></span>
                      )}
                      {n.expiryDate && (
                        <span className="ml-2 text-amber-500">· Expires: <span className="font-medium">{n.expiryDate}</span></span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(n)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Edit notice"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(n._id)}
                      disabled={deleting === n._id || isPending}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Delete notice"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
