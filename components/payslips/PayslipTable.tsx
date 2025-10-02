'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Search, 
  MoreHorizontal, 
  Download, 
  Eye, 
  FileText,
  Calendar,
  Filter,
  Mail
} from 'lucide-react'

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

interface PayslipTableProps {
  payslips?: PayslipData[]
  onView: (payslip: PayslipData) => void
  onDownload: (payslipId: string) => void
  onEmail: (payslipId: string) => void
  isLoading?: boolean
}

export default function PayslipTable({ 
  payslips = [], 
  onView, 
  onDownload, 
  onEmail,
  isLoading = false 
}: PayslipTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState('all')

  // Ensure payslips is always an array
  const safePayslips = Array.isArray(payslips) ? payslips : []

  // Get unique periods for filtering
  const uniquePeriods = Array.from(new Set(safePayslips.map(p => p.payPeriod)))

  // Filter payslips
  const filteredPayslips = safePayslips.filter(payslip => {
    const matchesSearch = 
      payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.kraPin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.payslipNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPeriod = periodFilter === 'all' || payslip.payPeriod === periodFilter

    return matchesSearch && matchesPeriod
  })

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl">Payslips</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              View and manage employee payslips
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by employee name, KRA PIN, or payslip number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {periodFilter === 'all' ? 'All Periods' : periodFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPeriodFilter('all')}>
                All Pay Periods
              </DropdownMenuItem>
              {uniquePeriods.map((period) => (
                <DropdownMenuItem
                  key={period}
                  onClick={() => setPeriodFilter(period)}
                >
                  {period}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Total Payslips</p>
            <p className="text-2xl font-bold text-blue-900">{safePayslips.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600">Total Gross Pay</p>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(safePayslips.reduce((sum, p) => sum + p.grossPay, 0))}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600">Total Net Pay</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(safePayslips.reduce((sum, p) => sum + p.netPay, 0))}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600">PDFs Generated</p>
            <p className="text-2xl font-bold text-orange-900">
              {safePayslips.filter(p => p.pdfGenerated).length}
            </p>
          </div>
        </div>

        {/* Payslip Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payslip Number</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Pay Period</TableHead>
                <TableHead>Gross Pay</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 9 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-gray-500">
                      {searchTerm || periodFilter !== 'all' ? (
                        <>
                          <p>No payslips match your search criteria.</p>
                          <Button
                            variant="link"
                            onClick={() => {
                              setSearchTerm('')
                              setPeriodFilter('all')
                            }}
                            className="mt-2"
                          >
                            Clear filters
                          </Button>
                        </>
                      ) : (
                        <p>No payslips found. Run payroll to generate payslips.</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {payslip.payslipNumber}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payslip.employeeName}</p>
                        <p className="text-sm text-gray-500 font-mono">{payslip.kraPin}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {payslip.payPeriod}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payslip.grossPay)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      -{formatCurrency(payslip.totalDeductions)}
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatCurrency(payslip.netPay)}
                    </TableCell>
                    <TableCell>{formatDate(payslip.issueDate)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge 
                          className={payslip.status === 'PROCESSED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'}
                        >
                          {payslip.status}
                        </Badge>
                        {payslip.pdfGenerated && (
                          <Badge variant="outline" className="text-xs">
                            PDF Ready
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(payslip)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDownload(payslip.id)}
                            disabled={!payslip.pdfGenerated}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onEmail(payslip.id)}
                            disabled={!payslip.pdfGenerated}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Email to Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer */}
        {filteredPayslips.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <p>
              Showing {filteredPayslips.length} of {safePayslips.length} payslips
            </p>
            {(searchTerm || periodFilter !== 'all') && (
              <p>
                Filtered results • 
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchTerm('')
                    setPeriodFilter('all')
                  }}
                  className="p-0 h-auto ml-1 text-blue-600"
                >
                  Clear filters
                </Button>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}