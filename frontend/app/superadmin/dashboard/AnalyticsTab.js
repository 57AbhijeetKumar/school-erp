'use client'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function StatCard({ label, value, color = 'text-slate-800' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
    </div>
  )
}

function BarChart({ data, labelKey, valueKey, title, color = 'bg-indigo-500' }) {
  if (!data?.length) return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-sm font-semibold text-slate-700 mb-3">{title}</p>
      <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
    </div>
  )
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-sm font-semibold text-slate-700 mb-4">{title}</p>
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-slate-600 font-medium">{d[valueKey]}</span>
            <div
              className={`w-full rounded-t ${color}`}
              style={{ height: `${Math.round((d[valueKey] / max) * 96)}px`, minHeight: '4px' }}
            />
            <span className="text-xs text-slate-400 truncate w-full text-center">
              {d[labelKey]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsTab({ overview, expiring, revenue, growth }) {
  const revenueChart = (revenue || []).map(r => ({
    label: `${MONTH_NAMES[r._id.month - 1]} ${r._id.year}`,
    total: r.total,
  }))
  const growthChart = (growth || []).map(g => ({
    label: `${MONTH_NAMES[g._id.month - 1]} ${g._id.year}`,
    count: g.count,
  }))

  return (
    <div className="space-y-8">

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Schools"   value={overview?.totalSchools}    color="text-slate-800"   />
        <StatCard label="Active"          value={overview?.activeSchools}   color="text-emerald-600" />
        <StatCard label="Inactive"        value={overview?.inactiveSchools} color="text-red-600"     />
        <StatCard label="Total Students"  value={overview?.totalStudents}   color="text-indigo-600"  />
        <StatCard label="Total Teachers"  value={overview?.totalTeachers}   color="text-violet-600"  />
        <StatCard
          label="Total Revenue"
          value={`₹${(overview?.totalRevenue || 0).toLocaleString('en-IN')}`}
          color="text-emerald-700"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={revenueChart} labelKey="label" valueKey="total"
          title="Monthly Revenue (₹)" color="bg-emerald-500"
        />
        <BarChart
          data={growthChart} labelKey="label" valueKey="count"
          title="New Schools per Month" color="bg-indigo-500"
        />
      </div>

      {/* Expiry alerts */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Expiring Subscriptions (next 30 days)</h3>
          {expiring.length > 0 && (
            <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {expiring.length}
            </span>
          )}
        </div>
        {expiring.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">
            No subscriptions expiring in the next 30 days.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expiring.map(s => (
              <div key={s._id} className="px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.email || s.phone || ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold capitalize text-slate-700">{s.subscription?.plan}</p>
                  <p className="text-xs text-amber-600">
                    Expires {new Date(s.subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
