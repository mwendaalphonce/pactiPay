// src/app/employees/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import EmployeeTable from '@/components/employees/EmployeeTable'
import EmployeeForm from '@/components/employees/EmployeeForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { UserPlus, Download, Upload } from 'lucide-react'
import { Employee, EmployeeFormData } from '@/types'
import { useToast } from '../providers' 

const ITEMS_PER_PAGE = 10

export default function EmployeesPage() {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Load employees data
  useEffect(() => {
    loadEmployees()
  }, [currentPage])

  const loadEmployees = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/employees?isActive=true&page=${currentPage}&limit=${ITEMS_PER_PAGE}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }
      
      const result = await response.json()
      
      // Handle the API response structure: { success: true, data: [...] }
      if (result.success && result.data) {
        setEmployees(result.data)
        
        // Set total count if provided by API
        if (result.pagination?.total) {
          setTotalCount(result.pagination.total)
        }
      } else {
        throw new Error(result.message || 'Failed to load employees')
      }
    } catch (error) {
      console.error('Error loading employees:', error)
      showToast(error instanceof Error ? error.message : 'Failed to load employees', 'error')
      setEmployees([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle add new employee
  const handleAddEmployee = () => {
    setSelectedEmployee(null)
    setIsFormOpen(true)
  }

  // Handle edit employee
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsFormOpen(true)
  }

  // Handle view employee details
  const handleViewEmployee = (employee: Employee) => {
    router.push(`/employees/${employee.id}`)
  }

  // Handle save employee (create or update)
  const handleSaveEmployee = async (formData: EmployeeFormData) => {
    setIsSubmitting(true)
    
    try {
      const url = '/api/employees'
      const method = selectedEmployee ? 'PUT' : 'POST'
      const body = selectedEmployee 
        ? JSON.stringify({ ...formData, id: selectedEmployee.id })
        : JSON.stringify(formData)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to save employee')
      }

      const savedEmployee = result.data

      if (selectedEmployee) {
        // Update existing employee in state
        setEmployees(prev => 
          prev.map(emp => emp.id === selectedEmployee.id ? savedEmployee : emp)
        )
        showToast(`Employee ${formData.name} updated successfully`, 'success')
      } else {
        // Add new employee - reload to update pagination
        showToast(`Employee ${formData.name} added successfully`, 'success')
        await loadEmployees()
      }

      setIsFormOpen(false)
      setSelectedEmployee(null)
    } catch (error: unknown) {
      console.error('Error saving employee:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save employee'
      showToast(errorMessage, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete employee
  const handleDeleteEmployee = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) return

    try {
      const response = await fetch(`/api/employees/${employeeId}`, { 
        method: 'DELETE' 
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to delete employee')
      }

      // Reload employees to update pagination
      showToast(result.message || `Employee ${employee.name} deactivated successfully`, 'success')
      setDeleteConfirmId(null)
      await loadEmployees()
    } catch (error: unknown) {
      console.error('Error deleting employee:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete employee'
      showToast(errorMessage, 'error')
    }
  }

  // Handle export employees
  const handleExportEmployees = async () => {
    try {
      showToast('Exporting employees data...', 'info')
      
      // Fetch all employees for export (without pagination)
      const response = await fetch('/api/employees?isActive=true&limit=10000')
      const result = await response.json()
      const allEmployees = result.success ? result.data : employees
      
      // Create CSV from current employees data
      const csvHeaders = [
        'Name',
        'KRA PIN',
        'National ID',
        'Employee Number',
        'Bank Name',
        'Bank Branch',
        'Bank Account',
        'Basic Salary',
        'Allowances',
        'Start Date',
        'Contract Type',
        'Status'
      ].join(',')
      
      const csvRows = allEmployees.map((emp: Employee) => [
        emp.name,
        emp.kraPin,
        emp.nationalId,
        emp.employeeNumber || '',
        emp.bankName,
        emp.bankBranch,
        emp.bankAccount,
        emp.basicSalary,
        emp.allowances,
        new Date(emp.startDate).toLocaleDateString(),
        emp.contractType,
        emp.isActive ? 'Active' : 'Inactive'
      ].join(','))
      
      const csv = [csvHeaders, ...csvRows].join('\n')
      
      // Download the CSV
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      showToast('Employee data exported successfully', 'success')
    } catch (error) {
      console.error('Error exporting employees:', error)
      showToast('Failed to export employee data', 'error')
    }
  }

  // Handle import employees
  const handleImportEmployees = () => {
    // In real app: open file picker and handle CSV import
    showToast('Import feature coming soon', 'info')
  }

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Generate page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleImportEmployees}>
        <Upload className="w-4 h-4 mr-2" />
        Import
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportEmployees}>
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button size="sm" onClick={handleAddEmployee}>
        <UserPlus className="w-4 h-4 mr-2" />
        Add Employee
      </Button>
    </div>
  )

  return (
    <AppLayout
      title="Employee Management"
      subtitle="Manage your workforce and employee information"
      headerActions={headerActions}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Employee Table */}
        <EmployeeTable
          employees={employees}
          onEdit={handleEditEmployee}
          onDelete={setDeleteConfirmId}
          onView={handleViewEmployee}
          onAddNew={handleAddEmployee}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} employees
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Employee Form Modal */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle className="text-xl">
                {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6">
              <EmployeeForm
                employee={selectedEmployee || undefined}
                onSave={handleSaveEmployee}
                onCancel={() => setIsFormOpen(false)}
                isLoading={isSubmitting}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Employee Deactivation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Are you sure you want to deactivate this employee? The employee will be marked as inactive.
                    All payroll history will be preserved for compliance purposes.
                  </AlertDescription>
                </Alert>
                
                {(() => {
                  const employee = employees.find(emp => emp.id === deleteConfirmId)
                  return employee ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium">{employee.name}</h4>
                      <p className="text-sm text-gray-600">KRA PIN: {employee.kraPin}</p>
                      <p className="text-sm text-gray-600">
                        Basic Salary: KSh {employee.basicSalary.toLocaleString()}
                      </p>
                    </div>
                  ) : null
                })()}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteEmployee(deleteConfirmId)}
                  >
                    Deactivate Employee
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  )
}