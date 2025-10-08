// src/app/payroll/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import PayrollCalculator from '@/components/payslips/PayrollCalculator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  History, 
  Users, 
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Eye
} from 'lucide-react'
import { Employee, PayrollRun } from '@/types'
import { useToast } from '../providers'
import type { PayrollCalculationResult } from '@/lib/payroll/calculations'

export default function PayrollPage() {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)
  const [activeTab, setActiveTab] = useState('calculator')

  // Get current month in YYYY-MM format
  const getCurrentMonthYear = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch employees and payroll runs in parallel
        const [employeesRes, payrollRes] = await Promise.all([
          fetch('/api/employees?isActive=true'),
          fetch('/api/payroll')
        ])
        
        if (!employeesRes.ok || !payrollRes.ok) {
          throw new Error('Failed to fetch data')
        }
        
        const [employeesData, payrollData] = await Promise.all([
          employeesRes.json(),
          payrollRes.json()
        ])
        
        if (employeesData.success && employeesData.data) {
          setEmployees(employeesData.data)
        }
        
        if (payrollData.success && payrollData.data) {
          setPayrollRuns(payrollData.data)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        showToast('Failed to load payroll data', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [showToast])

  const handleCalculatePayroll = (result: PayrollCalculationResult) => {
    // This is called when calculation is done in the component
    // Just for preview - no need to do anything here unless you want to track it
    console.log('Payroll calculated:', result)
  }

  const handleSavePayroll = async (saveData: any) => {
    setIsCalculating(true)
    
    try {
      // The saveData now includes the calculationResult from the component
      const { calculationResult, ...payrollData } = saveData
      
      // Prepare the payload for the API
      const payload = {
        employeeId: payrollData.employeeId,
        monthYear: payrollData.monthYear,
        overtimeHours: payrollData.overtimeHours || 0,
        overtimeType: payrollData.overtimeType || 'weekday',
        unpaidDays: payrollData.unpaidDays || 0,
        customDeductions: payrollData.customDeductions || 0,
        customDeductionDescription: payrollData.customDeductionDescription || null,
        bonuses: payrollData.bonuses || 0,
        bonusDescription: payrollData.bonusDescription || null,
        // Include calculated values for database storage
        basicSalary: calculationResult?.earnings.basicSalary || 0,
        allowances: calculationResult?.earnings.allowances || 0,
        overtime: calculationResult?.earnings.overtime || 0,
        grossPay: calculationResult?.earnings.grossPay || 0,
        nssf: calculationResult?.deductions.nssf || 0,
        shif: calculationResult?.deductions.shif || 0,
        housingLevy: calculationResult?.deductions.housingLevy || 0,
        taxableIncome: calculationResult?.deductions.taxableIncome || 0,
        paye: calculationResult?.deductions.paye || 0,
        totalDeductions: calculationResult?.deductions.totalDeductions || 0,
        netPay: calculationResult?.netPay || 0
      }

      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save payroll')
      }

      // Add new payroll run to state
      setPayrollRuns(prev => [result.data, ...prev])
      
      const employeeName = employees.find(e => e.id === payrollData.employeeId)?.name || 'Employee'
      showToast(`Payroll saved successfully for ${employeeName}`, 'success')
      
      // Switch to history tab to show result
      setActiveTab('history')
    } catch (error: any) {
      console.error('Error saving payroll:', error)
      showToast(error.message || 'Failed to save payroll', 'error')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleBulkPayroll = async () => {
    const currentMonth = getCurrentMonthYear()
    
    // Get employees who don't have payroll for current month
    const pendingEmployees = employees.filter(emp => 
      !payrollRuns.some(run => 
        run.employeeId === emp.id && run.monthYear === currentMonth
      )
    )
    
    if (pendingEmployees.length === 0) {
      showToast('All employees already have payroll for this month', 'info')
      return
    }
    
    const confirmBulk = window.confirm(
      `Process payroll for ${pendingEmployees.length} employee(s) for ${currentMonth}?\n\n` +
      'This will use standard calculations with no overtime, unpaid days, or custom deductions.'
    )
    
    if (!confirmBulk) return
    
    setIsCalculating(true)
    
    try {
      const response = await fetch('/api/payroll/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthYear: currentMonth,
          employeeIds: pendingEmployees.map(emp => emp.id)
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process batch payroll')
      }

      // Add new payroll runs to state
      if (result.data && Array.isArray(result.data)) {
        setPayrollRuns(prev => [...result.data, ...prev])
        showToast(
          `Batch payroll completed: ${result.data.length} employee(s) processed`,
          'success'
        )
      } else if (result.data?.processed) {
        setPayrollRuns(prev => [...result.data.processed, ...prev])
        showToast(
          `Batch payroll completed: ${result.data.summary?.successful || 0} successful, ${result.data.summary?.failed || 0} failed`,
          (result.data.summary?.failed || 0) > 0 ? 'warning' : 'success'
        )
      }
      
      // Switch to history tab
      setActiveTab('history')
    } catch (error: any) {
      console.error('Error processing batch payroll:', error)
      showToast(error.message || 'Failed to process batch payroll', 'error')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleViewPayslips = () => {
    router.push('/payslips')
  }

  const handleViewPayrollDetails = (payrollRun: PayrollRun) => {
    // Navigate to payslip detail page or open modal
    router.push(`/payslips/${payrollRun.id}`)
  }

const handleExportPayroll = async (payrollRun: PayrollRun) => {
  try {
    showToast('Exporting payslip...', 'info')
    
    const response = await fetch(`/api/payroll/${payrollRun.id}/pdf`)
    
    if (!response.ok) {
      // Log the actual error from the server
      const errorData = await response.json().catch(() => null)
      console.error('Server error:', errorData)
      throw new Error(errorData?.error || 'Failed to export payslip')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payslip-${payrollRun.monthYear}-${payrollRun.employee?.name || payrollRun.employeeId}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    showToast('Payslip exported successfully', 'success')
  } catch (error: any) {
    console.error('Error exporting payslip:', error)
    showToast(error.message || 'Failed to export payslip', 'error')
  }
}
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return 'bg-green-100 text-green-800'
      case 'CALCULATED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return <CheckCircle className="w-4 h-4" />
      case 'CALCULATED':
        return <Clock className="w-4 h-4" />
      case 'CANCELLED':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleViewPayslips}>
        View Payslips
      </Button>
      <Button 
        size="sm" 
        onClick={handleBulkPayroll}
        disabled={isCalculating || employees.length === 0}
      >
        <Play className="w-4 h-4 mr-2" />
        {isCalculating ? 'Processing...' : 'Bulk Process'}
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <AppLayout title="Payroll Management" subtitle="Loading payroll data..." headerActions={headerActions}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-lg">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const currentMonth = getCurrentMonthYear()
  const processedThisMonth = payrollRuns.filter(r => r.monthYear === currentMonth)
  const pendingEmployees = employees.filter(emp => 
    !processedThisMonth.some(run => run.employeeId === emp.id)
  )

  return (
    <AppLayout
      title="Payroll Management"
      subtitle="Calculate and process employee payrolls with Kenya tax compliance"
      headerActions={headerActions}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Bulk Process
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History ({payrollRuns.length})
            </TabsTrigger>
          </TabsList>
          

          {/* Payroll Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            {employees.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">No Active Employees</h3>
                    <p className="mb-4">Add employees to start processing payroll</p>
                    <Button onClick={() => router.push('/employees')}>
                      Add Employees
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PayrollCalculator
                employees={employees}
                onCalculate={handleCalculatePayroll}
                onSave={handleSavePayroll}
                isLoading={isCalculating}
              />
            )}
          </TabsContent>

          {/* Bulk Process Tab */}
          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Bulk Payroll Processing - {currentMonth}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Payroll Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
                      <p className="text-blue-600">Total Employees</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {processedThisMonth.length}
                      </div>
                      <p className="text-green-600">Processed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {pendingEmployees.length}
                      </div>
                      <p className="text-orange-600">Pending</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {employees.length > 0 ? Math.round((processedThisMonth.length / employees.length) * 100) : 0}%
                      </div>
                      <p className="text-purple-600">Complete</p>
                    </div>
                  </div>
                </div>

                {pendingEmployees.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-semibold">Employees Pending Payroll</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {pendingEmployees.map(employee => (
                          <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {employee.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium">{employee.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {formatCurrency(employee.basicSalary + employee.allowances)} gross
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              Pending
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        size="lg" 
                        onClick={handleBulkPayroll} 
                        className="flex-1"
                        disabled={isCalculating}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isCalculating ? 'Processing...' : `Process ${pendingEmployees.length} Pending Payroll${pendingEmployees.length > 1 ? 's' : ''}`}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-semibold mb-2">All Payrolls Processed</h3>
                    <p className="text-gray-600">
                      All active employees have been processed for {currentMonth}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Payroll History
                  </div>
                  {payrollRuns.length > 0 && (
                    <Badge variant="outline">{payrollRuns.length} record{payrollRuns.length > 1 ? 's' : ''}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payrollRuns.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">No Payroll History</h3>
                    <p className="text-sm mb-4">Processed payrolls will appear here</p>
                    <Button onClick={() => setActiveTab('calculator')}>
                      Calculate Payroll
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payrollRuns.map(payrollRun => {
                      const employee = employees.find(emp => emp.id === payrollRun.employeeId) || 
                                      payrollRun.employee
                      return (
                        <div key={payrollRun.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 font-medium text-sm">
                                  {employee?.name?.split(' ').map(n => n[0]).join('') || 'NA'}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium">{employee?.name || 'Unknown Employee'}</h4>
                                <p className="text-sm text-gray-600">
                                  {payrollRun.monthYear} • {employee?.kraPin}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(payrollRun.status || 'PROCESSED')}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(payrollRun.status || 'PROCESSED')}
                                  {payrollRun.status || 'PROCESSED'}
                                </div>
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-600">Gross Pay:</span>
                              <p className="font-medium text-green-600">
                                {formatCurrency(payrollRun.grossPay)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Deductions:</span>
                              <p className="font-medium text-red-600">
                                {formatCurrency(payrollRun.totalDeductions)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Net Pay:</span>
                              <p className="font-bold text-blue-600">
                                {formatCurrency(payrollRun.netPay)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Basic Salary:</span>
                              <p className="font-medium">
                                {formatCurrency(payrollRun.basicSalary)}
                              </p>
                            </div>
                          </div>

                          {(payrollRun.overtime > 0 || payrollRun.bonuses > 0 || payrollRun.customDeductions > 0) && (
                            <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                              <div className="grid grid-cols-3 gap-2">
                                {payrollRun.overtime > 0 && (
                                  <div>
                                    <span className="text-gray-600">Overtime:</span>
                                    <p className="font-medium">{formatCurrency(payrollRun.overtime)}</p>
                                  </div>
                                )}
                                {payrollRun.bonuses > 0 && (
                                  <div>
                                    <span className="text-gray-600">Bonuses:</span>
                                    <p className="font-medium">{formatCurrency(payrollRun.bonuses)}</p>
                                  </div>
                                )}
                                {payrollRun.customDeductions > 0 && (
                                  <div>
                                    <span className="text-gray-600">Custom Deductions:</span>
                                    <p className="font-medium text-red-600">{formatCurrency(payrollRun.customDeductions)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t">
                            <p className="text-xs text-gray-500">
                              Processed: {payrollRun.createdAt ? formatDate(payrollRun.createdAt) : 'N/A'}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPayrollDetails(payrollRun)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportPayroll(payrollRun)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Export
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}