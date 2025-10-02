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
  Edit, 
  Trash2, 
  Eye, 
  UserPlus,
  Download,
  Filter
} from 'lucide-react'

interface Employee {
  id: string
  name: string
  kraPin: string
  nationalId: string
  bankName: string
  bankBranch: string
  bankAccount: string
  basicSalary: number
  allowances: number
  startDate: string
  contractType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'CASUAL'
  isActive: boolean
  createdAt: string
}

interface EmployeeTableProps {
  employees: Employee[]
  onEdit: (employee: Employee) => void
  onDelete: (employeeId: string) => void
  onView: (employee: Employee) => void
  onAddNew: () => void
  isLoading?: boolean
}

const contractTypeColors = {
  PERMANENT: 'bg-green-100 text-green-800',
  CONTRACT: 'bg-blue-100 text-blue-800',
  TEMPORARY: 'bg-yellow-100 text-yellow-800',
  CASUAL: 'bg-gray-100 text-gray-800'
}

const contractTypeLabels = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  TEMPORARY: 'Temporary',
  CASUAL: 'Casual'
}

export default function EmployeeTable({ 
  employees, 
  onEdit, 
  onDelete, 
  onView, 
  onAddNew,
  isLoading = false 
}: EmployeeTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [contractFilter, setContractFilter] = useState<string>('all')

  // Filter employees based on search and contract type
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.kraPin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.nationalId.includes(searchTerm)

    const matchesContract = contractFilter === 'all' || employee.contractType === contractFilter

    return matchesSearch && matchesContract && employee.isActive
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
            <CardTitle className="text-2xl">Employees</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Manage your workforce and employee information
            </p>
          </div>
          <Button onClick={onAddNew} className="shrink-0">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, KRA PIN, or National ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {contractFilter === 'all' ? 'All Types' : contractTypeLabels[contractFilter as keyof typeof contractTypeLabels]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setContractFilter('all')}>
                All Contract Types
              </DropdownMenuItem>
              {Object.entries(contractTypeLabels).map(([value, label]) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setContractFilter(value)}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Total Employees</p>
            <p className="text-2xl font-bold text-blue-900">{employees.filter(e => e.isActive).length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600">Permanent</p>
            <p className="text-2xl font-bold text-green-900">
              {employees.filter(e => e.contractType === 'PERMANENT' && e.isActive).length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600">Contract</p>
            <p className="text-2xl font-bold text-yellow-900">
              {employees.filter(e => e.contractType === 'CONTRACT' && e.isActive).length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600">Total Payroll</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(
                employees
                  .filter(e => e.isActive)
                  .reduce((sum, emp) => sum + emp.basicSalary + emp.allowances, 0)
              )}
            </p>
          </div>
        </div>

        {/* Employee Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>KRA PIN</TableHead>
                <TableHead>Contract Type</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Gross Salary</TableHead>
                <TableHead>Bank Details</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-gray-500">
                      {searchTerm || contractFilter !== 'all' ? (
                        <>
                          <p>No employees match your search criteria.</p>
                          <Button
                            variant="link"
                            onClick={() => {
                              setSearchTerm('')
                              setContractFilter('all')
                            }}
                            className="mt-2"
                          >
                            Clear filters
                          </Button>
                        </>
                      ) : (
                        <>
                          <p>No employees found.</p>
                          <Button onClick={onAddNew} variant="link" className="mt-2">
                            Add your first employee
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-gray-500">ID: {employee.nationalId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {employee.kraPin}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={contractTypeColors[employee.contractType]}>
                        {contractTypeLabels[employee.contractType]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(employee.basicSalary)}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(employee.basicSalary + employee.allowances)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{employee.bankName}</p>
                        <p className="text-gray-500">{employee.bankBranch}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(employee.startDate)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(employee)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(employee)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(employee.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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

        {/* Table Footer with Pagination Info */}
        {filteredEmployees.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <p>
              Showing {filteredEmployees.length} of {employees.filter(e => e.isActive).length} employees
            </p>
            {(searchTerm || contractFilter !== 'all') && (
              <p>
                Filtered results • 
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchTerm('')
                    setContractFilter('all')
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