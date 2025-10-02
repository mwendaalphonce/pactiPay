// src/app/demo/page.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Sample data for demonstration
const sampleEmployees = [
  {
    id: '1',
    name: 'John Kamau Mwangi',
    kraPin: 'A012345678M',
    nationalId: '12345678',
    bankName: 'Equity Bank',
    bankBranch: 'Westlands',
    bankAccount: '0123456789',
    basicSalary: 50000,
    allowances: 15000,
    startDate: '2023-01-15',
    contractType: 'PERMANENT' as const,
    isActive: true,
    createdAt: '2023-01-15'
  },
  {
    id: '2',
    name: 'Grace Wanjiku Njoroge',
    kraPin: 'A098765432W',
    nationalId: '87654321',
    bankName: 'KCB Bank',
    bankBranch: 'Karen',
    bankAccount: '9876543210',
    basicSalary: 75000,
    allowances: 20000,
    startDate: '2022-08-20',
    contractType: 'PERMANENT' as const,
    isActive: true,
    createdAt: '2022-08-20'
  }
]

const samplePayslips = [
  {
    id: '1',
    payslipNumber: 'PSL-2025-09-00001',
    employeeId: '1',
    employeeName: 'John Kamau Mwangi',
    kraPin: 'A012345678M',
    payPeriod: 'September 2025',
    monthYear: '2025-09',
    grossPay: 65000,
    totalDeductions: 18500,
    netPay: 46500,
    issueDate: '2025-09-30',
    pdfGenerated: true,
    status: 'PROCESSED' as const
  }
]

const sampleDashboardStats = {
  totalEmployees: 25,
  activeEmployees: 23,
  totalPayroll: 1250000,
  payslipsGenerated: 23,
  pendingPayrolls: 2,
  lastPayrollDate: 'September 30, 2025',
  monthlyGrowth: 5.2,
  complianceStatus: 'good' as const
}

const sampleActivities = [
  {
    id: '1',
    type: 'payroll_processed' as const,
    description: 'Processed payroll for John Kamau Mwangi - September 2025',
    timestamp: '2025-09-30T14:30:00',
    user: 'System Admin'
  },
  {
    id: '2',
    type: 'employee_added' as const,
    description: 'Added new employee: Grace Wanjiku Njoroge',
    timestamp: '2025-09-29T10:15:00',
    user: 'HR Manager'
  }
]

