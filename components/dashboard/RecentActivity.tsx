'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Clock, 
  UserPlus, 
  Calculator, 
  FileText, 
  Edit,
  Trash2
} from 'lucide-react'

interface Activity {
  id: string
  type: 'employee_added' | 'payroll_processed' | 'payslip_generated' | 'employee_edited' | 'employee_deleted'
  description: string
  timestamp: string
  user?: string
  metadata?: Record<string, null>
}

interface RecentActivityProps {
  activities: Activity[]
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: Activity['type']) => {
    const iconClass = "w-4 h-4"
    switch (type) {
      case 'employee_added':
        return <UserPlus className={`${iconClass} text-green-600`} />
      case 'payroll_processed':
        return <Calculator className={`${iconClass} text-blue-600`} />
      case 'payslip_generated':
        return <FileText className={`${iconClass} text-purple-600`} />
      case 'employee_edited':
        return <Edit className={`${iconClass} text-yellow-600`} />
      case 'employee_deleted':
        return <Trash2 className={`${iconClass} text-red-600`} />
      default:
        return <Clock className={`${iconClass} text-gray-600`} />
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'employee_added':
        return 'bg-green-100 text-green-800'
      case 'payroll_processed':
        return 'bg-blue-100 text-blue-800'
      case 'payslip_generated':
        return 'bg-purple-100 text-purple-800'
      case 'employee_edited':
        return 'bg-yellow-100 text-yellow-800'
      case 'employee_deleted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm">Activity will appear here as you use the system</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getActivityColor(activity.type)}>
                      {activity.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
                {activity.user && (
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {activity.user.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
