'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Employee } from '@/types'
import { useToast } from '@/app/providers'

export default function EditEmployeePage() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id as string
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    kraPin: '',
    nationalId: '',
    bankName: '',
    bankBranch: '',
    bankAccount: '',
    basicSalary: '',
    allowances: '',
    startDate: '',
    contractType: 'PERMANENT',
    isActive: true,
  })

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const response = await fetch(`/api/employees?id=${employeeId}`)
        if (!response.ok) {
          throw new Error('Failed to load employee')
        }
        
        const data = await response.json()
        const employee = data.employees.find((e: Employee) => e.id === employeeId)
        
        if (employee) {
          setFormData({
            name: employee.name,
            kraPin: employee.kraPin,
            nationalId: employee.nationalId,
            bankName: employee.bankName,
            bankBranch: employee.bankBranch,
            bankAccount: employee.bankAccount,
            basicSalary: employee.basicSalary.toString(),
            allowances: employee.allowances.toString(),
            startDate: employee.startDate,
            contractType: employee.contractType,
            isActive: employee.isActive,
          })
        } else {
          throw new Error('Employee not found')
        }
      } catch (error) {
        console.error('Error loading employee:', error)
        toast({
          title: 'Error',
          description: 'Failed to load employee details',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (employeeId) {
      loadEmployee()
    }
  }, [employeeId, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    // Convert 'isActive' string value to boolean
    if (name === 'isActive') {
      setFormData(prev => ({ ...prev, [name]: value === 'true' }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Prepare the update payload - only send changed fields
      const updatePayload = {
        id: employeeId,
        name: formData.name,
        kraPin: formData.kraPin.toUpperCase(),
        nationalId: formData.nationalId,
        bankName: formData.bankName,
        bankBranch: formData.bankBranch,
        bankAccount: formData.bankAccount,
        basicSalary: parseFloat(formData.basicSalary),
        allowances: parseFloat(formData.allowances),
        startDate: formData.startDate,
        contractType: formData.contractType,
        isActive: formData.isActive,
      }

      const response = await fetch('/api/employees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update employee')
      }

      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      })

      router.push(`/employees/${employeeId}`)
    } catch (error) {
      console.error('Error updating employee:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update employee',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/employees/${employeeId}`)
  }

  if (isLoading) {
    return (
      <AppLayout title="Edit Employee" subtitle="Loading employee information...">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="bg-white p-6 rounded-lg space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title="Edit Employee"
      subtitle="Update employee information"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., John Kamau Mwangi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kraPin">KRA PIN *</Label>
                  <Input
                    id="kraPin"
                    name="kraPin"
                    value={formData.kraPin}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., A012345678M"
                    maxLength={11}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID *</Label>
                  <Input
                    id="nationalId"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractType">Contract Type *</Label>
                  <Select
                    value={formData.contractType}
                    onValueChange={(value) => handleSelectChange('contractType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERMANENT">Permanent</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="TEMPORARY">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">Status *</Label>
                  <Select
                    value={formData.isActive ? 'true' : 'false'}
                    onValueChange={(value) => handleSelectChange('isActive', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Information */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Equity Bank"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankBranch">Branch *</Label>
                  <Input
                    id="bankBranch"
                    name="bankBranch"
                    value={formData.bankBranch}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Westlands"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bankAccount">Account Number *</Label>
                  <Input
                    id="bankAccount"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 0123456789"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Information */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basicSalary">Basic Salary (KSh) *</Label>
                  <Input
                    id="basicSalary"
                    name="basicSalary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.basicSalary}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 50000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowances">Allowances (KSh) *</Label>
                  <Input
                    id="allowances"
                    name="allowances"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.allowances}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 15000"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600">Gross Salary:</span>
                  <span className="text-lg font-bold text-blue-900">
                    KSh {(parseFloat(formData.basicSalary || '0') + parseFloat(formData.allowances || '0')).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}