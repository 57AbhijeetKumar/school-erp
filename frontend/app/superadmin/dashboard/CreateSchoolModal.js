'use client'

import { useActionState, useEffect, useState } from 'react'
import { createSchool } from '@/lib/actions/school'

function Field({ label, name, type = 'text', required, placeholder }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  )
}

export default function CreateSchoolModal() {
  const [isOpen,    setIsOpen]    = useState(false)
  const [openCount, setOpenCount] = useState(0)
  const [state, action, pending]  = useActionState(createSchool, null)

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false)
    }
  }, [state?.success])

  const open = () => {
    setOpenCount(c => c + 1)
    setIsOpen(true)
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={open}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create School
      </button>

      {/* Backdrop + Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Create New School</h2>
                <p className="text-xs text-slate-500 mt-0.5">Fill in details to onboard a new school</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form key={openCount} action={action} className="px-6 py-5 space-y-6">

              {state?.error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {state.error}
                </div>
              )}

              {/* School Details */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  School Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="School Name" name="name" required placeholder="Shri Ram Vidyalay" />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-xs font-medium text-slate-600 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      required
                      defaultValue="school"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="school">School</option>
                      <option value="coaching">Coaching Center</option>
                    </select>
                  </div>
                  <Field label="City"  name="city"  placeholder="Lucknow" />
                  <Field label="State" name="state" placeholder="Uttar Pradesh" />
                  <Field label="Phone" name="phone" type="tel" placeholder="+91 9999999999" />
                  <Field label="School Email" name="email" type="email" placeholder="school@example.com" />
                </div>
              </div>

              {/* Admin Account */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  Admin Account
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Admin Full Name" name="adminName" required placeholder="Ramesh Kumar" />
                  </div>
                  <Field label="Admin Email"    name="adminEmail"    type="email"    required placeholder="ramesh@school.com" />
                  <Field label="Admin Password" name="adminPassword" type="password" required placeholder="••••••••" />
                </div>
              </div>

              {/* Subscription */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  Subscription
                </h3>
                <div className="w-1/2">
                  <label htmlFor="monthlyCharge" className="block text-xs font-medium text-slate-600 mb-1">
                    Monthly Charge (₹)
                  </label>
                  <input
                    id="monthlyCharge"
                    name="monthlyCharge"
                    type="number"
                    min="0"
                    defaultValue="499"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors"
                >
                  {pending ? 'Creating…' : 'Create School'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
