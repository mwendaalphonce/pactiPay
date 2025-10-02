'use client'

import { ReactNode } from 'react'
import Navigation from './Navigation'
import Header from './Header'
import Footer from './Footer'
import { Toaster } from '@/components/ui/sonner'

interface AppLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  headerActions?: ReactNode
  showNavigation?: boolean
  showFooter?: boolean
}

export default function AppLayout({
  children,
  title,
  subtitle,
  headerActions,
  showNavigation = true,
  showFooter = true
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {showNavigation && <Navigation />}
      
      <Header 
        title={title} 
        subtitle={subtitle}
        actions={headerActions}
      />
      
      <main className="flex-1">
        {children}
      </main>
      
      {showFooter && <Footer />}
      
      <Toaster />
    </div>
  )
}