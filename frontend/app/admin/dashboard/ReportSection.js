'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  fetchRosterReport,
  fetchAttendanceReport,
  fetchExamsList,
  fetchExamResultsReport,
  fetchFeeReport,
  fetchReportCard,
} from '@/lib/actions/report'
import { fetchStudentsByClass } from '@/lib/actions/student'

/* ── CSV helper ─────────────────────────────────────────────────────────── */
function downloadCSV(filename, rows) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv    = rows.map(row => row.map(escape).join(',')).join('\n')
  const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/* ── Date helpers ───────────────────────────────────────────────────────── */
function today()        { return new Date().toISOString().split('T')[0] }
function monthAgo()     { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0] }
function currentMonth() { return today().slice(0, 7) }
function prevMonth()    { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7) }
function classLabel(c)  { return c ? `${c.name}${c.section ? ` — ${c.section}` : ''}` : '' }

/* ── Session options helper ─────────────────────────────────────────────── */
function getSessionOptions() {
  const now      = new Date()
  const year     = now.getFullYear()
  const baseYear = now.getMonth() >= 5 ? year : year - 1
  return [
    `${baseYear - 1}-${String(baseYear).slice(-2)}`,
    `${baseYear}-${String(baseYear + 1).slice(-2)}`,
    `${baseYear + 1}-${String(baseYear + 2).slice(-2)}`,
  ]
}

