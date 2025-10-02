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
import { UserPlus, Download, Upload } from 'lucide-react'
import { Employee, EmployeeFormData } from '@/types'
import { useToast } from '../providers' 

export default function EmployeesPage() {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Load employees data
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await fetch('/api/employees?isActive=true')
        
        if (!response.ok) {
          throw new Error('Failed to fetch employees')
        }
        
        const result = await response.json()
        
        // Handle the API response structure: { success: true, data: [...] }
        if (result.success && result.data) {
          setEmployees(result.data)
        } else {
          throw new Error(result.message || 'Failed to load employees')
        }
      } catch (error) {
        console.error('Error loading employees:', error)
        showToast(error instanceof Error ? error.message : 'Failed to load employees', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployees()
  }, [showToast])

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
        // Add new employee to state
        setEmployees(prev => [savedEmployee, ...prev])
        showToast(`Employee ${formData.name} added successfully`, 'success')
      }

      setIsFormOpen(false)
      setSelectedEmployee(null)
    } catch (error: any) {
      console.error('Error saving employee:', error)
      showToast(error.message || 'Failed to save employee', 'error')
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

      // Remove from state (soft delete marks as inactive)
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId))
      showToast(result.message || `Employee ${employee.name} deactivated successfully`, 'success')
      setDeleteConfirmId(null)
    } catch (error: any) {
      console.error('Error deleting employee:', error)
      showToast(error.message || 'Failed to delete employee', 'error')
    }
  }

  // Handle export employees
  const handleExportEmployees = async () => {
    try {
      showToast('Exporting employees data...', 'info')
      
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
      
      const csvRows = employees.map(emp => [
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

        {/* Employee Form Modal */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
              </DialogTitle>
            </DialogHeader>
            <EmployeeForm
              employee={selectedEmployee || undefined}
              onSave={handleSaveEmployee}
              onCancel={() => setIsFormOpen(false)}
              isLoading={isSubmitting}
            />
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