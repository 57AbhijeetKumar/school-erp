import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="fixed top-3 right-4 z-50"><ThemeToggle /></div>
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-md mb-4">
            <span className="text-3xl">🏫</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-800">School ERP</h1>
          <p className="mt-2 text-slate-500 text-lg">Digital solution for village schools & coaching centers</p>
        </div>

        {/* Login Cards */}
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Super Admin */}
          <Link href="/superadmin/login"
            className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-lg hover:border-indigo-300 transition-all duration-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-1">Super Admin</h2>
            <p className="text-slate-500 text-sm mb-4">Manage all schools and coaching centers from one place.</p>
            <span className="inline-flex items-center text-indigo-600 text-sm font-medium">
              Login as Super Admin
              <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          {/* School Admin */}
          <Link href="/admin/login"
            className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-lg hover:border-emerald-300 transition-all duration-200">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-1">School Login</h2>
            <p className="text-slate-500 text-sm mb-4">Access your school dashboard — attendance, fees, results & more.</p>
            <span className="inline-flex items-center text-emerald-600 text-sm font-medium">
              Login as School Admin
              <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

        </div>

        <p className="text-center text-slate-400 text-xs mt-8">
          School ERP &copy; {new Date().getFullYear()} — Empowering village education
        </p>
      </div>
    </main>
  )
}