/* ── Print helper ───────────────────────────────────────────────────────── */
function printReportCard(data, schoolName) {
  const w = window.open('', '_blank', 'width=850,height=720')
  if (!w) return

  const cls      = data.student.class
  const clsLabel = cls.name + (cls.section ? ` (${cls.section})` : '')

  const gradeColor = g => {
    if (g === 'A+') return '#059669'
    if (g === 'A')  return '#16a34a'
    if (g === 'B')  return '#2563eb'
    if (g === 'C')  return '#d97706'
    if (g === 'D')  return '#ea580c'
    return '#dc2626'
  }

  const examsHtml = data.exams.length === 0
    ? '<p style="color:#94a3b8;text-align:center;padding:20px 0">No published exam results found for this session.</p>'
    : data.exams.map(e => `
        <div style="margin-bottom:20px;break-inside:avoid">
          <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f8fafc;border-left:4px solid #10b981;border-radius:0 6px 6px 0;margin-bottom:6px">
            <span style="font-weight:700;color:#1e293b;font-size:13px">${e.name}</span>
            <span style="font-size:11px;color:#64748b;background:#e2e8f0;padding:2px 7px;border-radius:99px">${e.type === 'unit_test' ? 'Unit Test' : 'Annual'}</span>
            ${e.examDate ? `<span style="font-size:11px;color:#64748b">${e.examDate}</span>` : ''}
            <span style="margin-left:auto;font-weight:800;font-size:15px;color:${gradeColor(e.grade)}">${e.grade}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="background:#f1f5f9">
                <th style="text-align:left;padding:5px 10px;border:1px solid #e2e8f0;color:#475569;font-weight:600">Subject</th>
                <th style="text-align:center;padding:5px 10px;border:1px solid #e2e8f0;color:#475569;font-weight:600">Marks</th>
                <th style="text-align:center;padding:5px 10px;border:1px solid #e2e8f0;color:#475569;font-weight:600">Max</th>
                <th style="text-align:center;padding:5px 10px;border:1px solid #e2e8f0;color:#475569;font-weight:600">%</th>
              </tr>
            </thead>
            <tbody>
              ${e.marks.map(m => `
                <tr>
                  <td style="padding:5px 10px;border:1px solid #e2e8f0;color:#334155">${m.subject}</td>
                  <td style="text-align:center;padding:5px 10px;border:1px solid #e2e8f0;color:#1e293b;font-weight:600">${m.obtained}</td>
                  <td style="text-align:center;padding:5px 10px;border:1px solid #e2e8f0;color:#64748b">${m.maxMarks}</td>
                  <td style="text-align:center;padding:5px 10px;border:1px solid #e2e8f0;color:#64748b">${m.maxMarks > 0 ? Math.round((m.obtained / m.maxMarks) * 100) : 0}%</td>
                </tr>
              `).join('')}
              <tr style="background:#f8fafc;font-weight:700">
                <td style="padding:5px 10px;border:1px solid #e2e8f0;color:#1e293b">Total</td>
                <td style="text-align:center;padding:5px 10px;border:1px solid #e2e8f0;color:#1e293b">${e.totalObtained}</td>
                <td style="text-align:center;padding:5px 10px;border:1px solid #e2e8f0;color:#1e293b">${e.totalMax}</td>
                <td style="text-align:center;padding:5px 10px;border:1px solid #e2e8f0;color:${gradeColor(e.grade)}">${e.percentage}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      `).join('')

  const att      = data.attendance
  const attColor = att.percentage >= 75 ? '#059669' : att.percentage >= 50 ? '#d97706' : '#dc2626'

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Report Card — ${data.student.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 28px; color: #1e293b; font-size: 13px; }
    @media print { body { padding: 16px; } .no-print { display: none !important; } }
  </style>
</head>
<body>

  <div class="no-print" style="text-align:right;margin-bottom:16px">
    <button onclick="window.print()" style="background:#10b981;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">Print</button>
  </div>

  <div style="text-align:center;border-bottom:2px solid #10b981;padding-bottom:14px;margin-bottom:18px">
    <h1 style="font-size:20px;font-weight:800;color:#1e293b">${schoolName || 'School'}</h1>
    <p style="font-size:12px;color:#64748b;margin-top:4px">Academic Report Card &mdash; Session ${data.academicYear}</p>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:20px">
    <div><div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Student Name</div><strong style="font-size:14px">${data.student.name}</strong></div>
    <div><div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Roll Number</div><strong>${data.student.rollNumber || '—'}</strong></div>
    <div><div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Class</div><strong>${clsLabel}</strong></div>
    <div><div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Date of Birth</div><strong>${data.student.dob || '—'}</strong></div>
    <div><div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Parent / Guardian</div><strong>${data.student.parentName || '—'}</strong></div>
    <div><div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Admission Session</div><strong>${data.student.admissionSession || '—'}</strong></div>
  </div>

  <h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#475569;margin-bottom:10px">Exam Results</h2>
  ${examsHtml}

  <div style="margin-top:6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;break-inside:avoid">
    <h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#475569;margin-bottom:12px">Attendance Summary</h2>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;text-align:center">
      <div><div style="font-size:20px;font-weight:800;color:#059669">${att.present}</div><div style="font-size:10px;color:#64748b;margin-top:2px">Present</div></div>
      <div><div style="font-size:20px;font-weight:800;color:#d97706">${att.late}</div><div style="font-size:10px;color:#64748b;margin-top:2px">Late</div></div>
      <div><div style="font-size:20px;font-weight:800;color:#dc2626">${att.absent}</div><div style="font-size:10px;color:#64748b;margin-top:2px">Absent</div></div>
      <div><div style="font-size:20px;font-weight:800;color:#475569">${att.totalDays}</div><div style="font-size:10px;color:#64748b;margin-top:2px">Total Days</div></div>
      <div><div style="font-size:20px;font-weight:800;color:${attColor}">${att.percentage}%</div><div style="font-size:10px;color:#64748b;margin-top:2px">Attendance</div></div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:48px">
    <div style="border-top:1px solid #cbd5e1;padding-top:6px;text-align:center;font-size:11px;color:#94a3b8">Class Teacher</div>
    <div style="border-top:1px solid #cbd5e1;padding-top:6px;text-align:center;font-size:11px;color:#94a3b8">Principal</div>
    <div style="border-top:1px solid #cbd5e1;padding-top:6px;text-align:center;font-size:11px;color:#94a3b8">Parent / Guardian</div>
  </div>

</body>
</html>`

  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 600)
}

/* ── Grade badge ────────────────────────────────────────────────────────── */
function GradeBadge({ grade }) {
  const cls =
    grade === 'A+' ? 'bg-emerald-100 text-emerald-700' :
    grade === 'A'  ? 'bg-green-100 text-green-700' :
    grade === 'B'  ? 'bg-blue-100 text-blue-700' :
    grade === 'C'  ? 'bg-yellow-100 text-yellow-700' :
    grade === 'D'  ? 'bg-orange-100 text-orange-700' :
                     'bg-red-100 text-red-700'
  return <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${cls}`}>{grade}</span>
}

