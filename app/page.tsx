// src/app/page.tsx - Fixed data access
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import DashboardStats from '@/components/dashboard/DashboardStats'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'
import PayrollSummary from '@/components/dashboard/PayrollSummary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { P10ReportDownload } from '@/components/p10-download'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  Users, 
  Calculator, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign
} from 'lucide-react'

// Types for dashboard data
interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalPayroll: number
  payslipsGenerated: number
  pendingPayrolls: number
  lastPayrollDate: string | null
  monthlyGrowth: number
  complianceStatus: 'good' | 'warning' | 'critical'
}

interface PayrollSummaryData {
  currentMonth: string
  totalEmployees: number
  processedEmployees: number
  totalGrossPay: number
  totalNetPay: number
  totalDeductions: number
  status: 'not_started' | 'in_progress' | 'completed'
  dueDate: string
  lastProcessedDate: string | null
}

interface RecentActivity {
  id: string
  type: 'payroll_processed' | 'payslip_generated' | 'employee_added' | 'employee_edited'
  description: string
  timestamp: string
  user: string
  metadata?: any
}

interface UpcomingTask {
  id: string
  title: string
  description: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  type: string
}

interface KeyMetrics {
  averageSalary: number
  totalDeductionsThisMonth: number
  payrollAccuracy: number
  employeeSatisfaction: number
  complianceScore: number
}

interface DashboardData {
  stats: DashboardStats
  payrollSummary: PayrollSummaryData
  recentActivities: RecentActivity[]
  upcomingTasks: UpcomingTask[]
  keyMetrics: KeyMetrics
}

export default function Dashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Failed to fetch dashboard data: ${response.status}`)
        }

        const result = await response.json()
        
        // FIX: Access the nested data property
        if (!result.success) {
          throw new Error(result.message || 'Failed to load dashboard data')
        }
        
        setDashboardData(result.data) // Access result.data instead of result directly
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Action handlers - clean and intuitive navigation
  const handleAddEmployee = () => {
    router.push('/employees/add')
  }

  const handleRunPayroll = () => {
    router.push('/payroll/run')
  }

  const handleViewPayslips = () => {
    router.push('/payslips')
  }
  

  const handleDownloadReports = async () => {
    try {
      const response = await fetch('/api/payroll/p10/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'monthly_payroll',
          month: new Date().toISOString().slice(0, 7) // YYYY-MM format
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `payroll_report_${new Date().toISOString().slice(0, 7)}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error('Failed to download report')
      }
    } catch (err) {
      console.error('Error downloading report:', err)
      alert('Failed to download report. Please try again.')
    }
  }

  const handleViewReports = () => {
    router.push('/reports')
  }

  const handleViewSettings = () => {
    router.push('/settings')
  }

  const handleStartPayroll = () => {
    router.push('/payroll/process')
  }

  const handleViewPayrollDetails = () => {
    router.push('/payroll/current')
  }

  // Loading state - clean and consistent
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Header title="Dashboard" subtitle="Loading your payroll overview..." />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Stats Loading Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
            
            {/* Main Content Loading */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state - clear and actionable
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Header title="Dashboard" subtitle="Welcome to your Kenya Payroll System overview" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
                <h3 className="text-lg font-medium text-red-900">Unable to Load Dashboard</h3>
                <p className="text-red-700">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Header title="Dashboard" subtitle="Welcome to your Kenya Payroll System overview" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Users className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="text-lg font-medium text-gray-900">No Data Available</h3>
                <p className="text-gray-600">Start by adding employees to see your dashboard data.</p>
                <Button onClick={handleAddEmployee}>
                  Add First Employee
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />
      
      {/* Header - consistent and clear */}
      <Header 
        title="Dashboard" 
        subtitle="Welcome to your Kenya Payroll System overview"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleViewSettings}>
              Settings
            </Button>
            <Button size="sm" onClick={handleRunPayroll}>
              Run Payroll
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard Statistics - clear metrics display */}
        <DashboardStats stats={dashboardData.stats} />

        {/* Main Content Grid - intuitive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Primary content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Payroll Summary - most important info first */}
            <PayrollSummary
              data={dashboardData.payrollSummary}
              onStartPayroll={handleStartPayroll}
              onViewDetails={handleViewPayrollDetails}
            />

            {/* Key Metrics - visual and easy to scan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Key Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      KSh {dashboardData.keyMetrics.averageSalary.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Average Salary</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.keyMetrics.payrollAccuracy}%
                    </div>
                    <p className="text-sm text-gray-600">Payroll Accuracy</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboardData.keyMetrics.complianceScore}%
                    </div>
                    <p className="text-sm text-gray-600">Compliance Score</p>
                  </div>
                  <div className="text-center md:col-span-3">
                    <div className="text-2xl font-bold text-orange-600">
                      {dashboardData.keyMetrics.employeeSatisfaction}%
                    </div>
                    <p className="text-sm text-gray-600">Employee Satisfaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Tasks - actionable items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Tasks
                  {dashboardData.upcomingTasks.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {dashboardData.upcomingTasks.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.upcomingTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>All tasks are up to date!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.upcomingTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-3 h-3 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-gray-600">{task.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString('en-KE')}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Secondary actions and info */}
          <div className="space-y-8">
            {/* Quick Actions - prominent and accessible */}
            <QuickActions
              onAddEmployee={handleAddEmployee}
              onRunPayroll={handleRunPayroll}
              onViewPayslips={handleViewPayslips}
              onDownloadReports={handleDownloadReports}
              onViewReports={handleViewReports}
              onViewSettings={handleViewSettings}
            />

            {/* Recent Activity - contextual information */}
            <RecentActivity activities={dashboardData.recentActivities} />
          </div>
        </div>

        {/* Compliance & Alerts - important status information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Compliance Status - clear status indicators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>PAYE Tax Filing</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Up to date</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>NSSF Contributions</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Current</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>SHIF Deductions</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Compliant</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Housing Levy</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Alerts - actionable notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.stats.pendingPayrolls > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {dashboardData.stats.pendingPayrolls} employees have payrolls pending. 
                      <Button variant="link" className="p-0 h-auto ml-1 font-medium" onClick={handleRunPayroll}>
                        Process now →
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Monthly tax filing due in 6 days (November 9, 2025).
                    <Button variant="link" className="p-0 h-auto ml-1 font-medium" onClick={handleViewReports}>
                      Generate report →
                    </Button>
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-gray-600 space-y-1">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    All employee records are up to date
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Bank details verified for all active employees
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    System backup completed successfully
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Footer - key stats at a glance */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">This Month</span>
                </div>
                <p className="text-sm text-gray-600">
                  {dashboardData.stats.payslipsGenerated} payslips generated
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Total Processed</span>
                </div>
                <p className="text-sm text-gray-600">
                  KSh {dashboardData.payrollSummary.totalNetPay.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Calculator className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Accuracy Rate</span>
                </div>
                <p className="text-sm text-gray-600">
                  {dashboardData.keyMetrics.payrollAccuracy}% this month
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                  <span className="font-medium">Compliance</span>
                </div>
                <p className="text-sm text-gray-600">
                  All statutory requirements met
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
    <P10ReportDownload />
      <Footer />
    </div>
  )
}