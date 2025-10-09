// src/app/payslips/[id]/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Download,
  Printer,
  ArrowLeft,
  Mail,
  CheckCircle,
  Building2,
  Calendar,
  User,
  CreditCard,
  Info
} from 'lucide-react'
import { useToast } from '@/app/providers'
import type { PayrollRun, PayslipData } from '@/types'
import { useReactToPrint } from 'react-to-print'

export default function PayslipDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)
  
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null)
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadPayslipData(params.id as string)
    }
  }, [params.id])

  const loadPayslipData = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/payroll/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch payslip')
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setPayrollRun(result.data.payrollRun)
        setPayslipData(result.data.payslipData)
      }
    } catch (error) {
      console.error('Error loading payslip:', error)
      showToast('Failed to load payslip', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Payslip-${payslipData?.payroll.monthYear}-${payslipData?.employee.name}`
  })

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true)
      showToast('Generating PDF...', 'info')
      
      const response = await fetch(`/api/payroll/${params.id}/pdf`)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payslip-${payslipData?.payroll.monthYear}-${payslipData?.employee.name}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      showToast('Payslip downloaded successfully', 'success')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      showToast('Failed to download payslip', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleEmailPayslip = async () => {
    try {
      showToast('Sending email...', 'info')
      
      const response = await fetch(`/api/payroll/${params.id}/email`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to send email')
      }
      
      showToast('Payslip sent successfully', 'success')
    } catch (error) {
      console.error('Error sending email:', error)
      showToast('Failed to send payslip', 'error')
    }
  }

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMonthYearDisplay = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })
  }

  if (isLoading) {
    return (
      <AppLayout title="Payslip" subtitle="Loading payslip...">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!payslipData || !payrollRun) {
    return (
      <AppLayout title="Payslip" subtitle="Payslip not found">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">Payslip not found</p>
              <Button onClick={() => router.push('/payroll')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Payroll
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => router.push('/payroll')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>
      {payslipData.employee.email && (
        <Button variant="outline" size="sm" onClick={handleEmailPayslip}>
          <Mail className="w-4 h-4 mr-2" />
          Email
        </Button>
      )}
      <Button size="sm" onClick={handleDownloadPDF} disabled={isDownloading}>
        <Download className="w-4 h-4 mr-2" />
        {isDownloading ? 'Generating...' : 'Download PDF'}
      </Button>
    </div>
  )

  return (
    <AppLayout
      title={`Payslip - ${payslipData.employee.name}`}
      subtitle={getMonthYearDisplay(payslipData.payroll.monthYear)}
      headerActions={headerActions}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Printable Payslip */}
        <div ref={printRef} className="bg-white print:shadow-none">
          <Card>
            <CardHeader className="space-y-6">
              {/* Company Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{payslipData.company.name}</h1>
                  <p className="text-sm text-gray-600 mt-1">{payslipData.company.address}</p>
                  <p className="text-sm text-gray-600">
                    {payslipData.company.phone} • {payslipData.company.email}
                  </p>
                  {payslipData.company.kraPin && (
                    <p className="text-sm text-gray-600">KRA PIN: {payslipData.company.kraPin}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-800 mb-2">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {payrollRun.status}
                  </Badge>
                  <h2 className="text-2xl font-bold text-gray-900">PAYSLIP</h2>
                  <p className="text-sm text-gray-600 mt-1">{getMonthYearDisplay(payslipData.payroll.monthYear)}</p>
                </div>
              </div>

              <Separator />

              {/* Employee Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    EMPLOYEE INFORMATION
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{payslipData.employee.name}</span>
                    </div>
                    {payslipData.employee.employeeNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employee No:</span>
                        <span className="font-medium">{payslipData.employee.employeeNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">KRA PIN:</span>
                      <span className="font-medium">{payslipData.employee.kraPin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">National ID:</span>
                      <span className="font-medium">{payslipData.employee.nationalId}</span>
                    </div>
                    {payslipData.employee.position && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Position:</span>
                        <span className="font-medium">{payslipData.employee.position}</span>
                      </div>
                    )}
                    {payslipData.employee.department && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium">{payslipData.employee.department}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    PAYMENT INFORMATION
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span className="font-medium">{payslipData.employee.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account:</span>
                      <span className="font-medium">{payslipData.employee.bankAccount}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processed:</span>
                      <span className="font-medium">{formatDate(payslipData.payroll.processedDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Earnings Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                  EARNINGS
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Basic Salary</span>
                    <span className="font-medium">{formatCurrency(payslipData.earnings.basicSalary)}</span>
                  </div>
                  {payslipData.earnings.allowances > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Allowances</span>
                      <span className="font-medium">{formatCurrency(payslipData.earnings.allowances)}</span>
                    </div>
                  )}
                  {payslipData.earnings.overtime > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        Overtime ({payslipData.earnings.overtimeHours} hrs)
                      </span>
                      <span className="font-medium">{formatCurrency(payslipData.earnings.overtime)}</span>
                    </div>
                  )}
                  {payslipData.earnings.bonuses > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        Bonuses {payslipData.earnings.bonusDescription && `(${payslipData.earnings.bonusDescription})`}
                      </span>
                      <span className="font-medium">{formatCurrency(payslipData.earnings.bonuses)}</span>
                    </div>
                  )}
                  <Separator className="my-3" />
                  <div className="flex justify-between font-bold text-lg text-green-700">
                    <span>GROSS PAY</span>
                    <span>{formatCurrency(payslipData.earnings.grossPay)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                  DEDUCTIONS
                </h3>
                
                {/* Allowable Deductions */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    ALLOWABLE DEDUCTIONS
                  </p>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">NSSF</span>
                      <span className="font-medium text-red-600">{formatCurrency(payslipData.deductions.nssf)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">SHIF</span>
                      <span className="font-medium text-red-600">{formatCurrency(payslipData.deductions.shif)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Housing Levy</span>
                      <span className="font-medium text-red-600">{formatCurrency(payslipData.deductions.housingLevy)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                      <span className="text-blue-700">Total Allowable Deductions</span>
                      <span className="text-blue-700">{formatCurrency(payslipData.deductions.totalAllowable)}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Calculation */}
                <div className="mb-4 bg-gray-50 p-3 rounded">
                  <p className="text-xs font-semibold text-gray-700 mb-2">TAX CALCULATION</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxable Income (After Allowable Deductions)</span>
                      <span className="font-medium">{formatCurrency(payslipData.deductions.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gross Tax</span>
                      <span className="font-medium">{formatCurrency(payslipData.deductions.grossTax)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Less: Personal Relief</span>
                      <span>-{formatCurrency(payslipData.deductions.personalRelief)}</span>
                    </div>
                    {payslipData.deductions.insuranceRelief > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Less: Insurance Relief</span>
                        <span>-{formatCurrency(payslipData.deductions.insuranceRelief)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                      <span className="text-red-700">PAYE (Net Tax)</span>
                      <span className="text-red-700">{formatCurrency(payslipData.deductions.paye)}</span>
                    </div>
                  </div>
                </div>

                {/* Custom Deductions */}
                {payslipData.deductions.customDeductions > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">OTHER DEDUCTIONS</p>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          Custom Deductions {payslipData.deductions.customDeductionDescription && `(${payslipData.deductions.customDeductionDescription})`}
                        </span>
                        <span className="font-medium text-red-600">{formatCurrency(payslipData.deductions.customDeductions)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Separator className="my-3" />
                <div className="flex justify-between font-bold text-lg text-red-700">
                  <span>TOTAL DEDUCTIONS</span>
                  <span>{formatCurrency(payslipData.deductions.totalDeductions)}</span>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-700 font-medium mb-1">NET PAY</p>
                    <p className="text-xs text-blue-600">Amount to be paid</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-900">{formatCurrency(payslipData.netPay)}</p>
                    {payslipData.additionalInfo?.effectiveTaxRate && (
                      <p className="text-xs text-blue-600 mt-1">
                        Effective Tax Rate: {payslipData.additionalInfo.effectiveTaxRate.toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

             

              {/* Additional Information */}
              {payslipData.additionalInfo && (
                <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
                  {payslipData.additionalInfo.unpaidDays && payslipData.additionalInfo.unpaidDays > 0 && (
                    <p>* Unpaid Days: {payslipData.additionalInfo.unpaidDays} days ({formatCurrency(payslipData.additionalInfo.unpaidDeduction || 0)})</p>
                  )}
                  <p>* This payslip is computer-generated and does not require a signature.</p>
                  <p>* SHIF and Housing Levy are allowable deductions as per December 2024 Tax Laws Amendment Act.</p>
                  <p>* For queries, contact the HR department.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}