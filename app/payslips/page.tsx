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

interface PayslipData {
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
  
  const [payslips, setPayslips] = useState<PayslipData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    loadPayslips()
  }, [])

  const loadPayslips = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/payslips')
      
      if (!response.ok) {
        throw new Error('Failed to fetch payslips')
      }
      
      const data = await response.json()
      setPayslips(data)
    } catch (error) {
      console.error('Error loading payslips:', error)
      showToast('Failed to load payslips', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewPayslip = async (payslip: PayslipData) => {
    try {
      const response = await fetch(`/api/payslips/${payslip.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch payslip details')
      }
      
      const detailedPayslip = await response.json()
      setSelectedPayslip(detailedPayslip)
      setIsPreviewOpen(true)
    } catch (error) {
      console.error('Error loading payslip details:', error)
      showToast('Failed to load payslip details', 'error')
    }
  }

  const handleDownloadPayslip = async (payslipId: string) => {
    try {
      showToast('Generating PDF...', 'info')
      
      const response = await fetch(`/api/payslips/${payslipId}/pdf`, {
        method: 'GET',
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      // Create a blob from the PDF stream
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payslip-${payslipId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showToast('Payslip downloaded successfully', 'success')
    } catch (error) {
      console.error('Error downloading payslip:', error)
      showToast('Failed to download payslip', 'error')
    }
  }

  const handleEmailPayslip = async (payslipId: string) => {
    try {
      showToast('Sending email...', 'info')
      
      const response = await fetch(`/api/payslips/${payslipId}/email`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to send email')
      }
      
      showToast('Payslip emailed successfully', 'success')
    } catch (error) {
      console.error('Error sending email:', error)
      showToast('Failed to send email', 'error')
    }
  }

  const handleBulkDownload = async () => {
    try {
      showToast('Generating bulk download...', 'info')
      
      const response = await fetch('/api/payslips/bulk-download', {
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
      showToast('Failed to generate bulk download', 'error')
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
        <PayslipTable
          payslips={payslips}
          onView={handleViewPayslip}
          onDownload={handleDownloadPayslip}
          onEmail={handleEmailPayslip}
          isLoading={isLoading}
        />

        {/* Payslip Preview Modal */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payslip Preview</DialogTitle>
            </DialogHeader>
            {selectedPayslip && (
              <PayslipPreview
                payslip={selectedPayslip}
                onDownload={() => handleDownloadPayslip(selectedPayslip.id)}
                onEmail={() => handleEmailPayslip(selectedPayslip.id)}
                onPrint={() => window.print()}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}