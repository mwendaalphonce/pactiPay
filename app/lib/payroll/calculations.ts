// src/lib/payroll/calculations.ts

import { calculateMonthlyPAYE, getPAYEBreakdown, InsuranceReliefInput } from './paye'
import { calculateNSSF } from './nssf'
import { calculateSHIF } from './shif'
import { calculateHousingLevy } from './housing-levy'
import { WORKING_TIME } from '@/app/lib/constants/kenya-tax-rates'

/**
 * Core Payroll Calculation Engine for Kenya 2025
 * UPDATED: December 2024 Tax Laws Amendment Act
 * 
 * KEY CHANGE: SHIF and Housing Levy are now ALLOWABLE DEDUCTIONS
 * Order of calculation:
 * 1. Calculate Gross Pay
 * 2. Deduct NSSF (allowable deduction)
 * 3. Deduct SHIF (NEW: now allowable deduction)
 * 4. Deduct Housing Levy (NEW: now allowable deduction)
 * 5. Calculate PAYE on remaining amount
 * 6. Apply tax reliefs (Personal, Insurance)ayro
 * 7. Calculate Net Pay
 */

export interface Employee {
  id: string
  name: string
  kraPin: string
  basicSalary: number
  allowances: number
  contractType: 'permanent' | 'contract' | 'casual' | 'intern'
  isDisabled?: boolean
  insurancePremiums?: InsuranceReliefInput
}

export interface PayrollInput {
  employee: Employee
  overtimeHours: number
  overtimeType: 'weekday' | 'holiday'
  unpaidDays: number
  customDeductions: number
  bonuses: number
}

export interface PayrollCalculationResult {
  employee: {
    id: string
    name: string
    kraPin: string
    isDisabled?: boolean
  }
  earnings: {
    basicSalary: number
    allowances: number
    overtime: number
    bonuses: number
    grossPay: number
  }
  deductions: {
    // Allowable deductions (reduce taxable income)
    nssf: number
    shif: number
    housingLevy: number
    totalAllowableDeductions: number
    
    // Tax calculation
    taxableIncome: number
    grossTax: number
    personalRelief: number
    insuranceRelief: number
    paye: number
    
    // Other deductions
    customDeductions: number
    totalStatutory: number
    totalDeductions: number
  }
  netPay: number
  employerContributions: {
    nssf: number
    shif: number
    housingLevy: number
    total: number
  }
  calculations: {
    workingDays: number
    dailyRate: number
    hourlyRate: number
    unpaidDeduction: number
    effectiveTaxRate: number
  }
  breakdown: {
    payeBreakdown: any
    nssfBreakdown: any
    shifBreakdown: any
    housingLevyBreakdown: any
  }
}

/**
 * Main payroll calculation function - UPDATED FOR DEC 2024 TAX LAW
 */
