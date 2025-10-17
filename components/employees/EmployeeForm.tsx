'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Save, X, Check, User, Calendar, Banknote, Building2 } from 'lucide-react'

interface Employee {
  id?: string
  name: string
  kraPin: string
  nationalId: string
  employeeNumber?: string
  bankName: string
  bankBranch: string
  bankAccount: string
  swiftCode?: string
  email?: string
  phoneNumber?: string
  address?: string
  basicSalary: number
  allowances: number
  startDate: string
  contractType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'CASUAL' | 'INTERN'
  residentialStatus?: 'RESIDENT' | 'NON_RESIDENT'
  employeeType?: 'PRIMARY' | 'SECONDARY'
  housingAllowance?: number
  transportAllowance?: number
  leavePay?: number
  otherAllowances?: number
  pensionScheme?: boolean
  pensionSchemeNo?: string
  housingBenefit?: 'NOT_PROVIDED' | 'EMPLOYER_OWNED' | 'EMPLOYER_RENTED' | 'AGRICULTURE_FARM'
  valueOfQuarters?: number
  actualRent?: number
  ownerOccupierInterest?: number
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
  { value: 'CASUAL', label: 'Casual' },
  { value: 'INTERN', label: 'Intern' }
]

const kenyanBanks = [
  'Equity Bank', 'KCB Bank', 'Cooperative Bank', 'NCBA Bank', 
  'Standard Chartered', 'Absa Bank', 'I&M Bank', 'Diamond Trust Bank',
  'NIC Bank', 'Prime Bank', 'Family Bank', 'Stanbic Bank'
]

