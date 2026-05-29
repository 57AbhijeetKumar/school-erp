'use client'

export default function DashboardHome({ school, user, teachers, classesWithStudents, exams }) {
  const totalStudents    = classesWithStudents.reduce((n, c) => n + (c.students?.length || 0), 0)
  const activeTeachers   = teachers.filter(t => t.isActive !== false).length
  const inactiveTeachers = teachers.length - activeTeachers
  const publishedExams   = exams.filter(e => e.isPublished).length

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-6 text-white">
        <p className="text-emerald-100 text-sm font-medium">Welcome back,</p>
        <h1 className="text-2xl font-bold mt-0.5">{user.name || 'Admin'}</h1>
        <p className="text-emerald-100 text-sm mt-1">
          {school.name}{school.city ? ` · ${school.city}` : ''}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Teachers',  value: teachers.length,           sub: `${activeTeachers} active`,     color: 'emerald', icon: '👩‍🏫' },
          { label: 'Total Classes',   value: classesWithStudents.length, sub: 'across school',                color: 'blue',    icon: '🏫' },
          { label: 'Total Students',  value: totalStudents,             sub: 'enrolled',                     color: 'violet',  icon: '🎒' },
          { label: 'Exams Published', value: publishedExams,            sub: `${exams.length} total`,        color: 'amber',   icon: '📝' },
        ].map(({ label, value, sub, color, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
                <p className={`text-3xl font-bold mt-1 text-${color}-600`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <span className="text-2xl">{icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Class breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <span className="text-lg">🏫</span>
            <h2 className="font-semibold text-slate-800 text-sm">Classes Overview</h2>
          </div>
          {classesWithStudents.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No classes yet</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {classesWithStudents.map((cls, i) => {
                const label   = cls.section ? `${cls.name} — ${cls.section}` : cls.name
                const count   = cls.students?.length || 0
                const teacher = cls.classTeacher
                const pct     = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
                return (
                  <div key={String(cls._id || i)} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-slate-800">{label}</span>
                        {teacher && (
                          <span className="ml-2 text-xs text-slate-400">{teacher.name}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-slate-600">{count} students</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Teacher status */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👩‍🏫</span>
              <h2 className="font-semibold text-slate-800 text-sm">Teacher Roster</h2>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-600 font-medium">{activeTeachers} active</span>
              {inactiveTeachers > 0 && <span className="text-slate-400">{inactiveTeachers} inactive</span>}
            </div>
          </div>
          {teachers.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No teachers yet</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {teachers.map((t, i) => (
                <div key={String(t._id || i)} className="px-5 py-2.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                    {(t.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{t.name}</p>
                    <p className="text-xs text-slate-400 truncate">{t.subject || 'No subject'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.isActive !== false
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {t.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exams overview */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <span className="text-lg">📝</span>
            <h2 className="font-semibold text-slate-800 text-sm">Exams Overview</h2>
          </div>
          {exams.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No exams created yet</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {exams.map((e, i) => (
                <div key={String(e._id || i)} className="px-5 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{e.name}</p>
                    <p className="text-xs text-slate-400">
                      {e.class?.name}{e.class?.section ? ` — ${e.class.section}` : ''}
                      {e.examDate ? ` · ${new Date(e.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    e.isPublished
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {e.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats card */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h2 className="font-semibold text-slate-800 text-sm">Quick Summary</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Avg students per class', value: classesWithStudents.length ? Math.round(totalStudents / classesWithStudents.length) : 0 },
              { label: 'Classes with class teacher', value: classesWithStudents.filter(c => c.classTeacher).length },
              { label: 'Classes without teacher', value: classesWithStudents.filter(c => !c.classTeacher).length },
              { label: 'Total exams created', value: exams.length },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="text-sm font-bold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