export function calculatePayroll(input: PayrollInput): PayrollCalculationResult {
  const { employee, overtimeHours, overtimeType, unpaidDays, customDeductions, bonuses } = input
  
  // Step 1: Calculate basic earnings
  const workingDays = WORKING_TIME.STANDARD_WORKING_DAYS_PER_MONTH
  const dailyRate = employee.basicSalary / workingDays
  const hourlyRate = employee.basicSalary / WORKING_TIME.STANDARD_WORKING_HOURS_PER_MONTH
  
  // Step 2: Calculate overtime
  const overtimeMultiplier = overtimeType === 'holiday' 
    ? WORKING_TIME.OVERTIME_HOLIDAY_MULTIPLIER 
    : WORKING_TIME.OVERTIME_WEEKDAY_MULTIPLIER
  const overtimeAmount = overtimeHours * hourlyRate * overtimeMultiplier
  
  // Step 3: Calculate unpaid days deduction
  const unpaidDeduction = unpaidDays * dailyRate
  
  // Step 4: Calculate gross pay
  const adjustedBasicSalary = Math.max(0, employee.basicSalary - unpaidDeduction)
  const grossPay = adjustedBasicSalary + employee.allowances + overtimeAmount + bonuses
  
  // Step 5: Calculate ALLOWABLE DEDUCTIONS (in order)
  
  // 5a. NSSF (first allowable deduction)
  const nssfResult = calculateNSSF(grossPay)
  const nssfEmployee = nssfResult.employeeContribution
  const nssfEmployer = nssfResult.employerContribution
  
  // 5b. SHIF (NEW: now an allowable deduction)
  const shifResult = calculateSHIF(grossPay)
  const shifEmployee = shifResult.employeeContribution
  const shifEmployer = shifResult.employerContribution
  
  // 5c. Housing Levy (NEW: now an allowable deduction)
  const housingLevyResult = calculateHousingLevy(grossPay)
  const housingLevyEmployee = housingLevyResult.employeeContribution
  const housingLevyEmployer = housingLevyResult.employerContribution
  
  // Total allowable deductions
  const totalAllowableDeductions = nssfEmployee + shifEmployee + housingLevyEmployee
  
  // Step 6: Calculate TAXABLE INCOME (NEW FORMULA)
  // Taxable Income = Gross Pay - NSSF - SHIF - Housing Levy
  const taxableIncome = grossPay - totalAllowableDeductions
  
  // Step 7: Calculate PAYE on taxable income
  const payeResult = getPAYEBreakdown(
    grossPay,
    nssfEmployee,
    shifEmployee,
    housingLevyEmployee,
    employee.insurancePremiums,
    employee.isDisabled || false
  )
  
  const payeAmount = payeResult.netTax
  const personalRelief = payeResult.personalRelief
  const insuranceRelief = payeResult.insuranceRelief
  const grossTax = payeResult.grossTax
  const effectiveTaxRate = payeResult.effectiveRate
  
  // Step 8: Calculate totals
  const totalStatutoryDeductions = payeAmount + nssfEmployee + shifEmployee + housingLevyEmployee
  const totalDeductions = totalStatutoryDeductions + customDeductions
  const netPay = grossPay - totalDeductions
  
  // Step 9: Calculate employer contributions
  const totalEmployerContributions = nssfEmployer + shifEmployer + housingLevyEmployer
  
  // Step 10: Prepare result
  return {
    employee: {
      id: employee.id,
      name: employee.name,
      kraPin: employee.kraPin,
      isDisabled: employee.isDisabled
    },
    earnings: {
      basicSalary: Math.round(adjustedBasicSalary * 100) / 100,
      allowances: employee.allowances,
      overtime: Math.round(overtimeAmount * 100) / 100,
      bonuses: bonuses,
      grossPay: Math.round(grossPay * 100) / 100
    },
    deductions: {
      // Allowable deductions
      nssf: Math.round(nssfEmployee * 100) / 100,
      shif: Math.round(shifEmployee * 100) / 100,
      housingLevy: Math.round(housingLevyEmployee * 100) / 100,
      totalAllowableDeductions: Math.round(totalAllowableDeductions * 100) / 100,
      
      // Tax calculation
      taxableIncome: Math.round(taxableIncome * 100) / 100,
      grossTax: Math.round(grossTax * 100) / 100,
      personalRelief: Math.round(personalRelief * 100) / 100,
      insuranceRelief: Math.round(insuranceRelief * 100) / 100,
      paye: Math.round(payeAmount * 100) / 100,
      
      // Other deductions
      customDeductions: customDeductions,
      totalStatutory: Math.round(totalStatutoryDeductions * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100
    },
    netPay: Math.round(netPay * 100) / 100,
    employerContributions: {
      nssf: Math.round(nssfEmployer * 100) / 100,
      shif: Math.round(shifEmployer * 100) / 100,
      housingLevy: Math.round(housingLevyEmployer * 100) / 100,
      total: Math.round(totalEmployerContributions * 100) / 100
    },
    calculations: {
      workingDays,
      dailyRate: Math.round(dailyRate * 100) / 100,
      hourlyRate: Math.round(hourlyRate * 100) / 100,
      unpaidDeduction: Math.round(unpaidDeduction * 100) / 100,
      effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100
    },
    breakdown: {
      payeBreakdown: payeResult,
      nssfBreakdown: nssfResult,
      shifBreakdown: shifResult,
      housingLevyBreakdown: housingLevyResult
    }
  }
}

/**
 * Calculate batch payroll for multiple employees
 */
export function calculateBatchPayroll(employees: PayrollInput[]): PayrollCalculationResult[] {
  return employees.map(employeeInput => calculatePayroll(employeeInput))
}

/**
 * Calculate payroll summary for reporting
 */
export function calculatePayrollSummary(payrollResults: PayrollCalculationResult[]): {
  totalEmployees: number
  totalGrossPay: number
  totalDeductions: number
  totalNetPay: number
  totalEmployerContributions: number
  averageGrossPay: number
  averageNetPay: number
  deductionBreakdown: {
    totalAllowableDeductions: number
    totalNSSF: number
    totalSHIF: number
    totalHousingLevy: number
    totalPAYE: number
    totalPersonalRelief: number
    totalInsuranceRelief: number
    totalCustomDeductions: number
  }
  employerContributionBreakdown: {
    totalNSSF: number
    totalSHIF: number
    totalHousingLevy: number
  }
} {
  const totalEmployees = payrollResults.length
  
  if (totalEmployees === 0) {
    return {
      totalEmployees: 0,
      totalGrossPay: 0,
      totalDeductions: 0,
      totalNetPay: 0,
      totalEmployerContributions: 0,
      averageGrossPay: 0,
      averageNetPay: 0,
      deductionBreakdown: {
        totalAllowableDeductions: 0,
        totalNSSF: 0,
        totalSHIF: 0,
        totalHousingLevy: 0,
        totalPAYE: 0,
        totalPersonalRelief: 0,
        totalInsuranceRelief: 0,
        totalCustomDeductions: 0
      },
      employerContributionBreakdown: {
        totalNSSF: 0,
        totalSHIF: 0,
        totalHousingLevy: 0
      }
    }
  }
  
  const summary = payrollResults.reduce(
    (acc, result) => {
      acc.totalGrossPay += result.earnings.grossPay
      acc.totalDeductions += result.deductions.totalDeductions
      acc.totalNetPay += result.netPay
      acc.totalEmployerContributions += result.employerContributions.total
      
      acc.deductionBreakdown.totalAllowableDeductions += result.deductions.totalAllowableDeductions
      acc.deductionBreakdown.totalNSSF += result.deductions.nssf
      acc.deductionBreakdown.totalSHIF += result.deductions.shif
      acc.deductionBreakdown.totalHousingLevy += result.deductions.housingLevy
      acc.deductionBreakdown.totalPAYE += result.deductions.paye
      acc.deductionBreakdown.totalPersonalRelief += result.deductions.personalRelief
      acc.deductionBreakdown.totalInsuranceRelief += result.deductions.insuranceRelief
      acc.deductionBreakdown.totalCustomDeductions += result.deductions.customDeductions
      
      acc.employerContributionBreakdown.totalNSSF += result.employerContributions.nssf
      acc.employerContributionBreakdown.totalSHIF += result.employerContributions.shif
      acc.employerContributionBreakdown.totalHousingLevy += result.employerContributions.housingLevy
      
      return acc
    },
    {
      totalGrossPay: 0,
      totalDeductions: 0,
      totalNetPay: 0,
      totalEmployerContributions: 0,
      deductionBreakdown: {
        totalAllowableDeductions: 0,
        totalNSSF: 0,
        totalSHIF: 0,
        totalHousingLevy: 0,
        totalPAYE: 0,
        totalPersonalRelief: 0,
        totalInsuranceRelief: 0,
        totalCustomDeductions: 0
      },
      employerContributionBreakdown: {
        totalNSSF: 0,
        totalSHIF: 0,
        totalHousingLevy: 0
      }
    }
  )
  
  return {
    totalEmployees,
    ...summary,
    averageGrossPay: Math.round((summary.totalGrossPay / totalEmployees) * 100) / 100,
    averageNetPay: Math.round((summary.totalNetPay / totalEmployees) * 100) / 100
  }
}

/**
 * Format payroll calculation result for display - UPDATED
 */
export function formatPayrollResult(result: PayrollCalculationResult): string {
  let formatted = `=== PAYROLL CALCULATION FOR ${result.employee.name.toUpperCase()} ===\n`
  formatted += `KRA PIN: ${result.employee.kraPin}\n`
  formatted += `*** DECEMBER 2024 TAX LAW APPLIED ***\n`
  
  if (result.employee.isDisabled) {
    formatted += `*** DISABILITY TAX EXEMPTION APPLIED ***\n`
  }
  
  formatted += `\nEARNINGS:\n`
  formatted += `  Basic Salary: KSh ${result.earnings.basicSalary.toLocaleString()}\n`
  formatted += `  Allowances: KSh ${result.earnings.allowances.toLocaleString()}\n`
  formatted += `  Overtime: KSh ${result.earnings.overtime.toLocaleString()}\n`
  formatted += `  Bonuses: KSh ${result.earnings.bonuses.toLocaleString()}\n`
  formatted += `  GROSS PAY: KSh ${result.earnings.grossPay.toLocaleString()}\n\n`
  
  formatted += `ALLOWABLE DEDUCTIONS (reduce taxable income):\n`
  formatted += `  NSSF: KSh ${result.deductions.nssf.toLocaleString()}\n`
  formatted += `  SHIF: KSh ${result.deductions.shif.toLocaleString()}\n`
  formatted += `  Housing Levy: KSh ${result.deductions.housingLevy.toLocaleString()}\n`
  formatted += `  Total Allowable: KSh ${result.deductions.totalAllowableDeductions.toLocaleString()}\n\n`
  
  formatted += `TAX CALCULATION:\n`
  formatted += `  Taxable Income: KSh ${result.deductions.taxableIncome.toLocaleString()}\n`
  formatted += `  Gross Tax: KSh ${result.deductions.grossTax.toLocaleString()}\n`
  formatted += `  Less: Personal Relief: KSh ${result.deductions.personalRelief.toLocaleString()}\n`
  
  if (result.deductions.insuranceRelief > 0) {
    formatted += `  Less: Insurance Relief: KSh ${result.deductions.insuranceRelief.toLocaleString()}\n`
  }
  
  formatted += `  PAYE (Net): KSh ${result.deductions.paye.toLocaleString()}\n\n`
  
  if (result.deductions.customDeductions > 0) {
    formatted += `OTHER DEDUCTIONS:\n`
    formatted += `  Custom Deductions: KSh ${result.deductions.customDeductions.toLocaleString()}\n\n`
  }
  
  formatted += `TOTAL DEDUCTIONS: KSh ${result.deductions.totalDeductions.toLocaleString()}\n`
  formatted += `\nNET PAY: KSh ${result.netPay.toLocaleString()}\n`
  formatted += `Effective Tax Rate: ${result.calculations.effectiveTaxRate.toFixed(2)}%\n\n`
  
  formatted += `EMPLOYER CONTRIBUTIONS:\n`
  formatted += `  NSSF: KSh ${result.employerContributions.nssf.toLocaleString()}\n`
  formatted += `  SHIF: KSh ${result.employerContributions.shif.toLocaleString()}\n`
  formatted += `  Housing Levy: KSh ${result.employerContributions.housingLevy.toLocaleString()}\n`
  formatted += `  TOTAL: KSh ${result.employerContributions.total.toLocaleString()}\n`
  
  return formatted
}

/**
 * Validate payroll calculation inputs
 */
export function validatePayrollInput(input: PayrollInput): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!input.employee.id) errors.push('Employee ID is required')
  if (!input.employee.name?.trim()) errors.push('Employee name is required')
  if (!input.employee.kraPin?.match(/^[A-Z][0-9]{9}[A-Z]$/)) {
    errors.push('Invalid KRA PIN format (should be A123456789Z)')
  }
  if (input.employee.basicSalary < 0) errors.push('Basic salary cannot be negative')
  if (input.employee.allowances < 0) errors.push('Allowances cannot be negative')
  
  if (input.employee.insurancePremiums) {
    const { lifeInsurance, educationPolicy, healthInsurance } = input.employee.insurancePremiums
    if (lifeInsurance && lifeInsurance < 0) errors.push('Life insurance premium cannot be negative')
    if (educationPolicy && educationPolicy < 0) errors.push('Education policy premium cannot be negative')
    if (healthInsurance && healthInsurance < 0) errors.push('Health insurance premium cannot be negative')
  }
  
  if (input.overtimeHours < 0) errors.push('Overtime hours cannot be negative')
  if (input.unpaidDays < 0) errors.push('Unpaid days cannot be negative')
  if (input.unpaidDays > 31) errors.push('Unpaid days cannot exceed 31')
  if (input.customDeductions < 0) errors.push('Custom deductions cannot be negative')
  if (input.bonuses < 0) errors.push('Bonuses cannot be negative')
  
  const grossPay = input.employee.basicSalary + input.employee.allowances + input.bonuses
  const totalDeductionEstimate = input.customDeductions + (input.unpaidDays * (input.employee.basicSalary / 22))
  
  if (totalDeductionEstimate >= grossPay) {
    warnings.push('Total deductions may exceed gross pay, resulting in zero or negative net pay')
  }
  if (input.overtimeHours > 60) {
    warnings.push('Overtime hours exceed 60 - please verify this is correct')
  }
  if (input.unpaidDays > 15) {
    warnings.push('Unpaid days exceed 15 - please verify this is correct')
  }
  
  return { isValid: errors.length === 0, errors, warnings }
}

