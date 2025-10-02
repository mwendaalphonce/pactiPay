// src/components/dashboard/DashboardStats.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Calculator, 
  FileText, 
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface DashboardStatsProps {
  stats: {
    totalEmployees: number
    activeEmployees: number
    totalPayroll: number
    payslipsGenerated: number
    pendingPayrolls: number
    lastPayrollDate?: string
    monthlyGrowth: number
    complianceStatus: 'good' | 'warning' | 'error'
  }
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  const getComplianceIcon = () => {
    switch (stats.complianceStatus) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getComplianceColor = () => {
    switch (stats.complianceStatus) {
      case 'good':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Employees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEmployees}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeEmployees} active employees
          </p>
        </CardContent>
      </Card>

      {/* Monthly Payroll */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalPayroll)}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth}% from last month
          </div>
        </CardContent>
      </Card>

      {/* Payslips Generated */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payslips Generated</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.payslipsGenerated}</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>

      {/* Pending Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingPayrolls}</div>
          <p className="text-xs text-muted-foreground">
            Payrolls to process
          </p>
        </CardContent>
      </Card>

      {/* Compliance Status - Full Width */}
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {getComplianceIcon()}
            Tax Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={getComplianceColor()}>
                {stats.complianceStatus === 'good' && 'All systems compliant'}
                {stats.complianceStatus === 'warning' && 'Minor issues detected'}
                {stats.complianceStatus === 'error' && 'Action required'}
              </Badge>
              {stats.lastPayrollDate && (
                <span className="text-sm text-muted-foreground">
                  Last payroll: {stats.lastPayrollDate}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              2025 Kenya tax rates applied
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// src/components/dashboard/QuickActions.tsx
