'use client'

import { useState, useTransition } from 'react'
import { fetchClassHomework, fetchHomeworkSubmissions, adminDeleteHomework, adminCreateHomework } from '@/lib/actions/homework'

const STATUS = {
  submitted:     { label: 'Submitted',     cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  not_submitted: { label: 'Not Submitted', cls: 'bg-amber-50 text-amber-700 border border-amber-200'       },
  late:          { label: 'Late',          cls: 'bg-red-50 text-red-700 border border-red-200'              },
}

function MetaLabel({ children }) {
  return <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{children}</span>
}

function MetaValue({ children, className = '' }) {
  return <span className={`text-xs font-medium text-slate-700 ${className}`}>{children}</span>
}

function HomeworkRow({ hw, onDelete }) {
  const [open,       setOpen]       = useState(false)
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

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
    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">

      {/* Card body */}
      <div className="flex">
        {/* Left accent bar */}
        <div className="w-1 shrink-0 bg-emerald-500 rounded-l-xl" />

        <div className="flex-1 p-4">
          {/* Top row: title + actions */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="cursor-pointer flex-1 min-w-0" onClick={toggle}>
              <p className="text-sm font-bold text-slate-800 leading-snug">{hw.title}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Title</p>
            </div>

            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              {confirmDel ? (
                <>
                  <button onClick={handleDelete} disabled={deleting}
                    className="px-3 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                    {deleting ? 'Deleting…' : 'Confirm delete'}
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
                  <button onClick={toggle}
                    className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200">
                    {open ? '▲ Hide' : '▼ Submissions'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-3 cursor-pointer" onClick={toggle}>
            <MetaLabel>Description</MetaLabel>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {hw.description || <span className="text-slate-400 italic">No description provided</span>}
            </p>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mb-3 cursor-pointer" onClick={toggle}>
            <div>
              <MetaLabel>Assigned By</MetaLabel>
              <div className="mt-0.5">
                <MetaValue>{hw.assignedBy.name}</MetaValue>
              </div>
            </div>

            <div>
              <MetaLabel>Subject</MetaLabel>
              <div className="mt-0.5">
                {hw.subject
                  ? <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">{hw.subject}</span>
                  : <MetaValue className="text-slate-400 italic">Not specified</MetaValue>
                }
              </div>
            </div>

            <div>
              <MetaLabel>Due Date</MetaLabel>
              <div className="mt-0.5">
                {hw.dueDate
                  ? <MetaValue className="text-amber-600">{hw.dueDate}</MetaValue>
                  : <MetaValue className="text-slate-400 italic">No due date</MetaValue>
                }
              </div>
            </div>
          </div>

          {/* Submission quick summary (shown after first load) */}
          {data?.summary && (
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { label: 'Total',         val: data.summary.total,        cls: 'bg-slate-100 text-slate-600 border-slate-200' },
                { label: 'Submitted',     val: data.summary.submitted,    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { label: 'Not Submitted', val: data.summary.notSubmitted, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                { label: 'Late',          val: data.summary.late,         cls: 'bg-red-50 text-red-700 border-red-200' },
              ].map(p => (
                <span key={p.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${p.cls}`}>
                  <span className="font-bold">{p.val}</span>
                  <span className="font-normal opacity-75">{p.label}</span>
                </span>
              ))}
            </div>
          )}

          {/* Attachments */}
          {hw.attachments?.length > 0 && (
            <div>
              <MetaLabel>Attachments ({hw.attachments.length})</MetaLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {hw.attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-lg text-slate-600 transition-colors"
                  >
                    <span>{att.type === 'pdf' ? '📄' : '🖼️'}</span>
                    <span className="max-w-[140px] truncate">{att.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submission table (expanded) */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4">
          {loading && <p className="text-xs text-slate-400 text-center py-4">Loading submissions…</p>}
          {!loading && !data && <p className="text-xs text-red-500 text-center py-4">Failed to load submissions.</p>}
          {!loading && data && (
            <>
              {/* Summary pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: `Total: ${data.summary.total}`,           cls: 'bg-slate-200 text-slate-600' },
                  { label: `Submitted: ${data.summary.submitted}`,   cls: 'bg-emerald-100 text-emerald-700' },
                  { label: `Not Submitted: ${data.summary.notSubmitted}`, cls: 'bg-amber-100 text-amber-700' },
                  { label: `Late: ${data.summary.late}`,             cls: 'bg-red-100 text-red-700' },
                ].map(p => (
                  <span key={p.label} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.cls}`}>{p.label}</span>
                ))}
              </div>

              {data.students.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No students in this class.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 uppercase tracking-wide text-[10px]">
                        <th className="px-3 py-2 text-left font-semibold">Roll No.</th>
                        <th className="px-3 py-2 text-left font-semibold">Student Name</th>
                        <th className="px-3 py-2 text-left font-semibold">Submission Status</th>
                        <th className="px-3 py-2 text-left font-semibold">Teacher Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.students.map(s => {
                        const st = STATUS[s.status] ?? { label: s.status, cls: 'bg-slate-100 text-slate-600' }
                        return (
                          <tr key={s.studentId} className="hover:bg-slate-50">
                            <td className="px-3 py-2.5 text-slate-500 font-mono">{s.rollNumber ?? '—'}</td>
                            <td className="px-3 py-2.5 font-semibold text-slate-800">{s.name}</td>
                            <td className="px-3 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-500">{s.remark || <span className="italic text-slate-300">—</span>}</td>
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

const EMPTY_HW = { title: '', description: '', subject: '', dueDate: '' }

export default function HomeworkSection({ classes }) {
  const [classId,   setClassId]   = useState(classes[0]?._id ?? '')
  const [homework,  setHomework]  = useState(null)
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [newHw,      setNewHw]      = useState(EMPTY_HW)
  const [createErr,  setCreateErr]  = useState('')
  const [creating,   setCreating]   = useState(false)

  function load() {
    if (!classId) return
    startTransition(async () => {
      const data = await fetchClassHomework(classId)
      setHomework(data)
    })
  }

  async function handleCreate() {
    if (!newHw.title.trim() || !newHw.description.trim()) {
      setCreateErr('Title and description are required')
      return
    }
    setCreating(true)
    setCreateErr('')
    const result = await adminCreateHomework({ classId, ...newHw })
    setCreating(false)
    if (result?.error) {
      setCreateErr(result.error)
    } else {
      setShowCreate(false)
      setNewHw(EMPTY_HW)
      const data = await fetchClassHomework(classId)
      setHomework(Array.isArray(data) ? data : [])
    }
  }

  const selectedClass = classes.find(c => c._id === classId)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-base">📚</div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Homework</h2>
          <p className="text-[11px] text-slate-400">View assignments and submission status by class</p>
        </div>
      </div>

      {/* Class picker + actions */}
      <div className="flex flex-wrap gap-3 mb-5 items-end">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">Select Class</label>
          <select
            value={classId}
            onChange={e => { setClassId(e.target.value); setHomework(null); setShowCreate(false) }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          >
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>{cls.name}{cls.section ? ` — ${cls.section}` : ''}</option>
            ))}
          </select>
        </div>
        <button
          onClick={load} disabled={isPending || !classId}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {isPending ? 'Loading…' : 'View Homework'}
        </button>
        <button
          onClick={() => { setShowCreate(v => !v); setCreateErr('') }}
          disabled={!classId}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {showCreate ? 'Cancel' : '+ Create'}
        </button>
      </div>

      {/* Create Homework Form */}
      {showCreate && (
        <div className="mb-5 bg-indigo-50 border border-indigo-100 rounded-xl p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">New Homework Assignment</p>
          {createErr && <p className="text-red-600 text-sm mb-3">{createErr}</p>}
          <div className="space-y-3">
            <input
              type="text" maxLength={200} required
              value={newHw.title}
              onChange={e => setNewHw(h => ({ ...h, title: e.target.value }))}
              placeholder="Title *"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              rows={3} maxLength={2000} required
              value={newHw.description}
              onChange={e => setNewHw(h => ({ ...h, description: e.target.value }))}
              placeholder="Description / Instructions *"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text" maxLength={100}
                value={newHw.subject}
                onChange={e => setNewHw(h => ({ ...h, subject: e.target.value }))}
                placeholder="Subject (optional)"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="date"
                value={newHw.dueDate}
                onChange={e => setNewHw(h => ({ ...h, dueDate: e.target.value }))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-slate-500">Homework will be attributed to this class&rsquo;s class teacher.</p>
            <button
              type="button" onClick={handleCreate} disabled={creating}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {creating ? 'Creating…' : 'Create Homework'}
            </button>
          </div>
        </div>
      )}

      {!homework && !isPending && (
        <div className="text-center py-10">
          <p className="text-2xl mb-1">📋</p>
          <p className="text-sm text-slate-400">Select a class and click <span className="font-medium">View Homework</span></p>
        </div>
      )}
      {isPending && <p className="text-sm text-slate-400 text-center py-8">Loading homework…</p>}

      {homework && !isPending && (
        <>
          {/* Result header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">
              Showing homework for{' '}
              <span className="font-semibold text-slate-700">
                {selectedClass?.name}{selectedClass?.section ? ` — ${selectedClass.section}` : ''}
              </span>
            </p>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              {homework.length} assignment{homework.length !== 1 ? 's' : ''}
            </span>
          </div>

          {homework.length === 0
            ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-sm text-slate-400">No homework assigned to this class yet.</p>
              </div>
            )
            : (
              <div className="space-y-3">
                {homework.map(hw => (
                  <HomeworkRow
                    key={hw.id}
                    hw={hw}
                    onDelete={id => setHomework(prev => prev.filter(h => h.id !== id))}
                  />
                ))}
              </div>
            )
          }
        </>
      )}
    </div>
  )
}
