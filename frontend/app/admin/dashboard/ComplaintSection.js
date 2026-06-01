'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  fetchComplaints,
  acknowledgeComplaint,
  resolveComplaint,
  deleteComplaint,
} from '@/lib/actions/adminComplaint'

const ROLE_BADGE = {
  teacher: 'bg-blue-100 text-blue-700',
  admin:   'bg-violet-100 text-violet-700',
  parent:  'bg-amber-100 text-amber-700',
}

const SEVERITY_BADGE = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100 text-red-700',
}

const STATUS_BADGE = {
  open:         'bg-amber-100 text-amber-700',
  acknowledged: 'bg-blue-100 text-blue-700',
  resolved:     'bg-emerald-100 text-emerald-700',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatCategory(cat) {
  if (!cat) return '—'
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function ComplaintCard({ complaint, onAcknowledge, onResolve, onDelete, isPending }) {
  const [resolveMode, setResolveMode] = useState(false)
  const [resolveNote, setResolveNote] = useState('')

  const student = complaint.student || {}
  const canShowResolve = complaint.status === 'open' || complaint.status === 'acknowledged'

  function handleResolveConfirm() {
    onResolve(complaint._id, resolveNote)
    setResolveMode(false)
    setResolveNote('')
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      {/* Top row: student info + badges */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-slate-800">
              {student.name || '—'}
            </span>
            {student.rollNumber && (
              <span className="text-xs text-slate-500">Roll #{student.rollNumber}</span>
            )}
            {complaint.class && (
              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                {complaint.class.section
                  ? `${complaint.class.name} — ${complaint.class.section}`
                  : complaint.class.name}
              </span>
            )}
            {/* Severity badge */}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${SEVERITY_BADGE[complaint.severity] || 'bg-slate-100 text-slate-600'}`}>
              {complaint.severity || 'unknown'}
            </span>
            {/* Status badge */}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[complaint.status] || 'bg-slate-100 text-slate-600'}`}>
              {complaint.status || 'unknown'}
            </span>
          </div>

          {/* Raised by + category */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs text-slate-500">
              Raised by <span className="font-medium text-slate-700">{complaint.raisedByName || '—'}</span>
            </span>
            {complaint.raisedByRole && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[complaint.raisedByRole] || 'bg-slate-100 text-slate-600'}`}>
                {complaint.raisedByRole}
              </span>
            )}
            {complaint.category && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {formatCategory(complaint.category)}
              </span>
            )}
          </div>

          {/* Title + description */}
          <p className="text-sm font-semibold text-slate-800">{complaint.title || '—'}</p>
          {complaint.description && (
            <p className="text-sm text-slate-500 mt-0.5">{complaint.description}</p>
          )}

          {/* Resolved note */}
          {complaint.status === 'resolved' && complaint.resolvedNote && (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1 mt-1">
              Resolution: {complaint.resolvedNote}
            </p>
          )}

          {/* Date */}
          <p className="text-xs text-slate-400 mt-1">{formatDate(complaint.createdAt)}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 items-end shrink-0">
          {/* Resolve inline form */}
          {resolveMode ? (
            <div className="flex flex-col gap-2 w-56">
              <textarea
                value={resolveNote}
                onChange={e => setResolveNote(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Resolution note (optional)"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setResolveMode(false); setResolveNote('') }}
                  className="px-2 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveConfirm}
                  disabled={isPending}
                  className="px-2 py-1 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap justify-end">
              {complaint.status === 'open' && (
                <button
                  onClick={() => onAcknowledge(complaint._id)}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  Acknowledge
                </button>
              )}
              {canShowResolve && (
                <button
                  onClick={() => setResolveMode(true)}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Resolve
                </button>
              )}
              {complaint.canDelete && (
                <button
                  onClick={() => onDelete(complaint._id)}
                  disabled={isPending}
                  className="px-2 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ComplaintSection() {
  const [complaints,   setComplaints]   = useState([])
  const [status,       setStatus]       = useState('')
  const [severity,     setSeverity]     = useState('')
  const [raisedByRole, setRaisedByRole] = useState('')
  const [isPending,    startTransition] = useTransition()

  useEffect(() => {
    fetchComplaints(
      status      || undefined,
      severity    || undefined,
      raisedByRole || undefined,
    ).then(setComplaints)
  }, [status, severity, raisedByRole])

  function reload() {
    fetchComplaints(
      status      || undefined,
      severity    || undefined,
      raisedByRole || undefined,
    ).then(setComplaints)
  }

  function handleAcknowledge(id) {
    startTransition(async () => {
      await acknowledgeComplaint(id)
      reload()
    })
  }

  function handleResolve(id, note) {
    startTransition(async () => {
      await resolveComplaint(id, note)
      reload()
    })
  }

  function handleDelete(id) {
    startTransition(async () => {
      await deleteComplaint(id)
      reload()
    })
  }

  const countOpen         = complaints.filter(c => c.status === 'open').length
  const countAcknowledged = complaints.filter(c => c.status === 'acknowledged').length
  const countResolved     = complaints.filter(c => c.status === 'resolved').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Complaints</h2>
          <p className="text-sm text-slate-500 mt-0.5">Acknowledge and resolve complaints raised by staff and parents</p>
        </div>
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={severity}
            onChange={e => setSeverity(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={raisedByRole}
            onChange={e => setRaisedByRole(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All roles</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
          {countOpen} Open
        </span>
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
          {countAcknowledged} Acknowledged
        </span>
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
          {countResolved} Resolved
        </span>
      </div>

      {/* List */}
      {complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <span className="text-5xl mb-4">⚠️</span>
          <p className="text-slate-600 font-medium">No complaints found</p>
          <p className="text-slate-400 text-sm mt-1">
            {status || severity || raisedByRole
              ? 'Try adjusting the filters.'
              : 'No complaints have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <ComplaintCard
              key={c._id}
              complaint={c}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