export default function EmployeeForm({ employee, onSave, onCancel, isLoading }: EmployeeFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Employee>({
    name: '',
    kraPin: '',
    nationalId: '',
    employeeNumber: '',
    email: '',
    phoneNumber: '',
    address: '',
    bankName: '',
    bankBranch: '',
    bankAccount: '',
    swiftCode: '',
    basicSalary: 0,
    allowances: 0,
    startDate: '',
    contractType: 'PERMANENT',
    residentialStatus: 'RESIDENT',
    employeeType: 'PRIMARY',
    housingAllowance: 0,
    transportAllowance: 0,
    leavePay: 0,
    otherAllowances: 0,
    pensionScheme: false,
    pensionSchemeNo: '',
    housingBenefit: 'NOT_PROVIDED',
    valueOfQuarters: 0,
    actualRent: 0,
    ownerOccupierInterest: 0,
    ...employee
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const steps = [
    { id: 1, name: 'Personal Info', icon: User },
    { id: 2, name: 'Employment', icon: Calendar },
    { id: 3, name: 'Salary & Benefits', icon: Banknote },
    { id: 4, name: 'Bank Details', icon: Building2 }
  ]

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        if (!value?.trim()) return 'Name is required'
        if (value.length < 2) return 'Name must be at least 2 characters'
        break
      case 'kraPin':
        if (!value?.trim()) return 'KRA PIN is required'
        if (!/^[A-Z]\d{9}[A-Z]$/.test(value)) return 'Invalid KRA PIN format (e.g., A000000000P)'
        break
      case 'nationalId':
        if (!value?.trim()) return 'National ID is required'
        if (!/^\d{7,8}$/.test(value)) return 'National ID must be 7-8 digits'
        break
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format'
        break
      case 'phoneNumber':
        if (value && !/^(\+254|0)[17]\d{8}$/.test(value)) return 'Invalid phone number (e.g., 0712345678)'
        break
      case 'basicSalary':
        if (!value || value <= 0) return 'Basic salary is required'
        if (value < 15201) return 'Basic salary cannot be below minimum wage (KSh 15,201)'
        break
      case 'startDate':
        if (!value) return 'Start date is required'
        break
      case 'bankName':
        if (!value?.trim()) return 'Bank name is required'
        break
      case 'bankBranch':
        if (!value?.trim()) return 'Bank branch is required'
        break
      case 'bankAccount':
        if (!value?.trim()) return 'Bank account is required'
        if (!/^\d{10,16}$/.test(value)) return 'Account must be 10-16 digits'
        break
      case 'pensionSchemeNo':
        if (formData.pensionScheme && !value?.trim()) return 'Pension scheme number is required'
        break
    }
    return ''
  }

  const validateStep = (step: number): boolean => {
    const stepFields: Record<number, string[]> = {
      1: ['name', 'kraPin', 'nationalId'],
      2: ['startDate', 'contractType'],
      3: ['basicSalary'],
      4: ['bankName', 'bankBranch', 'bankAccount']
    }
    
    const fields = stepFields[step] || []
    const newErrors: Record<string, string> = {}
    const newTouched: Record<string, boolean> = {}
    
    fields.forEach(field => {
      const value = formData[field as keyof Employee]
      const error = validateField(field, value)
      if (error) {
        newErrors[field] = error
        newTouched[field] = true
      }
    })
    
    setErrors(prev => ({ ...prev, ...newErrors }))
    setTouched(prev => ({ ...prev, ...newTouched }))
    
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    const totalAllowances = 
      (formData.housingAllowance || 0) +
      (formData.transportAllowance || 0) +
      (formData.leavePay || 0) +
      (formData.otherAllowances || 0)

    try {
      await onSave({
        ...formData,
        allowances: totalAllowances
      })
    } catch (error) {
      console.error('Error saving employee:', error)
    }
  }

  const totalAllowances = 
    (formData.housingAllowance || 0) +
    (formData.transportAllowance || 0) +
    (formData.leavePay || 0) +
    (formData.otherAllowances || 0)

  const grossSalary = (formData.basicSalary || 0) + totalAllowances

  return (
    <div className="w-full max-h-[85vh]">
      {/* Progress Steps */}
      <div className="mb-6 pb-6 border-b sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden sm:block ${
                    currentStep === step.id ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 transition-colors ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-6 px-1 overflow-hidden">
        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, name: true }))
                  setErrors(prev => ({ ...prev, name: validateField('name', formData.name) }))
                }}
                placeholder="John Doe"
                className={errors.name && touched.name ? 'border-red-300' : ''}
              />
              {errors.name && touched.name && (
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="kraPin" className="text-sm font-medium text-gray-700">
                  KRA PIN <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="kraPin"
                  value={formData.kraPin}
                  onChange={(e) => setFormData(prev => ({ ...prev, kraPin: e.target.value.toUpperCase() }))}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, kraPin: true }))
                    setErrors(prev => ({ ...prev, kraPin: validateField('kraPin', formData.kraPin) }))
                  }}
                  placeholder="A000000000P"
                  maxLength={11}
                  className={errors.kraPin && touched.kraPin ? 'border-red-300' : ''}
                />
                {!errors.kraPin && <p className="text-xs text-gray-500">Format: A000000000P</p>}
                {errors.kraPin && touched.kraPin && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.kraPin}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nationalId" className="text-sm font-medium text-gray-700">
                  National ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nationalId"
                  value={formData.nationalId}
                  onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, nationalId: true }))
                    setErrors(prev => ({ ...prev, nationalId: validateField('nationalId', formData.nationalId) }))
                  }}
                  placeholder="12345678"
                  className={errors.nationalId && touched.nationalId ? 'border-red-300' : ''}
                />
                {!errors.nationalId && <p className="text-xs text-gray-500">7-8 digit ID number</p>}
                {errors.nationalId && touched.nationalId && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.nationalId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="employeeNumber" className="text-sm font-medium text-gray-700">
                Employee Number
              </Label>
              <Input
                id="employeeNumber"
                value={formData.employeeNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeNumber: e.target.value }))}
                placeholder="EMP001"
              />
              <p className="text-xs text-gray-500">Optional: Internal employee identifier</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, email: true }))
                    setErrors(prev => ({ ...prev, email: validateField('email', formData.email) }))
                  }}
                  placeholder="john.doe@company.com"
                  className={errors.email && touched.email ? 'border-red-300' : ''}
                />
                {errors.email && touched.email && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, phoneNumber: true }))
                    setErrors(prev => ({ ...prev, phoneNumber: validateField('phoneNumber', formData.phoneNumber) }))
                  }}
                  placeholder="0712345678"
                  className={errors.phoneNumber && touched.phoneNumber ? 'border-red-300' : ''}
                />
                {!errors.phoneNumber && <p className="text-xs text-gray-500">Format: 07XX or 01XX</p>}
                {errors.phoneNumber && touched.phoneNumber && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                Physical Address
              </Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Nairobi, Kenya"
              />
            </div>
          </div>
        )}

        {/* Step 2: Employment Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, startDate: true }))
                  setErrors(prev => ({ ...prev, startDate: validateField('startDate', formData.startDate) }))
                }}
                className={errors.startDate && touched.startDate ? 'border-red-300' : ''}
              />
              {errors.startDate && touched.startDate && (
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.startDate}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contractType" className="text-sm font-medium text-gray-700">
                  Contract Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contractType: value as any }))}
                >
                  <SelectTrigger id="contractType">
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

              <div className="space-y-1.5">
                <Label htmlFor="residentialStatus" className="text-sm font-medium text-gray-700">
                  Residential Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.residentialStatus}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, residentialStatus: value as any }))}
                >
                  <SelectTrigger id="residentialStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIDENT">Resident</SelectItem>
                    <SelectItem value="NON_RESIDENT">Non-Resident</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Resident if staying in Kenya for 183+ days per year</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="employeeType" className="text-sm font-medium text-gray-700">
                Employment Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.employeeType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, employeeType: value as any }))}
              >
                <SelectTrigger id="employeeType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIMARY">Primary Employment</SelectItem>
                  <SelectItem value="SECONDARY">Secondary Employment</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Primary if this is their main source of employment income</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Pension Scheme</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pensionScheme"
                  checked={formData.pensionScheme}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pensionScheme: checked as boolean }))}
                />
                <Label htmlFor="pensionScheme" className="font-normal cursor-pointer text-sm">
                  Employee is enrolled in registered pension scheme
                </Label>
              </div>
              
              {formData.pensionScheme && (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="pensionSchemeNo" className="text-sm font-medium text-gray-700">
                    Pension Scheme Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pensionSchemeNo"
                    value={formData.pensionSchemeNo || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pensionSchemeNo: e.target.value }))}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, pensionSchemeNo: true }))
                      setErrors(prev => ({ ...prev, pensionSchemeNo: validateField('pensionSchemeNo', formData.pensionSchemeNo) }))
                    }}
                    placeholder="PSN123456"
                    className={errors.pensionSchemeNo && touched.pensionSchemeNo ? 'border-red-300' : ''}
                  />
                  {errors.pensionSchemeNo && touched.pensionSchemeNo && (
                    <div className="flex items-center gap-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.pensionSchemeNo}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Salary & Benefits */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="basicSalary" className="text-sm font-medium text-gray-700">
                Basic Monthly Salary <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                  KSh
                </span>
                <Input
                  id="basicSalary"
                  type="number"
                  value={formData.basicSalary || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, basicSalary: parseFloat(e.target.value) || 0 }))}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, basicSalary: true }))
                    setErrors(prev => ({ ...prev, basicSalary: validateField('basicSalary', formData.basicSalary) }))
                  }}
                  placeholder="50000"
                  min="0"
                  step="0.01"
                  className={`pl-12 ${errors.basicSalary && touched.basicSalary ? 'border-red-300' : ''}`}
                />
              </div>
              {!errors.basicSalary && <p className="text-xs text-gray-500">Minimum: KSh 15,201 (Nairobi minimum wage)</p>}
              {errors.basicSalary && touched.basicSalary && (
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.basicSalary}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Allowances Breakdown</h4>
                <p className="text-xs text-gray-600">Required for P10 tax return filing</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="housingAllowance" className="text-sm font-medium text-gray-700">
                    Housing Allowance
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                      KSh
                    </span>
                    <Input
                      id="housingAllowance"
                      type="number"
                      value={formData.housingAllowance || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, housingAllowance: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="pl-12"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="transportAllowance" className="text-sm font-medium text-gray-700">
                    Transport Allowance
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                      KSh
                    </span>
                    <Input
                      id="transportAllowance"
                      type="number"
                      value={formData.transportAllowance || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, transportAllowance: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="pl-12"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="leavePay" className="text-sm font-medium text-gray-700">
                    Leave Pay
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                      KSh
                    </span>
                    <Input
                      id="leavePay"
                      type="number"
                      value={formData.leavePay || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, leavePay: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="pl-12"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="otherAllowances" className="text-sm font-medium text-gray-700">
                    Other Allowances
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                      KSh
                    </span>
                    <Input
                      id="otherAllowances"
                      type="number"
                      value={formData.otherAllowances || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, otherAllowances: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="pl-12"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Medical, communication, etc.</p>
                </div>
              </div>

              <div className="pt-3 border-t space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  Total Allowances: KSh {totalAllowances.toLocaleString()}
                </p>
                <p className="text-sm font-semibold text-blue-900">
                  Gross Monthly Salary: KSh {grossSalary.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <div>
                <h4 className="text-sm font-medium text-amber-900">Housing Benefits</h4>
                <p className="text-xs text-amber-700 mt-1">Required for P10 if applicable</p>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="housingBenefit" className="text-sm font-medium text-gray-700">
                  Housing Benefit Type
                </Label>
                <Select
                  value={formData.housingBenefit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, housingBenefit: value as any }))}
                >
                  <SelectTrigger id="housingBenefit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_PROVIDED">Not Provided</SelectItem>
                    <SelectItem value="EMPLOYER_OWNED">Employer Owned</SelectItem>
                    <SelectItem value="EMPLOYER_RENTED">Employer Rented</SelectItem>
                    <SelectItem value="AGRICULTURE_FARM">Agricultural Farm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.housingBenefit !== 'NOT_PROVIDED' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="valueOfQuarters" className="text-sm font-medium text-gray-700">
                      Value of Quarters
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                        KSh
                      </span>
                      <Input
                        id="valueOfQuarters"
                        type="number"
                        value={formData.valueOfQuarters || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, valueOfQuarters: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="pl-12"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Monthly market value</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="actualRent" className="text-sm font-medium text-gray-700">
                      Actual Rent/Recovery
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                        KSh
                      </span>
                      <Input
                        id="actualRent"
                        type="number"
                        value={formData.actualRent || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, actualRent: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="pl-12"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Amount recovered from employee</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div>
                <h4 className="text-sm font-medium text-purple-900">Tax Relief</h4>
                <p className="text-xs text-purple-700 mt-1">Mortgage interest relief for P10</p>
              </div>
              <div className="mt-3 space-y-1.5">
                <Label htmlFor="ownerOccupierInterest" className="text-sm font-medium text-gray-700">
                  Owner Occupier Interest
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                    KSh
                  </span>
                  <Input
                    id="ownerOccupierInterest"
                    type="number"
                    value={formData.ownerOccupierInterest || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownerOccupierInterest: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="pl-12"
                  />
                </div>
                <p className="text-xs text-gray-500">Monthly mortgage interest (max relief: KSh 25,000/month)</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Bank Details */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bankName" className="text-sm font-medium text-gray-700">
                Bank Name <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.bankName}
                onValueChange={(value) => setFormData(prev => ({ ...prev, bankName: value }))}
              >
                <SelectTrigger 
                  id="bankName"
                  className={errors.bankName && touched.bankName ? 'border-red-300' : ''}
                >
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
              {errors.bankName && touched.bankName && (
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.bankName}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bankBranch" className="text-sm font-medium text-gray-700">
                  Bank Branch <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankBranch"
                  value={formData.bankBranch}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankBranch: e.target.value }))}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, bankBranch: true }))
                    setErrors(prev => ({ ...prev, bankBranch: validateField('bankBranch', formData.bankBranch) }))
                  }}
                  placeholder="Westlands Branch"
                  className={errors.bankBranch && touched.bankBranch ? 'border-red-300' : ''}
                />
                {errors.bankBranch && touched.bankBranch && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.bankBranch}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bankAccount" className="text-sm font-medium text-gray-700">
                  Account Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankAccount"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, bankAccount: true }))
                    setErrors(prev => ({ ...prev, bankAccount: validateField('bankAccount', formData.bankAccount) }))
                  }}
                  placeholder="1234567890"
                  className={errors.bankAccount && touched.bankAccount ? 'border-red-300' : ''}
                />
                {!errors.bankAccount && <p className="text-xs text-gray-500">10-16 digit account number</p>}
                {errors.bankAccount && touched.bankAccount && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.bankAccount}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="swiftCode" className="text-sm font-medium text-gray-700">
                SWIFT Code
              </Label>
              <Input
                id="swiftCode"
                value={formData.swiftCode || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, swiftCode: e.target.value }))}
                placeholder="KCBLKENX"
              />
              <p className="text-xs text-gray-500">Optional: Required for international transfers</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-green-900">Ready to Submit</h4>
                  <p className="text-xs text-green-700 mt-1">
                    Review all information before creating the employee record
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t sticky bottom-0 bg-white">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handlePrevious}
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        {currentStep < steps.length ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
          >
            Next Step
          </Button>
        ) : (
          <Button 
            type="button"
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Employee'}
          </Button>
        )}
      </div>
    </div>
  )
}