/**
 * Calculate year-to-date totals
 */
export function calculateYTDTotals(monthlyPayrolls: PayrollCalculationResult[]): {
  ytdGrossPay: number
  ytdDeductions: number
  ytdNetPay: number
  ytdAllowableDeductions: number
  ytdPAYE: number
  ytdPersonalRelief: number
  ytdInsuranceRelief: number
  ytdNSSF: number
  ytdSHIF: number
  ytdHousingLevy: number
  ytdCustomDeductions: number
  monthsCovered: number
} {
  if (monthlyPayrolls.length === 0) {
    return {
      ytdGrossPay: 0,
      ytdDeductions: 0,
      ytdNetPay: 0,
      ytdAllowableDeductions: 0,
      ytdPAYE: 0,
      ytdPersonalRelief: 0,
      ytdInsuranceRelief: 0,
      ytdNSSF: 0,
      ytdSHIF: 0,
      ytdHousingLevy: 0,
      ytdCustomDeductions: 0,
      monthsCovered: 0
    }
  }
  
  const totals = monthlyPayrolls.reduce(
    (acc, payroll) => {
      acc.ytdGrossPay += payroll.earnings.grossPay
      acc.ytdDeductions += payroll.deductions.totalDeductions
      acc.ytdNetPay += payroll.netPay
      acc.ytdAllowableDeductions += payroll.deductions.totalAllowableDeductions
      acc.ytdPAYE += payroll.deductions.paye
      acc.ytdPersonalRelief += payroll.deductions.personalRelief
      acc.ytdInsuranceRelief += payroll.deductions.insuranceRelief
      acc.ytdNSSF += payroll.deductions.nssf
      acc.ytdSHIF += payroll.deductions.shif
      acc.ytdHousingLevy += payroll.deductions.housingLevy
      acc.ytdCustomDeductions += payroll.deductions.customDeductions
      return acc
    },
    {
      ytdGrossPay: 0,
      ytdDeductions: 0,
      ytdNetPay: 0,
      ytdAllowableDeductions: 0,
      ytdPAYE: 0,
      ytdPersonalRelief: 0,
      ytdInsuranceRelief: 0,
      ytdNSSF: 0,
      ytdSHIF: 0,
      ytdHousingLevy: 0,
      ytdCustomDeductions: 0
    }
  )
  
  return {
    ...totals,
    monthsCovered: monthlyPayrolls.length,
    ytdGrossPay: Math.round(totals.ytdGrossPay * 100) / 100,
    ytdDeductions: Math.round(totals.ytdDeductions * 100) / 100,
    ytdNetPay: Math.round(totals.ytdNetPay * 100) / 100,
    ytdAllowableDeductions: Math.round(totals.ytdAllowableDeductions * 100) / 100,
    ytdPAYE: Math.round(totals.ytdPAYE * 100) / 100,
    ytdPersonalRelief: Math.round(totals.ytdPersonalRelief * 100) / 100,
    ytdInsuranceRelief: Math.round(totals.ytdInsuranceRelief * 100) / 100,
    ytdNSSF: Math.round(totals.ytdNSSF * 100) / 100,
    ytdSHIF: Math.round(totals.ytdSHIF * 100) / 100,
    ytdHousingLevy: Math.round(totals.ytdHousingLevy * 100) / 100,
    ytdCustomDeductions: Math.round(totals.ytdCustomDeductions * 100) / 100
  }
}

