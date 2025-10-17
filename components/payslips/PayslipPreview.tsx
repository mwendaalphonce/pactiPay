'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  User, 
  Calendar, 
  CreditCard, 
  Download,
  Mail,
  Printer
} from 'lucide-react'

interface PayslipPreviewData {
  // Company Info
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  
  // Payslip Info
  payslipNumber: string
  payPeriod: string
  issueDate: string
  
  // Employee Info
  employeeName: string
  kraPin: string
  nationalId: string
  bankName: string
  bankBranch: string
  bankAccount: string
  
  // Payroll Details
  workingDays: number
  actualDays: number
  overtimeHours: number
  holidayHours: number
  
  // Earnings
  basicPay: number
  allowancesPay: number
  overtimePay: number
  holidayPay: number
  bonuses: number
  grossPay: number
  
  // Deductions
  payeTax: number
  nssfEmployee: number
  shifDeduction: number
  housingLevy: number
  loanDeductions: number
  advanceDeductions: number
  otherDeductions: number
  totalDeductions: number
  
  // Net Pay
  netPay: number
  
  // YTD Totals
  ytdGrossPay: number
  ytdPayeTax: number
  ytdNssf: number
  ytdShif: number
  ytdHousingLevy: number
  ytdNetPay: number
  
  // Employer Contributions
  nssfEmployer: number
  housingLevyEmployer: number
}

interface PayslipPreviewProps {
  payslip: PayslipPreviewData
  onDownload: () => void
  onEmail: () => void
  onPrint: () => void
}

export default function PayslipPreview({ 
  payslip, 
  onDownload, 
  onEmail, 
  onPrint 
}: PayslipPreviewProps) {
  const formatCurrency = (amount: number) => {
    const value = amount || 0
    return `KSh ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payslip Preview</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={onEmail}>
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Payslip Content */}
      <Card className="print:shadow-none print:border-0">
        <CardHeader className="space-y-4 print:pb-4">
          {/* Company Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold">{payslip.companyName}</h2>
                <p className="text-sm text-gray-600">{payslip.companyAddress}</p>
                <p className="text-sm text-gray-600">
                  {payslip.companyPhone} • {payslip.companyEmail}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {payslip.payslipNumber}
              </Badge>
              <p className="text-sm font-medium">Pay Period: {payslip.payPeriod}</p>
              <p className="text-sm text-gray-600">Issued: {formatDate(payslip.issueDate)}</p>
            </div>
          </div>

          <Separator />

          {/* Employee Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Employee Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{payslip.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">KRA PIN:</span>
                  <span className="font-mono">{payslip.kraPin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">National ID:</span>
                  <span>{payslip.nationalId}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Bank Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-medium">{payslip.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Branch:</span>
                  <span>{payslip.bankBranch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-mono">{payslip.bankAccount}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Working Days Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">Working Days</p>
              <p className="font-bold">{payslip.workingDays}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Days Worked</p>
              <p className="font-bold">{payslip.actualDays}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Overtime Hours</p>
              <p className="font-bold">{payslip.overtimeHours}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Holiday Hours</p>
              <p className="font-bold">{payslip.holidayHours}</p>
            </div>
          </div>

          {/* Earnings and Deductions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Earnings */}
            <div>
              <h3 className="font-semibold text-green-700 mb-4">Earnings</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Basic Pay</span>
                  <span className="font-medium">{formatCurrency(payslip.basicPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allowances</span>
                  <span className="font-medium">{formatCurrency(payslip.allowancesPay)}</span>
                </div>
                {payslip.overtimePay > 0 && (
                  <div className="flex justify-between">
                    <span>Overtime Pay</span>
                    <span className="font-medium">{formatCurrency(payslip.overtimePay)}</span>
                  </div>
                )}
                {payslip.holidayPay > 0 && (
                  <div className="flex justify-between">
                    <span>Holiday Pay</span>
                    <span className="font-medium">{formatCurrency(payslip.holidayPay)}</span>
                  </div>
                )}
                {payslip.bonuses > 0 && (
                  <div className="flex justify-between">
                    <span>Bonuses</span>
                    <span className="font-medium">{formatCurrency(payslip.bonuses)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-green-800">
                  <span>Gross Pay</span>
                  <span>{formatCurrency(payslip.grossPay)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="font-semibold text-red-700 mb-4">Deductions</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>PAYE Tax</span>
                  <span className="font-medium">{formatCurrency(payslip.payeTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>NSSF (Employee)</span>
                  <span className="font-medium">{formatCurrency(payslip.nssfEmployee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SHIF</span>
                  <span className="font-medium">{formatCurrency(payslip.shifDeduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Housing Levy</span>
                  <span className="font-medium">{formatCurrency(payslip.housingLevy)}</span>
                </div>
                {payslip.loanDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Loan Deductions</span>
                    <span className="font-medium">{formatCurrency(payslip.loanDeductions)}</span>
                  </div>
                )}
                {payslip.advanceDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Advance Deductions</span>
                    <span className="font-medium">{formatCurrency(payslip.advanceDeductions)}</span>
                  </div>
                )}
                {payslip.otherDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Other Deductions</span>
                    <span className="font-medium">{formatCurrency(payslip.otherDeductions)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-red-800">
                  <span>Total Deductions</span>
                  <span>{formatCurrency(payslip.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="p-6 bg-blue-100 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-blue-800">Net Pay</span>
              <span className="text-3xl font-bold text-blue-900">
                {formatCurrency(payslip.netPay)}
              </span>
            </div>
          </div>

          {/* YTD Summary */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-4">Year-to-Date Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">YTD Gross Pay</p>
                <p className="font-bold">{formatCurrency(payslip.ytdGrossPay)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">YTD PAYE Tax</p>
                <p className="font-bold">{formatCurrency(payslip.ytdPayeTax)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">YTD NSSF</p>
                <p className="font-bold">{formatCurrency(payslip.ytdNssf)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">YTD SHIF</p>
                <p className="font-bold">{formatCurrency(payslip.ytdShif)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">YTD Housing Levy</p>
                <p className="font-bold">{formatCurrency(payslip.ytdHousingLevy)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">YTD Net Pay</p>
                <p className="font-bold text-blue-800">{formatCurrency(payslip.ytdNetPay)}</p>
              </div>
            </div>
          </div>

          {/* Employer Contributions */}
          <div>
            <h3 className="font-semibold text-purple-700 mb-4">
              Employer Contributions (Not deducted from employee)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-purple-600">NSSF (Employer)</p>
                <p className="font-bold text-purple-800">{formatCurrency(payslip.nssfEmployer)}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-purple-600">Housing Levy (Employer)</p>
                <p className="font-bold text-purple-800">{formatCurrency(payslip.housingLevyEmployer)}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t text-center text-sm text-gray-500">
            <p>This payslip is computer generated and does not require a signature.</p>
            <p>For any queries, please contact the HR department.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}