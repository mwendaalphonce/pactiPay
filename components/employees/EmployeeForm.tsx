'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Save, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Employee {
  id?: string
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
}

interface EmployeeFormProps {
  employee?: Employee
  onSave: (employee: Employee) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const contractTypes = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'CASUAL', label: 'Casual' }
]

const kenyanBanks = [
  'Equity Bank', 'KCB Bank', 'Cooperative Bank', 'NCBA Bank', 
  'Standard Chartered', 'Absa Bank', 'I&M Bank', 'Diamond Trust Bank',
  'NIC Bank', 'Prime Bank', 'Family Bank', 'Stanbic Bank'
]

export default function EmployeeForm({ employee, onSave, onCancel, isLoading }: EmployeeFormProps) {
  const [formData, setFormData] = useState<Employee>({
    name: '',
    kraPin: '',
    nationalId: '',
    bankName: '',
    bankBranch: '',
    bankAccount: '',
    basicSalary: 0,
    allowances: 0,
    startDate: '',
    contractType: 'PERMANENT',
    ...employee
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateKraPin = (pin: string): boolean => {
    const kraRegex = /^[A-Z][0-9]{9}[A-Z]$/
    return kraRegex.test(pin)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    }

    if (!formData.kraPin) {
      newErrors.kraPin = 'KRA PIN is required'
    } else if (!validateKraPin(formData.kraPin)) {
      newErrors.kraPin = 'Invalid KRA PIN format (e.g., A123456789Z)'
    }

    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'National ID is required'
    }

    if (!formData.bankName) {
      newErrors.bankName = 'Bank name is required'
    }

    if (!formData.bankBranch.trim()) {
      newErrors.bankBranch = 'Bank branch is required'
    }

    if (!formData.bankAccount.trim()) {
      newErrors.bankAccount = 'Bank account number is required'
    }

    if (formData.basicSalary <= 0) {
      newErrors.basicSalary = 'Basic salary must be greater than 0'
    } else if (formData.basicSalary < 15201) {
      newErrors.basicSalary = 'Basic salary cannot be below minimum wage (KSh 15,201)'
    }

    if (formData.allowances < 0) {
      newErrors.allowances = 'Allowances cannot be negative'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving employee:', error)
    }
  }

  const handleInputChange = (field: keyof Employee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {employee ? 'Edit Employee' : 'Add New Employee'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., John Kamau Mwangi"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="kraPin">KRA PIN *</Label>
                <Input
                  id="kraPin"
                  value={formData.kraPin}
                  onChange={(e) => handleInputChange('kraPin', e.target.value.toUpperCase())}
                  placeholder="A123456789Z"
                  maxLength={11}
                  className={errors.kraPin ? 'border-red-500' : ''}
                />
                {errors.kraPin && (
                  <p className="text-sm text-red-500">{errors.kraPin}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationalId">National ID *</Label>
                <Input
                  id="nationalId"
                  value={formData.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  placeholder="12345678"
                  className={errors.nationalId ? 'border-red-500' : ''}
                />
                {errors.nationalId && (
                  <p className="text-sm text-red-500">{errors.nationalId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Employment Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractType">Contract Type *</Label>
              <Select
                value={formData.contractType}
                onValueChange={(value) => handleInputChange('contractType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bank Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bank Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Select
                  value={formData.bankName}
                  onValueChange={(value) => handleInputChange('bankName', value)}
                >
                  <SelectTrigger className={errors.bankName ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {kenyanBanks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bankName && (
                  <p className="text-sm text-red-500">{errors.bankName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankBranch">Bank Branch *</Label>
                <Input
                  id="bankBranch"
                  value={formData.bankBranch}
                  onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                  placeholder="e.g., Westlands"
                  className={errors.bankBranch ? 'border-red-500' : ''}
                />
                {errors.bankBranch && (
                  <p className="text-sm text-red-500">{errors.bankBranch}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bankAccount">Bank Account Number *</Label>
                <Input
                  id="bankAccount"
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  placeholder="0123456789"
                  className={errors.bankAccount ? 'border-red-500' : ''}
                />
                {errors.bankAccount && (
                  <p className="text-sm text-red-500">{errors.bankAccount}</p>
                )}
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Salary Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basicSalary">Basic Monthly Salary (KSh) *</Label>
                <Input
                  id="basicSalary"
                  type="number"
                  value={formData.basicSalary || ''}
                  onChange={(e) => handleInputChange('basicSalary', parseFloat(e.target.value) || 0)}
                  placeholder="50000"
                  min="15201"
                  step="0.01"
                  className={errors.basicSalary ? 'border-red-500' : ''}
                />
                {errors.basicSalary && (
                  <p className="text-sm text-red-500">{errors.basicSalary}</p>
                )}
                <p className="text-xs text-gray-500">
                  Minimum: KSh 15,201 (Nairobi minimum wage)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowances">Total Monthly Allowances (KSh)</Label>
                <Input
                  id="allowances"
                  type="number"
                  value={formData.allowances || ''}
                  onChange={(e) => handleInputChange('allowances', parseFloat(e.target.value) || 0)}
                  placeholder="15000"
                  min="0"
                  step="0.01"
                  className={errors.allowances ? 'border-red-500' : ''}
                />
                {errors.allowances && (
                  <p className="text-sm text-red-500">{errors.allowances}</p>
                )}
                <p className="text-xs text-gray-500">
                  Housing, transport, medical, etc.
                </p>
              </div>
            </div>

            {/* Gross Salary Display */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                Gross Monthly Salary: KSh {((formData.basicSalary || 0) + (formData.allowances || 0)).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Minimum Wage Warning */}
          {formData.basicSalary > 0 && formData.basicSalary < 15201 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: Basic salary is below the Kenyan minimum wage of KSh 15,201
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Employee'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}