'use client'

import { useState, useTransition } from 'react'
import { fetchClassHomework, fetchHomeworkSubmissions, adminDeleteHomework } from '@/lib/actions/homework'

const STATUS = {
  submitted:     { label: 'Submitted',     cls: 'bg-emerald-50 text-emerald-700' },
  not_submitted: { label: 'Not Submitted', cls: 'bg-amber-50 text-amber-700'     },
  late:          { label: 'Late',          cls: 'bg-red-50 text-red-700'          },
}

// Per-homework row that can expand to show submission table
function HomeworkRow({ hw, onDelete }) {
  const [open,        setOpen]        = useState(false)
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [deleting,    setDeleting]    = useState(false)

  async function toggle() {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (data) return
    setLoading(true)
    const result = await fetchHomeworkSubmissions(hw.id)
    setData(result)
    setLoading(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await adminDeleteHomework(hw.id)
    onDelete(hw.id)
  }

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 hover:bg-slate-50/50 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 cursor-pointer" onClick={toggle}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-slate-800 text-sm">{hw.title}</span>
              {hw.subject && <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">{hw.subject}</span>}
            </div>
            <p className="text-xs text-slate-500 mb-1 leading-relaxed">{hw.description}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>👤 {hw.assignedBy.name}</span>
              {hw.dueDate && <span className="text-emerald-600 font-medium">📅 Due: {hw.dueDate}</span>}
              {data?.summary && (
                <span>✅ {data.summary.submitted} · ⏳ {data.summary.notSubmitted} · 🔴 {data.summary.late}</span>
              )}
            </div>
            {hw.attachments?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {hw.attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-600 transition-colors"
                  >
                    <span>{att.type === 'pdf' ? '📄' : '🖼️'}</span>
                    <span className="max-w-[140px] truncate">{att.name}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {confirmDel ? (
              <>
                <button onClick={handleDelete} disabled={deleting}
                  className="px-3 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                  {deleting ? 'Deleting…' : 'Confirm'}
                </button>
                <button onClick={() => setConfirmDel(false)}
                  className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setConfirmDel(true)}
                  className="px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  Delete
                </button>
                <span className="text-xs text-slate-400 hover:text-emerald-600 font-medium cursor-pointer" onClick={toggle}>
                  {open ? '▲ Hide' : '▼ Submissions'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Submission table */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
          {loading && <p className="text-xs text-slate-400 text-center py-4">Loading…</p>}
          {!loading && !data && <p className="text-xs text-red-500 text-center py-4">Failed to load submissions.</p>}
          {!loading && data && (
            <>
              {/* Summary pills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { label: `Total: ${data.summary.total}`,           cls: 'bg-slate-200 text-slate-600' },
                  { label: `Submitted: ${data.summary.submitted}`,   cls: 'bg-emerald-100 text-emerald-700' },
                  { label: `Pending: ${data.summary.notSubmitted}`,  cls: 'bg-amber-100 text-amber-700' },
                  { label: `Late: ${data.summary.late}`,             cls: 'bg-red-100 text-red-700' },
                ].map(p => (
                  <span key={p.label} className={`px-2 py-1 rounded-full text-xs font-medium ${p.cls}`}>{p.label}</span>
                ))}
              </div>

              {data.students.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No students in this class.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 uppercase tracking-wide">
                        <th className="px-3 py-2 text-left font-semibold">Roll</th>
                        <th className="px-3 py-2 text-left font-semibold">Name</th>
                        <th className="px-3 py-2 text-left font-semibold">Status</th>
                        <th className="px-3 py-2 text-left font-semibold">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.students.map(s => {
                        const st = STATUS[s.status] ?? { label: s.status, cls: 'bg-slate-100 text-slate-600' }
                        return (
                          <tr key={s.studentId} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-500 font-mono">{s.rollNumber ?? '—'}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
                            </td>
                            <td className="px-3 py-2 text-slate-500">{s.remark || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function HomeworkSection({ classes }) {
  const [classId,   setClassId]   = useState(classes[0]?._id ?? '')
  const [homework,  setHomework]  = useState(null)
  const [isPending, startTransition] = useTransition()

  function load() {
    if (!classId) return
    startTransition(async () => {
      const data = await fetchClassHomework(classId)
      setHomework(data)
    })
  }

  const selectedClass = classes.find(c => c._id === classId)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-base">📚</div>
        <h2 className="text-base font-bold text-slate-800">Homework</h2>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={classId}
          onChange={e => { setClassId(e.target.value); setHomework(null) }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {classes.map(cls => (
            <option key={cls._id} value={cls._id}>{cls.name}{cls.section ? ` — ${cls.section}` : ''}</option>
          ))}
        </select>
        <button
          onClick={load} disabled={isPending || !classId}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {isPending ? 'Loading…' : 'View'}
        </button>
      </div>

      {!homework && !isPending && <p className="text-sm text-slate-400 text-center py-8">Select a class and click View</p>}
      {isPending && <p className="text-sm text-slate-400 text-center py-8">Loading homework…</p>}

      {homework && !isPending && (
        <>
          <p className="text-xs text-slate-500 mb-3">
            {selectedClass?.name}{selectedClass?.section ? ` — ${selectedClass.section}` : ''} ·{' '}
            <span className="font-medium">{homework.length} assignment{homework.length !== 1 ? 's' : ''}</span>
          </p>
          {homework.length === 0
            ? <p className="text-sm text-slate-400 text-center py-6">No homework assigned yet.</p>
            : <div className="space-y-3">{homework.map(hw => (
                <HomeworkRow
                  key={hw.id}
                  hw={hw}
                  onDelete={id => setHomework(prev => prev.filter(h => h.id !== id))}
                />
              ))}</div>
          }
        </>
      )}
    </div>
  )
}
