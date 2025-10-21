'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  UserPlus, 
  Calculator, 
  FileText, 
  Download,
  Settings,
  BarChart3
} from 'lucide-react'

interface QuickActionsProps {
  onAddEmployee: () => void
 
  onViewPayslips: () => void
  onDownloadReports: (reportType: 'monthly_payroll' | 'employee_summary' | 'statutory_deductions' | 'p10') => void
  
  onViewReports: () => void
}

export default function QuickActions({ 
  onAddEmployee,
  
  onViewPayslips,
  onDownloadReports,
  
  onViewReports
}: QuickActionsProps) {
  const actions = [
    {
      title: 'Add Employee',
      icon: UserPlus,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: onAddEmployee
    },

    {
      title: 'View Payslips',
      icon: FileText,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: onViewPayslips
    },
    
    {
      title: 'View Reports',
      icon: BarChart3,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      onClick: onViewReports
    },
   
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
                onClick={action.onClick}
              >
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}