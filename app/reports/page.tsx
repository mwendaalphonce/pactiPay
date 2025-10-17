// src/app/page.tsx - Add P10 report handlers to your Dashboard

// Add this function to your Dashboard component alongside other handlers
x

// Example: Update your QuickActions component to include P10 report
// src/components/dashboard/QuickActions.tsx

interface QuickActionsProps {
  onAddEmployee: () => void
  onRunPayroll: () => void
  onViewPayslips: () => void
  onDownloadReports: (reportType: 'monthly_payroll' | 'employee_summary' | 'statutory_deductions' | 'p10') => void
  onViewReports: () => void
  onViewSettings: () => void
}

export default function QuickActions({
  onAddEmployee,
  onRunPayroll,
  onViewPayslips,
  onDownloadReports,
  onViewReports,
  onViewSettings
}: QuickActionsProps) {
  const [showReportMenu, setShowReportMenu] = React.useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={onAddEmployee} className="w-full justify-start" variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
        
        <Button onClick={onRunPayroll} className="w-full justify-start">
          <Calculator className="w-4 h-4 mr-2" />
          Run Payroll
        </Button>
        
        <Button onClick={onViewPayslips} className="w-full justify-start" variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          View Payslips
        </Button>
        
        {/* Download Reports Dropdown */}
        <div className="relative">
          <Button 
            onClick={() => setShowReportMenu(!showReportMenu)} 
            className="w-full justify-start" 
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Reports
            <ChevronDown className="w-4 h-4 ml-auto" />
          </Button>
          
          {showReportMenu && (
            <div className="absolute left-0 right-0 mt-2 bg-white border rounded-md shadow-lg z-10">
              <button
                onClick={() => {
                  onDownloadReports('monthly_payroll')
                  setShowReportMenu(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                Monthly Payroll Report
              </button>
              <button
                onClick={() => {
                  onDownloadReports('statutory_deductions')
                  setShowReportMenu(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                Statutory Deductions
              </button>
              <button
                onClick={() => {
                  onDownloadReports('employee_summary')
                  setShowReportMenu(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                Employee Summary
              </button>
              <button
                onClick={() => {
                  onDownloadReports('p10')
                  setShowReportMenu(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-t font-medium text-blue-600"
              >
                P10 KRA Tax Report
              </button>
            </div>
          )}
        </div>
        
        <Button onClick={onViewReports} className="w-full justify-start" variant="outline">
          <BarChart className="w-4 h-4 mr-2" />
          View All Reports
        </Button>
      </CardContent>
    </Card>
  )
}

// Alternative: Create a dedicated Reports page with month selector
// src/app/reports/page.tsx

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileText } from 'lucide-react'

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [isDownloading, setIsDownloading] = useState(false)

  // Generate last 12 months for dropdown
  const getMonthOptions = () => {
    const months = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const value = date.toISOString().slice(0, 7)
      const label = date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })
      months.push({ value, label })
    }
    return months
  }

  const downloadReport = async (reportType: string, format: 'json' | 'csv' = 'csv') => {
    setIsDownloading(true)
    try {
      if (reportType === 'p10') {
        const response = await fetch(`/api/reports/p10?monthYear=${selectedMonth}&format=${format}`)
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to download report')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `P10_Report_${selectedMonth}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // Use the existing download endpoint
        const response = await fetch('/api/reports/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: reportType, month: selectedMonth })
        })

        if (!response.ok) throw new Error('Failed to download report')

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}_${selectedMonth}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert(error instanceof Error ? error.message : 'Failed to download report')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Download Reports</h1>

      {/* Month Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="font-medium">Select Period:</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* P10 KRA Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              P10 KRA Tax Deduction Card
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Official KRA P10 report with all employee tax deductions, allowable deductions (NSSF, SHIF, Housing Levy), and employer contributions.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => downloadReport('p10', 'csv')} 
                disabled={isDownloading}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
              <Button 
                onClick={() => downloadReport('p10', 'json')} 
                disabled={isDownloading}
                variant="outline"
              >
                View JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Payroll */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Monthly Payroll Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Comprehensive payroll summary with earnings, deductions, and net pay for all employees.
            </p>
            <Button 
              onClick={() => downloadReport('monthly_payroll')} 
              disabled={isDownloading}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Excel
            </Button>
          </CardContent>
        </Card>

        {/* Statutory Deductions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Statutory Deductions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Detailed breakdown of PAYE, NSSF, SHIF, and Housing Levy contributions.
            </p>
            <Button 
              onClick={() => downloadReport('statutory_deductions')} 
              disabled={isDownloading}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Excel
            </Button>
          </CardContent>
        </Card>

        {/* Employee Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Employee Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Complete employee roster with personal details, salaries, and bank information.
            </p>
            <Button 
              onClick={() => downloadReport('employee_summary')} 
              disabled={isDownloading}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Excel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}