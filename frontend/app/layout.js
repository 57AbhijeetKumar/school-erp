import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata = {
  title: 'School ERP — Village Schools & Coaching',
  description: 'Digital ERP solution for small schools and coaching centers',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-slate-50 antialiased">{children}</body>
    </html>
  )
}
