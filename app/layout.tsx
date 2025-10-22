
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProviders } from './providers'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kenya Payroll System',
  description: 'Comprehensive payroll management system compliant with Kenyan labor laws and tax regulations',
  keywords: ['payroll', 'kenya', 'tax', 'paye', 'nssf', 'shif', 'housing levy', 'hr'],
  authors: [{ name: 'Kenya Payroll System' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en"   suppressHydrationWarning className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>

        <AppProviders>
               
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  )
}