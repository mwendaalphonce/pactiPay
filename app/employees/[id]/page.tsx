'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Edit, 
  ArrowLeft, 
  User, 
  CreditCard, 
  Calendar,
  DollarSign,
  FileText,
  Building2,
  Phone,
  Mail
} from 'lucide-react'
import { Employee } from '@/types'

export default function EmployeeDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        // In real app: const response = await fetch(`/api/employees/${employeeId}`)
        // Mock data for demo
        const mockEmployee: Employee = {
          id: employeeId,
          name: 'John Kamau Mwangi',
          kraPin: 'A012345678M',
          nationalId: '12345678',
          bankName: 'Equity Bank',
          bankBranch: 'Westlands',
          bankAccount: '0123456789',
          basicSalary: 50000,
          allowances: 15000,
          startDate: '2023-01-15',
          contractType: 'PERMANENT',
          isActive: true,
          createdAt: '2023-01-15T10:00:00Z',
          updatedAt: '2023-01-15T10:00:00Z'
        }
        
        setTimeout(() => {
          setEmployee(mockEmployee)
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Error loading employee:', error)
        setIsLoading(false)
      }
    }

    if (employeeId) {
      loadEmployee()
    }
  }, [employeeId])

  const handleEditEmployee = () => {
    router.push(`/employees/${employeeId}/edit`)
  }

  const handleBackToList = () => {
    router.push('/employees')
  }

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getContractTypeColor = (type: string) => {
    switch (type) {
      case 'PERMANENT':
        return 'bg-green-100 text-green-800'
      case 'CONTRACT':
        return 'bg-blue-100 text-blue-800'
      case 'TEMPORARY':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <AppLayout title="Employee Details" subtitle="Loading employee information...">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!employee) {
    return (
      <AppLayout title="Employee Not Found" subtitle="The requested employee could not be found">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-gray-600 mb-4">Employee not found or has been deleted.</p>
          <Button onClick={handleBackToList}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>
        </div>
      </AppLayout>
    )
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleBackToList}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to List
      </Button>
      <Button size="sm" onClick={handleEditEmployee}>
        <Edit className="w-4 h-4 mr-2" />
        Edit Employee
      </Button>
    </div>
  )

  return (
    <AppLayout
      title={employee.name}
      subtitle="Employee details and information"
      headerActions={headerActions}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Employee Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Employee Overview
              </CardTitle>
              <Badge className={getContractTypeColor(employee.contractType)}>
                {employee.contractType}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Personal Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium">{employee.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">KRA PIN:</span>
                    <span className="font-mono text-sm">{employee.kraPin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">National ID:</span>
                    <span>{employee.nationalId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span>{formatDate(employee.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Bank Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank Name:</span>
                    <span className="font-medium">{employee.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Branch:</span>
                    <span>{employee.bankBranch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Number:</span>
                    <span className="font-mono text-sm">{employee.bankAccount}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salary Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Salary Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-600 mb-1">Basic Salary</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(employee.basicSalary)}
                </p>
                <p className="text-xs text-blue-600">per month</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-green-600 mb-1">Allowances</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(employee.allowances)}
                </p>
                <p className="text-xs text-green-600">per month</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-purple-600 mb-1">Gross Salary</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(employee.basicSalary + employee.allowances)}
                </p>
                <p className="text-xs text-purple-600">per month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="text-sm">View Payslips</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Calendar className="w-6 h-6 text-green-600" />
                <span className="text-sm">Run Payroll</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Mail className="w-6 h-6 text-purple-600" />
                <span className="text-sm">Send Email</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Building2 className="w-6 h-6 text-orange-600" />
                <span className="text-sm">HR Records</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-gray-600">Employee ID:</span>
                <span className="ml-2 font-mono">{employee.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2">{formatDate(employee.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-600">Last Updated:</span>
                <span className="ml-2">{formatDate(employee.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}