export default function DemoPage() {
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Mock handlers
  const mockHandlers = {
    onSave: async (data: any) => {
      console.log('Save:', data)
      alert('Demo: Data would be saved')
    },
    onEdit: (employee: any) => {
      console.log('Edit:', employee)
      alert(`Demo: Edit ${employee.name}`)
    },
    onDelete: (id: string) => {
      console.log('Delete:', id)
      alert(`Demo: Delete employee ${id}`)
    },
    onView: (item: any) => {
      console.log('View:', item)
      alert('Demo: View details')
    },
    onDownload: (id: string) => {
      console.log('Download:', id)
      alert('Demo: Download PDF')
    },
    onEmail: (id: string) => {
      console.log('Email:', id)
      alert('Demo: Email sent')
    },
    onAction: (action: string) => {
      console.log('Action:', action)
      alert(`Demo: ${action} action`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="font-bold text-xl text-gray-900">
                🇰🇪 Kenya Payroll System - Component Demo
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Interactive Component Showcase
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Component Showcase
          </h2>
          <p className="text-gray-600">
            Interactive demonstration of all Kenya Payroll System UI components
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Dashboard Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Dashboard Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600">Total Employees</p>
                      <p className="text-2xl font-bold text-blue-900">{sampleDashboardStats.totalEmployees}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">Monthly Payroll</p>
                      <p className="text-2xl font-bold text-green-900">
                        KSh {sampleDashboardStats.totalPayroll.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600">Payslips Generated</p>
                      <p className="text-2xl font-bold text-purple-900">{sampleDashboardStats.payslipsGenerated}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-orange-600">Pending Actions</p>
                      <p className="text-2xl font-bold text-orange-900">{sampleDashboardStats.pendingPayrolls}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { title: 'Add Employee', color: 'bg-blue-500' },
                      { title: 'Run Payroll', color: 'bg-green-500' },
                      { title: 'View Payslips', color: 'bg-purple-500' },
                      { title: 'Download Reports', color: 'bg-orange-500' },
                      { title: 'View Reports', color: 'bg-indigo-500' },
                      { title: 'Settings', color: 'bg-gray-500' }
                    ].map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => mockHandlers.onAction(action.title)}
                      >
                        <div className={`p-2 rounded-lg ${action.color} text-white w-8 h-8`}></div>
                        <span className="text-sm">{action.title}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {sampleActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Employee List</h3>
                    <Button onClick={() => mockHandlers.onAction('Add Employee')}>
                      Add Employee
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">KRA PIN</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Basic Salary</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sampleEmployees.map((employee) => (
                          <tr key={employee.id}>
                            <td className="px-4 py-3 text-sm">{employee.name}</td>
                            <td className="px-4 py-3 text-sm font-mono">{employee.kraPin}</td>
                            <td className="px-4 py-3 text-sm">
                              KSh {employee.basicSalary.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => mockHandlers.onEdit(employee)}>
                                  Edit
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => mockHandlers.onView(employee)}>
                                  View
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Calculator Demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Employee</label>
                    <select className="w-full p-2 border rounded-md mt-1">
                      <option>John Kamau Mwangi - KSh 65,000</option>
                      <option>Grace Wanjiku Njoroge - KSh 95,000</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pay Period</label>
                    <select className="w-full p-2 border rounded-md mt-1">
                      <option>September 2025</option>
                      <option>October 2025</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Working Days', value: '22' },
                    { label: 'Overtime Hours', value: '5' },
                    { label: 'Holiday Hours', value: '2' },
                    { label: 'Bonuses (KSh)', value: '5000' }
                  ].map((input, index) => (
                    <div key={index}>
                      <label className="text-sm font-medium">{input.label}</label>
                      <input 
                        type="number" 
                        defaultValue={input.value}
                        className="w-full p-2 border rounded-md mt-1" 
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Earnings */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-green-700">Earnings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Basic Pay</span>
                        <span className="font-medium">KSh 50,000.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allowances</span>
                        <span className="font-medium">KSh 15,000.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime Pay</span>
                        <span className="font-medium">KSh 3,500.00</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold text-green-800">
                        <span>Gross Pay</span>
                        <span>KSh 68,500.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-red-700">Deductions</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>PAYE Tax</span>
                        <span className="font-medium">KSh 12,845.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>NSSF</span>
                        <span className="font-medium">KSh 4,110.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SHIF</span>
                        <span className="font-medium">KSh 1,883.75</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Housing Levy</span>
                        <span className="font-medium">KSh 1,027.50</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold text-red-800">
                        <span>Total Deductions</span>
                        <span>KSh 19,866.25</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-100 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold text-blue-800">Net Pay</span>
                    <span className="text-3xl font-bold text-blue-900">KSh 48,633.75</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => mockHandlers.onAction('Calculate')}>
                    Recalculate
                  </Button>
                  <Button onClick={() => mockHandlers.onSave({})}>
                    Save Payroll
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payslips Tab */}
          <TabsContent value="payslips" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payslips Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Payslip #</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Employee</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Period</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Net Pay</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {samplePayslips.map((payslip) => (
                          <tr key={payslip.id}>
                            <td className="px-4 py-3 text-sm font-mono">{payslip.payslipNumber}</td>
                            <td className="px-4 py-3 text-sm">{payslip.employeeName}</td>
                            <td className="px-4 py-3 text-sm">{payslip.payPeriod}</td>
                            <td className="px-4 py-3 text-sm font-bold text-green-600">
                              KSh {payslip.netPay.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => mockHandlers.onView(payslip)}>
                                  View
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => mockHandlers.onDownload(payslip.id)}>
                                  PDF
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => mockHandlers.onEmail(payslip.id)}>
                                  Email
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forms Tab */}
          <TabsContent value="forms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Form Demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g., John Kamau Mwangi"
                      className="w-full p-2 border rounded-md mt-1" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">KRA PIN *</label>
                    <input 
                      type="text" 
                      placeholder="A123456789Z"
                      maxLength={11}
                      className="w-full p-2 border rounded-md mt-1" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">National ID *</label>
                    <input 
                      type="text" 
                      placeholder="12345678"
                      className="w-full p-2 border rounded-md mt-1" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Bank Name *</label>
                    <select className="w-full p-2 border rounded-md mt-1">
                      <option>Select bank</option>
                      <option>Equity Bank</option>
                      <option>KCB Bank</option>
                      <option>Cooperative Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Basic Salary (KSh) *</label>
                    <input 
                      type="number" 
                      placeholder="50000"
                      min="15201"
                      className="w-full p-2 border rounded-md mt-1" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Allowances (KSh)</label>
                    <input 
                      type="number" 
                      placeholder="15000"
                      className="w-full p-2 border rounded-md mt-1" 
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={() => mockHandlers.onSave({})}>Save Employee</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}