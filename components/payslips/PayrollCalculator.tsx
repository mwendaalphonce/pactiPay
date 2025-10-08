// src/components/payslips/PayrollCalculator.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calculator, Save, AlertCircle, Info } from 'lucide-react'
import { Employee } from '@/types'
import { 
  calculatePayroll, 
  validatePayrollInput,
  formatPayrollResult,
  type PayrollInput,
  type PayrollCalculationResult 
} from '@/lib/payroll/calculations'

interface PayrollCalculatorProps {
  employees: Employee[]
  onCalculate?: (result: PayrollCalculationResult) => void
  onSave?: (data: any) => void
  isLoading?: boolean
  initialEmployeeId?: string
  initialMonthYear?: string
}

export default function PayrollCalculator({
  employees,
  onCalculate,
  onSave,
  isLoading = false,
  initialEmployeeId,
  initialMonthYear
}: PayrollCalculatorProps) {
  // Get current month in YYYY-MM format
  const getCurrentMonthYear = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  // Form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployeeId || '')
  const [monthYear, setMonthYear] = useState(initialMonthYear || getCurrentMonthYear())
  const [overtimeHours, setOvertimeHours] = useState<number>(0)
  const [overtimeType, setOvertimeType] = useState<'weekday' | 'holiday'>('weekday')
  const [unpaidDays, setUnpaidDays] = useState<number>(0)
  const [customDeductions, setCustomDeductions] = useState<number>(0)
  const [customDeductionDescription, setCustomDeductionDescription] = useState('')
  const [bonuses, setBonuses] = useState<number>(0)
  const [bonusDescription, setBonusDescription] = useState('')

  // Calculation result
  const [calculationResult, setCalculationResult] = useState<PayrollCalculationResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])

  // Selected employee
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId)

  // Auto-calculate when inputs change
  useEffect(() => {
    if (selectedEmployee) {
      handleCalculate()
    }
  }, [
    selectedEmployeeId,
    overtimeHours,
    overtimeType,
    unpaidDays,
    customDeductions,
    bonuses
  ])

  const handleCalculate = () => {
    if (!selectedEmployee) {
      setCalculationResult(null)
      setValidationErrors(['Please select an employee'])
      return
    }

    // Prepare payroll input
    const payrollInput: PayrollInput = {
      employee: {
        id: selectedEmployee.id,
        name: selectedEmployee.name,
        kraPin: selectedEmployee.kraPin,
        basicSalary: selectedEmployee.basicSalary,
        allowances: selectedEmployee.allowances,
        contractType: selectedEmployee.contractType || 'permanent',
        isDisabled: selectedEmployee.isDisabled,
        insurancePremiums: selectedEmployee.insurancePremiums
      },
      overtimeHours: overtimeHours || 0,
      overtimeType: overtimeType,
      unpaidDays: unpaidDays || 0,
      customDeductions: customDeductions || 0,
      bonuses: bonuses || 0
    }

    // Validate input
    const validation = validatePayrollInput(payrollInput)
    setValidationErrors(validation.errors)
    setValidationWarnings(validation.warnings)

    if (!validation.isValid) {
      setCalculationResult(null)
      return
    }

    // Calculate payroll using library function
    try {
      const result = calculatePayroll(payrollInput)
      setCalculationResult(result)
      
      if (onCalculate) {
        onCalculate(result)
      }
    } catch (error) {
      console.error('Calculation error:', error)
      setValidationErrors(['Failed to calculate payroll. Please check your inputs.'])
      setCalculationResult(null)
    }
  }

  const handleSave = () => {
    if (!calculationResult || !selectedEmployee) {
      return
    }

    const saveData = {
      employeeId: selectedEmployee.id,
      monthYear,
      overtimeHours: overtimeHours || 0,
      overtimeType,
      unpaidDays: unpaidDays || 0,
      customDeductions: customDeductions || 0,
      customDeductionDescription: customDeductionDescription || undefined,
      bonuses: bonuses || 0,
      bonusDescription: bonusDescription || undefined,
      // Include calculation results for reference
      calculationResult
    }

    if (onSave) {
      onSave(saveData)
    }
  }

  const handleReset = () => {
    setOvertimeHours(0)
    setOvertimeType('weekday')
    setUnpaidDays(0)
    setCustomDeductions(0)
    setCustomDeductionDescription('')
    setBonuses(0)
    setBonusDescription('')
    setCalculationResult(null)
    setValidationErrors([])
    setValidationWarnings([])
  }

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Form - Left Side */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Payroll Calculator
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 text-sm bg-blue-50 p-3 rounded-md">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800">
                December 2024 Tax Law Applied: SHIF & Housing Levy are allowable deductions
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800 mb-1">Validation Errors</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                      {validationErrors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-800 mb-1">Warnings</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                      {validationWarnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.kraPin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEmployee && (
                <div className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Basic Salary:</span> {formatCurrency(selectedEmployee.basicSalary)}
                    </div>
                    <div>
                      <span className="font-medium">Allowances:</span> {formatCurrency(selectedEmployee.allowances)}
                    </div>
                    {selectedEmployee.isDisabled && (
                      <div className="col-span-2">
                        <Badge className="bg-purple-100 text-purple-800">Disability Tax Exemption Applied</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Month/Year */}
            <div className="space-y-2">
              <Label htmlFor="monthYear">Pay Period *</Label>
              <Input
                id="monthYear"
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
              />
            </div>

            {/* Overtime */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="overtimeHours">Overtime Hours</Label>
                <Input
                  id="overtimeHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtimeType">Overtime Type</Label>
                <Select value={overtimeType} onValueChange={(val: 'weekday' | 'holiday') => setOvertimeType(val)}>
                  <SelectTrigger id="overtimeType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">Weekday (1.5x)</SelectItem>
                    <SelectItem value="holiday">Holiday/Weekend (2.0x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Unpaid Days */}
            <div className="space-y-2">
              <Label htmlFor="unpaidDays">Unpaid Days</Label>
              <Input
                id="unpaidDays"
                type="number"
                min="0"
                max="31"
                value={unpaidDays}
                onChange={(e) => setUnpaidDays(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            {/* Bonuses */}
            <div className="space-y-2">
              <Label htmlFor="bonuses">Bonuses</Label>
              <Input
                id="bonuses"
                type="number"
                min="0"
                step="0.01"
                value={bonuses}
                onChange={(e) => setBonuses(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <Input
                id="bonusDescription"
                type="text"
                value={bonusDescription}
                onChange={(e) => setBonusDescription(e.target.value)}
                placeholder="Bonus description (optional)"
                className="mt-2"
              />
            </div>

            {/* Custom Deductions */}
            <div className="space-y-2">
              <Label htmlFor="customDeductions">Custom Deductions</Label>
              <Input
                id="customDeductions"
                type="number"
                min="0"
                step="0.01"
                value={customDeductions}
                onChange={(e) => setCustomDeductions(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <Input
                id="customDeductionDescription"
                type="text"
                value={customDeductionDescription}
                onChange={(e) => setCustomDeductionDescription(e.target.value)}
                placeholder="Deduction description (optional)"
                className="mt-2"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!calculationResult || isLoading}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Payroll'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Results - Right Side */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Calculation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {!calculationResult ? (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Select an employee to view calculation</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Earnings Section */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-700 uppercase">Earnings</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary:</span>
                      <span className="font-medium">{formatCurrency(calculationResult.earnings.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allowances:</span>
                      <span className="font-medium">{formatCurrency(calculationResult.earnings.allowances)}</span>
                    </div>
                    {calculationResult.earnings.overtime > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overtime:</span>
                        <span className="font-medium">{formatCurrency(calculationResult.earnings.overtime)}</span>
                      </div>
                    )}
                    {calculationResult.earnings.bonuses > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bonuses:</span>
                        <span className="font-medium">{formatCurrency(calculationResult.earnings.bonuses)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-semibold text-green-600">
                      <span>Gross Pay:</span>
                      <span>{formatCurrency(calculationResult.earnings.grossPay)}</span>
                    </div>
                  </div>
                </div>

                {/* Allowable Deductions Section */}
                <div className="space-y-2 pt-2 border-t">
                  <h3 className="font-semibold text-sm text-gray-700 uppercase">Allowable Deductions</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">NSSF:</span>
                      <span className="font-medium">{formatCurrency(calculationResult.deductions.nssf)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SHIF:</span>
                      <span className="font-medium">{formatCurrency(calculationResult.deductions.shif)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Housing Levy:</span>
                      <span className="font-medium">{formatCurrency(calculationResult.deductions.housingLevy)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-medium text-blue-600">
                      <span>Total Allowable:</span>
                      <span>{formatCurrency(calculationResult.deductions.totalAllowableDeductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Calculation Section */}
                <div className="space-y-2 pt-2 border-t">
                  <h3 className="font-semibold text-sm text-gray-700 uppercase">Tax Calculation</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxable Income:</span>
                      <span className="font-medium">{formatCurrency(calculationResult.deductions.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Tax:</span>
                      <span className="font-medium">{formatCurrency(calculationResult.deductions.grossTax)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Less: Personal Relief:</span>
                      <span>-{formatCurrency(calculationResult.deductions.personalRelief)}</span>
                    </div>
                    {calculationResult.deductions.insuranceRelief > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Less: Insurance Relief:</span>
                        <span>-{formatCurrency(calculationResult.deductions.insuranceRelief)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-medium text-red-600">
                      <span>PAYE (Net):</span>
                      <span>{formatCurrency(calculationResult.deductions.paye)}</span>
                    </div>
                  </div>
                </div>

                {/* Other Deductions */}
                {calculationResult.deductions.customDeductions > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <h3 className="font-semibold text-sm text-gray-700 uppercase">Other Deductions</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Custom Deductions:</span>
                      <span className="font-medium text-red-600">{formatCurrency(calculationResult.deductions.customDeductions)}</span>
                    </div>
                  </div>
                )}

                {/* Net Pay */}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">NET PAY:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculationResult.netPay)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-right">
                    Effective Tax Rate: {calculationResult.calculations.effectiveTaxRate.toFixed(2)}%
                  </div>
                </div>

                {/* Employer Contributions */}
                <div className="space-y-2 pt-3 border-t bg-gray-50 p-3 rounded-md -mx-3">
                  <h3 className="font-semibold text-xs text-gray-700 uppercase">Employer Contributions</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">NSSF:</span>
                      <span>{formatCurrency(calculationResult.employerContributions.nssf)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SHIF:</span>
                      <span>{formatCurrency(calculationResult.employerContributions.shif)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Housing Levy:</span>
                      <span>{formatCurrency(calculationResult.employerContributions.housingLevy)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t font-medium">
                      <span>Total:</span>
                      <span>{formatCurrency(calculationResult.employerContributions.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}