/* ── Report type config ─────────────────────────────────────────────────── */
const TYPES = [
  { id: 'roster',     label: 'Student Roster',  icon: '👥', desc: 'Full student list with parent details' },
  { id: 'attendance', label: 'Attendance',       icon: '📋', desc: 'Per-student attendance summary for a date range' },
  { id: 'exam',       label: 'Exam Results',     icon: '📝', desc: 'Class-wide marks and grades for any exam' },
  { id: 'fees',       label: 'Fee Collection',   icon: '💰', desc: 'Month-by-month fee status for a class' },
  { id: 'reportcard', label: 'Report Card',      icon: '📄', desc: 'Per-student printable report card for a session' },
]

/* ══════════════════════════════════════════════════════════════════════════ */
export default function ReportSection({ classes, school }) {
  const [reportType, setReportType] = useState('roster')
  const [classId,    setClassId]    = useState(classes[0]?._id ? String(classes[0]._id) : '')

  // Attendance filters
  const [attFrom, setAttFrom] = useState(monthAgo())
  const [attTo,   setAttTo]   = useState(today())

  // Exam filters
  const [exams,  setExams]  = useState([])
  const [examId, setExamId] = useState('')

  // Fee filters
  const [feeFrom, setFeeFrom] = useState(prevMonth())
  const [feeTo,   setFeeTo]   = useState(currentMonth())

  // Report card filters
  const sessionOptions = getSessionOptions()
  const [rcStudents,     setRcStudents]     = useState([])
  const [rcStudentId,    setRcStudentId]    = useState('')
  const [rcAcademicYear, setRcAcademicYear] = useState(sessionOptions[1])

  // Report data
  const [data,      setData]      = useState(null)
  const [error,     setError]     = useState('')
  const [isPending, startTransition] = useTransition()

  // When class changes on exam tab, reload exam list
  useEffect(() => {
    if (reportType !== 'exam' || !classId) return
    setExams([]); setExamId(''); setData(null)
    fetchExamsList(classId).then(list => {
      const arr = Array.isArray(list) ? list : []
      setExams(arr)
      if (arr.length > 0) setExamId(String(arr[0].id))
    })
  }, [reportType, classId])

  // When class changes on report card tab, load students
  useEffect(() => {
    if (reportType !== 'reportcard' || !classId) return
    setRcStudents([]); setRcStudentId(''); setData(null)
    fetchStudentsByClass(classId).then(list => {
      const arr = Array.isArray(list) ? list : []
      setRcStudents(arr)
      if (arr.length > 0) setRcStudentId(String(arr[0]._id))
    })
  }, [reportType, classId])

  // Reset data when any filter changes
  useEffect(() => {
    setData(null); setError('')
  }, [reportType, classId, attFrom, attTo, examId, feeFrom, feeTo, rcStudentId, rcAcademicYear])

  function generate() {
    setError(''); setData(null)
    if (reportType === 'attendance' && attFrom > attTo) {
      setError('"From" date must be on or before "To" date.')
      return
    }
    if (reportType === 'fees' && feeFrom > feeTo) {
      setError('"From" month must be on or before "To" month.')
      return
    }
    startTransition(async () => {
      let result = null
      if      (reportType === 'roster')     result = await fetchRosterReport(classId)
      else if (reportType === 'attendance') result = await fetchAttendanceReport(classId, attFrom, attTo)
      else if (reportType === 'exam')       result = await fetchExamResultsReport(examId)
      else if (reportType === 'fees')       result = await fetchFeeReport(classId, feeFrom, feeTo)
      else if (reportType === 'reportcard') result = await fetchReportCard(rcStudentId, rcAcademicYear)
      if (!result) setError('Failed to generate report. Check filters and try again.')
      else setData(result)
    })
  }

  /* ── CSV builders ─────────────────────────────────────────────────────── */
  function downloadReport() {
    if (!data) return
    const cls = classLabel(data.class || data.exam?.class)

    if (reportType === 'roster') {
      const rows = [
        ['Roll No', 'Name', 'Parent Name', 'Parent Mobile', 'DOB', 'Admission Session', 'Current Session'],
        ...data.students.map(s => [s.rollNumber, s.name, s.parentName, s.parentMobile, s.dob, s.admissionSession, s.currentSession]),
      ]
      downloadCSV(`${cls}_Student_Roster.csv`, rows)
    }

    else if (reportType === 'attendance') {
      const rows = [
        [`Attendance Report — ${cls} — ${data.from} to ${data.to}`],
        ['Roll No', 'Name', 'Total Days', 'Present', 'Late', 'Absent', 'Attendance %'],
        ...data.students.map(s => [s.rollNumber, s.name, s.totalDays, s.present, s.late, s.absent, `${s.percentage}%`]),
      ]
      downloadCSV(`${cls}_Attendance_${data.from}_${data.to}.csv`, rows)
    }

    else if (reportType === 'exam') {
      const subjects = data.exam.subjects.map(s => s.name)
      const rows = [
        [`${data.exam.name} — ${cls}`],
        ['Roll No', 'Name', ...subjects, 'Total', 'Max', '%', 'Grade'],
        ...data.results.map(r => [
          r.rollNumber, r.name,
          ...subjects.map(sub => r.marks.find(m => m.subject === sub)?.obtained ?? ''),
          r.totalObtained, r.totalMax, `${r.percentage}%`, r.grade,
        ]),
        ...(data.noResult.length > 0 ? [['--- Absent / No Marks ---'], ...data.noResult.map(s => [s.rollNumber, s.name])] : []),
      ]
      downloadCSV(`${data.exam.name.replace(/\s+/g, '_')}_Results.csv`, rows)
    }

    else if (reportType === 'fees') {
      const rows = [
        [`Fee Report — ${cls} — ${data.months[0]} to ${data.months[data.months.length - 1]}`],
        ['Roll No', 'Name', ...data.months, 'Paid Months', 'Due Months', 'Total Paid (₹)'],
        ...data.students.map(s => [
          s.rollNumber, s.name,
          ...s.months.map(m => m.status === 'paid' ? `Paid ₹${m.amount}` : 'Due'),
          s.paidCount, s.dueCount, s.totalPaid,
        ]),
      ]
      downloadCSV(`${cls}_Fees_${data.months[0]}_${data.months[data.months.length - 1]}.csv`, rows)
    }
  }

  if (!classes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
        <span className="text-5xl mb-4">📊</span>
        <p className="text-slate-600 font-medium">No classes yet</p>
        <p className="text-slate-400 text-sm mt-1">Create classes first to generate reports.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Reports &amp; Export</h2>
        <p className="text-sm text-slate-500 mt-0.5">Generate attendance, result, fee and student reports — download as CSV or print as report cards</p>
      </div>

      {/* Report type tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => { setReportType(t.id); setData(null); setError('') }}
            className={`flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all ${
              reportType === t.id
                ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="text-2xl">{t.icon}</span>
            <span className={`text-sm font-semibold ${reportType === t.id ? 'text-emerald-700' : 'text-slate-700'}`}>{t.label}</span>
            <span className="text-xs text-slate-400 leading-snug">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Filters</h3>
        <div className="flex flex-wrap gap-4 items-end">

          {/* Class selector — not shown for exam (it has its own) */}
          {reportType !== 'exam' && (
            <div className="min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Class</label>
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {classes.map(c => (
                  <option key={String(c._id)} value={String(c._id)}>{classLabel(c)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Attendance date range */}
          {reportType === 'attendance' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">From date</label>
                <input type="date" value={attFrom} max={attTo}
                  onChange={e => setAttFrom(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">To date</label>
                <input type="date" value={attTo} min={attFrom} max={today()}
                  onChange={e => setAttTo(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </>
          )}

          {/* Exam picker */}
          {reportType === 'exam' && (
            <>
              <div className="min-w-[200px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Class</label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {classes.map(c => (
                    <option key={String(c._id)} value={String(c._id)}>{classLabel(c)}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[240px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Exam</label>
                {exams.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No exams for this class</p>
                ) : (
                  <select
                    value={examId}
                    onChange={e => setExamId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {exams.map(e => (
                      <option key={String(e.id)} value={String(e.id)}>
                        {e.name}{e.examDate ? ` (${e.examDate})` : ''}{e.isPublished ? ' ✓' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}

          {/* Fee month range */}
          {reportType === 'fees' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">From month</label>
                <input type="month" value={feeFrom} max={feeTo}
                  onChange={e => setFeeFrom(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">To month</label>
                <input type="month" value={feeTo} min={feeFrom}
                  onChange={e => setFeeTo(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </>
          )}

          {/* Report card: student + session */}
          {reportType === 'reportcard' && (
            <>
              <div className="min-w-[220px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Student</label>
                {rcStudents.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No students in this class</p>
                ) : (
                  <select
                    value={rcStudentId}
                    onChange={e => setRcStudentId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {rcStudents.map(s => (
                      <option key={String(s._id)} value={String(s._id)}>
                        {s.rollNumber ? `${s.rollNumber} — ` : ''}{s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Academic Year</label>
                <select
                  value={rcAcademicYear}
                  onChange={e => setRcAcademicYear(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {sessionOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            onClick={generate}
            disabled={isPending
              || (reportType === 'exam'       && !examId)
              || (reportType === 'reportcard' && !rcStudentId)
            }
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isPending ? 'Generating…' : 'Generate Report'}
          </button>
        </div>

        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      </div>

      {/* Report output */}
      {data && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

          {/* Output header */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-800">
                {reportType === 'roster'     && `Student Roster — ${classLabel(data.class)} (${data.students.length} students)`}
                {reportType === 'attendance' && `Attendance — ${classLabel(data.class)} — ${data.from} to ${data.to}`}
                {reportType === 'exam'       && `${data.exam.name} — ${classLabel(data.exam.class)}`}
                {reportType === 'fees'       && `Fee Report — ${classLabel(data.class)} — ${data.months[0]} to ${data.months[data.months.length - 1]}`}
                {reportType === 'reportcard' && `Report Card — ${data.student.name} — ${data.academicYear}`}
              </p>
              {reportType === 'attendance' && (
                <p className="text-xs text-slate-400 mt-0.5">{data.totalDays} school day(s) marked in this period</p>
              )}
              {reportType === 'exam' && data.exam.academicYear && (
                <p className="text-xs text-slate-400 mt-0.5">Session {data.exam.academicYear}</p>
              )}
              {reportType === 'reportcard' && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {classLabel(data.student.class)} &bull; {data.exams.length} exam(s)
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {reportType === 'reportcard' ? (
                <button
                  onClick={() => printReportCard(data, school?.name)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Print Report Card
                </button>
              ) : (
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  ↓ Download CSV
                </button>
              )}
            </div>
          </div>

          {/* ── ROSTER TABLE ── */}
          {reportType === 'roster' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-left border-b border-slate-100">
                    {['Roll', 'Name', 'Parent Name', 'Parent Mobile', 'DOB', 'Session'].map(h => (
                      <th key={h} className="px-3 py-2 font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.students.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-mono text-slate-400">{s.rollNumber || '—'}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                      <td className="px-3 py-2 text-slate-600">{s.parentName || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{s.parentMobile || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{s.dob || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{s.admissionSession || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── ATTENDANCE TABLE ── */}
          {reportType === 'attendance' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-left border-b border-slate-100">
                    {['Roll', 'Name', 'Present', 'Late', 'Absent', 'Total Days', 'Attendance %'].map(h => (
                      <th key={h} className="px-3 py-2 font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.students.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-mono text-slate-400">{s.rollNumber || '—'}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                      <td className="px-3 py-2 text-emerald-600 font-medium">{s.present}</td>
                      <td className="px-3 py-2 text-amber-600">{s.late}</td>
                      <td className="px-3 py-2 text-red-500">{s.absent}</td>
                      <td className="px-3 py-2 text-slate-500">{s.totalDays}</td>
                      <td className="px-3 py-2">
                        <span className={`font-semibold ${s.percentage >= 75 ? 'text-emerald-600' : s.percentage >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                          {s.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── EXAM RESULTS TABLE ── */}
          {reportType === 'exam' && (
            <div className="overflow-x-auto">
              {data.results.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No marks entered for this exam yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-left border-b border-slate-100">
                      <th className="px-3 py-2 font-semibold text-slate-500">Roll</th>
                      <th className="px-3 py-2 font-semibold text-slate-500">Name</th>
                      {data.exam.subjects.map(s => (
                        <th key={s.name} className="px-3 py-2 font-semibold text-slate-500 text-center whitespace-nowrap">
                          {s.name}<br/><span className="text-slate-300 font-normal">/{s.maxMarks}</span>
                        </th>
                      ))}
                      <th className="px-3 py-2 font-semibold text-slate-500 text-center">Total</th>
                      <th className="px-3 py-2 font-semibold text-slate-500 text-center">%</th>
                      <th className="px-3 py-2 font-semibold text-slate-500 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.results.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-mono text-slate-400">{r.rollNumber || '—'}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">{r.name}</td>
                        {data.exam.subjects.map(s => {
                          const m = r.marks.find(x => x.subject === s.name)
                          return <td key={s.name} className="px-3 py-2 text-center text-slate-600">{m?.obtained ?? '—'}</td>
                        })}
                        <td className="px-3 py-2 text-center font-semibold text-slate-700">{r.totalObtained}/{r.totalMax}</td>
                        <td className="px-3 py-2 text-center text-slate-600">{r.percentage}%</td>
                        <td className="px-3 py-2 text-center"><GradeBadge grade={r.grade} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {data.noResult.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 bg-amber-50">
                  <p className="text-xs text-amber-600 font-medium">
                    {data.noResult.length} student(s) with no marks entered: {data.noResult.map(s => s.name).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── FEE TABLE ── */}
          {reportType === 'fees' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-left border-b border-slate-100">
                    <th className="px-3 py-2 font-semibold text-slate-500">Roll</th>
                    <th className="px-3 py-2 font-semibold text-slate-500">Name</th>
                    {data.months.map(m => (
                      <th key={m} className="px-3 py-2 font-semibold text-slate-500 text-center whitespace-nowrap">{m}</th>
                    ))}
                    <th className="px-3 py-2 font-semibold text-slate-500 text-center">Paid</th>
                    <th className="px-3 py-2 font-semibold text-slate-500 text-right">Total ₹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.students.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-mono text-slate-400">{s.rollNumber || '—'}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                      {s.months.map(m => (
                        <td key={m.month} className="px-3 py-2 text-center">
                          {m.status === 'paid'
                            ? <span className="text-emerald-600 font-medium">✓</span>
                            : <span className="text-red-400">✕</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center text-slate-600">
                        {s.paidCount}/{data.months.length}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">
                        {s.totalPaid > 0 ? `₹${s.totalPaid.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── REPORT CARD PREVIEW ── */}
          {reportType === 'reportcard' && (
            <div className="p-5 space-y-5">

              {/* Student info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 rounded-lg p-4 border border-slate-100">
                {[
                  ['Name',             data.student.name],
                  ['Roll Number',      data.student.rollNumber || '—'],
                  ['Class',            classLabel(data.student.class)],
                  ['Date of Birth',    data.student.dob || '—'],
                  ['Parent / Guardian', data.student.parentName || '—'],
                  ['Admission Session', data.student.admissionSession || '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Exam results */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Exam Results</h4>
                {data.exams.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-lg">
                    No published exam results found for session {data.academicYear}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.exams.map((e, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                          <span className="font-semibold text-slate-800 text-sm">{e.name}</span>
                          <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                            {e.type === 'unit_test' ? 'Unit Test' : 'Annual'}
                          </span>
                          {e.examDate && <span className="text-xs text-slate-400">{e.examDate}</span>}
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700">{e.percentage}%</span>
                            <GradeBadge grade={e.grade} />
                          </div>
                        </div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="px-4 py-2 text-left font-semibold text-slate-500">Subject</th>
                              <th className="px-4 py-2 text-center font-semibold text-slate-500">Marks</th>
                              <th className="px-4 py-2 text-center font-semibold text-slate-500">Max</th>
                              <th className="px-4 py-2 text-center font-semibold text-slate-500">%</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {e.marks.map((m, j) => (
                              <tr key={j} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2 text-slate-700">{m.subject}</td>
                                <td className="px-4 py-2 text-center font-semibold text-slate-800">{m.obtained}</td>
                                <td className="px-4 py-2 text-center text-slate-400">{m.maxMarks}</td>
                                <td className="px-4 py-2 text-center text-slate-600">
                                  {m.maxMarks > 0 ? Math.round((m.obtained / m.maxMarks) * 100) : 0}%
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                              <td className="px-4 py-2 text-slate-700">Total</td>
                              <td className="px-4 py-2 text-center text-slate-800">{e.totalObtained}</td>
                              <td className="px-4 py-2 text-center text-slate-500">{e.totalMax}</td>
                              <td className="px-4 py-2 text-center text-slate-700">{e.percentage}%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attendance summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Attendance Summary</h4>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: 'Present', value: data.attendance.present, color: 'text-emerald-600' },
                    { label: 'Late',    value: data.attendance.late,    color: 'text-amber-500' },
                    { label: 'Absent',  value: data.attendance.absent,  color: 'text-red-500' },
                    { label: 'Total',   value: data.attendance.totalDays, color: 'text-slate-600' },
                    { label: 'Attendance', value: `${data.attendance.percentage}%`,
                      color: data.attendance.percentage >= 75 ? 'text-emerald-600' : data.attendance.percentage >= 50 ? 'text-amber-500' : 'text-red-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <p className={`text-xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  )
}
