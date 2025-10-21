// src/components/dashboard/PayrollSummary.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { be } from 'zod/v4/locales'
import Link from 'next/link'

interface PayrollSummaryData {
  currentMonth: string
  totalEmployees: number
  processedEmployees: number
  totalGrossPay: number
  totalNetPay: number
  totalDeductions: number
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  dueDate?: string
  lastProcessedDate?: string
}

interface PayrollSummaryProps {
  data: PayrollSummaryData
  onStartPayroll: () => void
  onViewDetails: () => void
}

export default function PayrollSummary({ 
  data, 
  onStartPayroll, 
  onViewDetails 
}: PayrollSummaryProps) {
  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  const getStatusIcon = () => {
    switch (data.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = () => {
    switch (data.status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = () => {
    switch (data.status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      case 'overdue':
        return 'Overdue'
      default:
        return 'Not Started'
    }
  }

  const completionPercentage = data.totalEmployees > 0 
    ? (data.processedEmployees / data.totalEmployees) * 100 
    : 0

 const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Payroll Summary - {data.currentMonth}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {getStatusLabel()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{data.processedEmployees} of {data.totalEmployees} employees</span>
          </div>
          <Progress value={completionPercentage} className="w-full" />
          <p className="text-xs text-muted-foreground">
            {completionPercentage.toFixed(0)}% complete
          </p>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Gross Pay</span>
            </div>
            <p className="text-xl font-bold text-green-900">
              {formatCurrency(data.totalGrossPay)}
            </p>
          </div>

          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-red-800">Deductions</span>
            </div>
            <p className="text-xl font-bold text-red-900">
              {formatCurrency(data.totalDeductions)}
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-blue-800">Net Pay</span>
            </div>
            <p className="text-xl font-bold text-blue-900">
              {formatCurrency(data.totalNetPay)}
            </p>
          </div>
        </div>

        {/* Important Dates */}
        {(data.dueDate || data.lastProcessedDate) && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Important Dates</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {data.dueDate && (
                <p>Due Date: {new Date(data.dueDate).toLocaleDateString('en-KE')}</p>
              )}
              {data.lastProcessedDate && (
                <p>Last Processed: {new Date(data.lastProcessedDate).toLocaleDateString('en-KE')}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {data.status === 'not_started' && (
            <Button className="flex-1"
             onClick={() => router.push("/payroll")}
            >
              
              Start Payroll Processing
            </Button>
          )}
          {data.status === 'in_progress' && (
            <Button onClick={onViewDetails} variant="outline" className="flex-1 ">
              Continue Processing
            </Button>
          )}
          {data.status === 'completed' && (
           <Button
            variant="outline"
            onClick={() => router.push("/payslips")}
            className="flex-1"
          >
            View Payroll Details
          </Button>
          )}
          {data.status === 'overdue' && (
            <Button onClick={onStartPayroll} variant="destructive" className="flex-1">
              Process Overdue Payroll
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}