// Example calculations with Dec 2024 tax law
export const EXAMPLE_CALCULATIONS = {
  STANDARD_EMPLOYEE: {
    employee: {
      id: "emp-001",
      name: "John Doe",
      kraPin: "A123456789Z",
      basicSalary: 50000,
      allowances: 15000,
      contractType: 'permanent' as const
    },
    input: {
      overtimeHours: 10,
      overtimeType: 'weekday' as const,
      unpaidDays: 0,
      customDeductions: 2000,
      bonuses: 5000
    }
  },
  
  WITH_INSURANCE: {
    employee: {
      id: "emp-002",
      name: "Jane Smith",
      kraPin: "B987654321Y",
      basicSalary: 80000,
      allowances: 20000,
      contractType: 'permanent' as const,
      insurancePremiums: {
        lifeInsurance: 5000,
        healthInsurance: 8000
      }
    },
    input: {
      overtimeHours: 0,
      overtimeType: 'weekday' as const,
      unpaidDays: 0,
      customDeductions: 0,
      bonuses: 0
    }
  },
  
  WITH_DISABILITY: {
    employee: {
      id: "emp-003",
      name: "Peter Mwangi",
      kraPin: "C555555555X",
      basicSalary: 120000,
      allowances: 25000,
      contractType: 'permanent' as const,
      isDisabled: true
    },
    input: {
      overtimeHours: 0,
      overtimeType: 'weekday' as const,
      unpaidDays: 0,
      customDeductions: 0,
      bonuses: 0
    }
  }
} as const