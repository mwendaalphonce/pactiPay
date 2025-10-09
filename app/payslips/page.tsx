'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import PayslipTable from '@/components/payslips/PayslipTable'
import PayslipPreview from '@/components/payslips/PayslipPreview'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Mail, Filter } from 'lucide-react'
import { useToast } from "../providers"

interface PayrollRun {
  id: string
  employeeId: string
  monthYear: string
  basicSalary: number
  allowances: number
  overtime: number
  overtimeHours: number
  bonuses: number
  bonusDescription: string | null
  grossPay: number
  nssf: number
  shif: number
  housingLevy: number
  paye: number
  customDeductions: number
  customDeductionDescription: string | null
  totalDeductions: number
  netPay: number
  payDate: string
  processedDate: string
  status: string
  employee: {
    id: string
    name: string
    kraPin: string
    email: string
    employeeNumber: string | null
  }
}

interface PayslipTableData {
  id: string
  payslipNumber: string
  employeeId: string
  employeeName: string
  kraPin: string
  payPeriod: string
  monthYear: string
  grossPay: number
  totalDeductions: number
  netPay: number
  issueDate: string
  pdfGenerated: boolean
  status: 'PROCESSED' | 'CANCELLED'
}

export default function PayslipsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [payslips, setPayslips] = useState<PayslipTableData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    loadPayslips()
  }, [])

  const loadPayslips = async () => {
    try {
      setIsLoading(true)
      
      // Fetch from your payroll API endpoint
      const response = await fetch('/api/payroll')
      
      if (!response.ok) {
        throw new Error('Failed to fetch payslips')
      }
      
      const result = await response.json()
      
      // Check if the response has the expected structure
      if (!result.success || !result.data) {
        throw new Error('Invalid response structure')
      }

      // Transform PayrollRun data to PayslipTableData format
      const transformedPayslips: PayslipTableData[] = result.data.map((run: PayrollRun) => ({
        id: run.id,
        payslipNumber: `PS-${run.monthYear}-${run.employee.employeeNumber || run.employeeId.slice(0, 6)}`,
        employeeId: run.employeeId,
        employeeName: run.employee.name,
        kraPin: run.employee.kraPin,
        payPeriod: getMonthYearDisplay(run.monthYear),
        monthYear: run.monthYear,
        grossPay: run.grossPay,
        totalDeductions: run.totalDeductions,
        netPay: run.netPay,
        issueDate: run.processedDate,
        pdfGenerated: true, // Assume all processed payslips can generate PDFs
        status: run.status as 'PROCESSED' | 'CANCELLED'
      }))

      setPayslips(transformedPayslips)
    } catch (error) {
      console.error('Error loading payslips:', error)
      showToast('Failed to load payslips', 'error')
      setPayslips([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  const getMonthYearDisplay = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })
  }

 const handleViewPayslip = (payslip: PayslipTableData) => {
    // Navigate to payslip detail page
    router.push(`/payslips/${payslip.id}`)
  }

  const handleDownloadPayslip = async (payslipId: string) => {
    try {
      showToast('Generating PDF...', 'info')
      
      const response = await fetch(`/api/payroll/${payslipId}/pdf`, {
        method: 'GET',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to generate PDF')
      }
      
      // Create a blob from the PDF stream
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Find the payslip to get a better filename
      const payslip = payslips.find(p => p.id === payslipId)
      const filename = payslip 
        ? `payslip-${payslip.monthYear}-${payslip.employeeName.replace(/\s+/g, '-')}.pdf`
        : `payslip-${payslipId}.pdf`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showToast('Payslip downloaded successfully', 'success')
    } catch (error) {
      console.error('Error downloading payslip:', error)
      showToast(error instanceof Error ? error.message : 'Failed to download payslip', 'error')
    }
  }

  const handleEmailPayslip = async (payslipId: string) => {
    try {
      showToast('Sending email...', 'info')
      
      const response = await fetch(`/api/payroll/${payslipId}/email`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to send email')
      }
      
      const result = await response.json()
      showToast(result.message || 'Payslip emailed successfully', 'success')
    } catch (error) {
      console.error('Error sending email:', error)
      showToast(error instanceof Error ? error.message : 'Failed to send email', 'error')
    }
  }

  const handleBulkDownload = async () => {
    try {
      showToast('Generating bulk download...', 'info')
      
      const response = await fetch('/api/payroll/bulk-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payslipIds: payslips.map(p => p.id)
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate bulk download')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payslips-bulk-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showToast('Bulk download completed', 'success')
    } catch (error) {
      console.error('Error with bulk download:', error)
      showToast('Bulk download not available yet', 'error')
    }
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleBulkDownload}
        disabled={payslips.length === 0}
      >
        <Download className="w-4 h-4 mr-2" />
        Bulk Download
      </Button>
      <Button variant="outline" size="sm">
        <Filter className="w-4 h-4 mr-2" />
        Filter
      </Button>
    </div>
  )

  return (
    <AppLayout
      title="Payslips Management"
      subtitle="View, download, and manage employee payslips"
      headerActions={headerActions}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading payslips...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && payslips.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No payslips found</p>
            <Button onClick={() => router.push('/payroll/run')}>
              Generate Payroll
            </Button>
          </div>
        )}

        {/* Payslips Table */}
        {!isLoading && payslips.length > 0 && (
          <PayslipTable
            payslips={payslips}
            onView={handleViewPayslip}
            onDownload={handleDownloadPayslip}
            onEmail={handleEmailPayslip}
            isLoading={isLoading}
          />
        )}

        {/* Payslip Preview Modal */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payslip Preview</DialogTitle>
            </DialogHeader>
            {selectedPayslip && (
              <PayslipPreview
                payslip={selectedPayslip}
                onDownload={() => handleDownloadPayslip(selectedPayslip.payrollRun.id)}
                onEmail={() => handleEmailPayslip(selectedPayslip.payrollRun.id)}
                onPrint={() => window.print()}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}