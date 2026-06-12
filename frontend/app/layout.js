import { Geist } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata = {
  title: 'School ERP — Village Schools & Coaching',
  description: 'Digital ERP solution for small schools and coaching centers',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
      {/*
        suppressHydrationWarning is required because ThemeProvider adds/removes
        the 'dark' class on <html> client-side. Without it React warns about a
        class mismatch between server-rendered HTML and client hydration.
      */}
      <head>
        {/*
          Anti-flash script — runs synchronously before first paint.
          Reads localStorage preference (or falls back to OS preference) and
          applies .dark to <html> immediately, so there is no white flash
          when the user has dark mode saved.
        */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('erp_theme');
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (t === 'dark' || (!t && prefersDark)) {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        ` }} />
      </head>
      <body className="min-h-full bg-slate-50 antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
