// src/lib/payroll/shif.ts

import { SHIF_RATES } from '@/lib/constants/kenya-tax-rates'


export interface SHIFCalculationResult {
  grossSalary: number
  contributionRate: number
  employeeContribution: number
  employerContribution: number
  totalContribution: number
  isMinimumApplied: boolean
  effectiveRate: number
}

/**
 * Calculate SHIF contributions based on gross salary
 * @param grossSalary - Monthly gross salary
 * @returns SHIF calculation result
 */
export function calculateSHIF(grossSalary: number): SHIFCalculationResult {
  // Ensure non-negative gross salary
  const adjustedGrossSalary = Math.max(0, grossSalary)
  
  // Calculate base contribution (2.75% of gross salary)
  const baseEmployeeContribution = adjustedGrossSalary * SHIF_RATES.EMPLOYEE_RATE
  const baseEmployerContribution = adjustedGrossSalary * SHIF_RATES.EMPLOYER_RATE
  
  // Apply minimum limit for employee contribution (no maximum limit)
  let finalEmployeeContribution = baseEmployeeContribution
  let isMinimumApplied = false
  
  if (baseEmployeeContribution < SHIF_RATES.MIN_CONTRIBUTION && adjustedGrossSalary > 0) {
    finalEmployeeContribution = SHIF_RATES.MIN_CONTRIBUTION
    isMinimumApplied = true
  }
  
  // Employer contribution follows the same minimum limit
  let finalEmployerContribution = baseEmployerContribution
  if (baseEmployerContribution < SHIF_RATES.MIN_CONTRIBUTION && adjustedGrossSalary > 0) {
    finalEmployerContribution = SHIF_RATES.MIN_CONTRIBUTION
  }
  
  // Calculate effective rate
  const effectiveRate = adjustedGrossSalary > 0 ? (finalEmployeeContribution / adjustedGrossSalary) * 100 : 0
  
  return {
    grossSalary: adjustedGrossSalary,
    contributionRate: SHIF_RATES.EMPLOYEE_RATE,
    employeeContribution: Math.round(finalEmployeeContribution * 100) / 100,
    employerContribution: Math.round(finalEmployerContribution * 100) / 100,
    totalContribution: Math.round((finalEmployeeContribution + finalEmployerContribution) * 100) / 100,
    isMinimumApplied,
    effectiveRate: Math.round(effectiveRate * 100) / 100
  }
}

/**
 * Calculate employee SHIF contribution only (for payroll deductions)
 * @param grossSalary - Monthly gross salary
 * @returns Employee SHIF contribution amount
 */
export function calculateEmployeeSHIF(grossSalary: number): number {
  const shifResult = calculateSHIF(grossSalary)
  return shifResult.employeeContribution
}

/**
 * Calculate employer SHIF contribution only (for employer costs)
 * @param grossSalary - Monthly gross salary
 * @returns Employer SHIF contribution amount
 */
export function calculateEmployerSHIF(grossSalary: number): number {
  const shifResult = calculateSHIF(grossSalary)
  return shifResult.employerContribution
}

/**
 * Calculate annual SHIF contributions
 * @param monthlyGrossSalary - Monthly gross salary
 * @returns Annual SHIF contributions
 */
export function calculateAnnualSHIF(monthlyGrossSalary: number): {
  employeeAnnual: number
  employerAnnual: number
  totalAnnual: number
} {
  const monthlySHIF = calculateSHIF(monthlyGrossSalary)
  
  return {
    employeeAnnual: monthlySHIF.employeeContribution * 12,
    employerAnnual: monthlySHIF.employerContribution * 12,
    totalAnnual: monthlySHIF.totalContribution * 12
  }
}

/**
 * Check if SHIF contribution applies
 * @param grossSalary - Gross salary amount
 * @returns Whether SHIF is applicable
 */
export function isSHIFApplicable(grossSalary: number): boolean {
  return grossSalary > 0
}

/**
 * Calculate SHIF contribution for different salary scenarios
 * @param salaryScenarios - Array of salary amounts to test
 * @returns Array of SHIF calculations
 */
export function calculateSHIFScenarios(salaryScenarios: number[]): SHIFCalculationResult[] {
  return salaryScenarios.map(salary => calculateSHIF(salary))
}

/**
 * Validate SHIF calculation inputs
 * @param grossSalary - Gross salary
 * @returns Validation result
 */
export function validateSHIFInputs(grossSalary: number): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (grossSalary < 0) {
    errors.push('Gross salary cannot be negative')
  }
  
  if (grossSalary === 0) {
    warnings.push('Zero gross salary will result in no SHIF contributions')
  }
  
  const shifResult = calculateSHIF(grossSalary)
  
  if (shifResult.isMinimumApplied) {
    warnings.push(`SHIF contribution adjusted to minimum (KSh ${SHIF_RATES.MIN_CONTRIBUTION})`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Format SHIF calculation for display
 * @param shifResult - SHIF calculation result
 * @returns Formatted string representation
 */
export function formatSHIFCalculation(shifResult: SHIFCalculationResult): string {
  let formatted = `Gross Salary: KSh ${shifResult.grossSalary.toLocaleString()}\n`
  formatted += `Standard Rate: ${(shifResult.contributionRate * 100).toFixed(2)}%\n`
  formatted += `Employee Contribution: KSh ${shifResult.employeeContribution.toLocaleString()}\n`
  formatted += `Employer Contribution: KSh ${shifResult.employerContribution.toLocaleString()}\n`
  formatted += `Total Contribution: KSh ${shifResult.totalContribution.toLocaleString()}\n`
  formatted += `Effective Rate: ${shifResult.effectiveRate.toFixed(2)}%\n`
  
  if (shifResult.isMinimumApplied) {
    formatted += `⚠️ Minimum contribution applied (KSh ${SHIF_RATES.MIN_CONTRIBUTION})\n`
  }
  
  return formatted
}

/**
 * Compare SHIF with old NHIF rates (for reference/migration purposes)
 * Note: This is for informational purposes only
 * @param grossSalary - Gross salary
 * @returns Comparison between SHIF and estimated NHIF
 */
export function compareSHIFWithNHIF(grossSalary: number): {
  shifContribution: number
  estimatedNHIFContribution: number
  difference: number
  percentageDifference: number
} {
  const shifResult = calculateSHIF(grossSalary)
  
  // Simplified NHIF calculation (tiered system - approximate)
  let estimatedNHIF = 0
  if (grossSalary <= 5999) estimatedNHIF = 150
  else if (grossSalary <= 7999) estimatedNHIF = 300
  else if (grossSalary <= 11999) estimatedNHIF = 400
  else if (grossSalary <= 14999) estimatedNHIF = 500
  else if (grossSalary <= 19999) estimatedNHIF = 600
  else if (grossSalary <= 24999) estimatedNHIF = 750
  else if (grossSalary <= 29999) estimatedNHIF = 850
  else if (grossSalary <= 34999) estimatedNHIF = 900
  else if (grossSalary <= 39999) estimatedNHIF = 950
  else if (grossSalary <= 44999) estimatedNHIF = 1000
  else if (grossSalary <= 49999) estimatedNHIF = 1100
  else if (grossSalary <= 59999) estimatedNHIF = 1200
  else if (grossSalary <= 69999) estimatedNHIF = 1300
  else if (grossSalary <= 79999) estimatedNHIF = 1400
  else if (grossSalary <= 89999) estimatedNHIF = 1500
  else if (grossSalary <= 99999) estimatedNHIF = 1600
  else estimatedNHIF = 1700
  
  const difference = shifResult.employeeContribution - estimatedNHIF
  const percentageDifference = estimatedNHIF > 0 ? (difference / estimatedNHIF) * 100 : 0
  
  return {
    shifContribution: shifResult.employeeContribution,
    estimatedNHIFContribution: estimatedNHIF,
    difference: Math.round(difference * 100) / 100,
    percentageDifference: Math.round(percentageDifference * 100) / 100
  }
}

/**
 * Get SHIF rate bracket information for a given salary
 * @param grossSalary - Gross salary amount
 * @returns Rate bracket information
 */
export function getSHIFRateBracket(grossSalary: number): {
  salaryRange: string
  applicableRate: number
  contributionType: 'standard' | 'minimum'
} {
  const shifResult = calculateSHIF(grossSalary)
  
  const contributionType: 'standard' | 'minimum' = shifResult.isMinimumApplied ? 'minimum' : 'standard'
  
  // Determine salary range for minimum
  const minSalaryForStandard = SHIF_RATES.MIN_CONTRIBUTION / SHIF_RATES.EMPLOYEE_RATE // ~KSh 10,909
  
  let salaryRange = ''
  if (grossSalary < minSalaryForStandard) {
    salaryRange = `Below KSh ${Math.round(minSalaryForStandard).toLocaleString()}`
  } else {
    salaryRange = `KSh ${Math.round(minSalaryForStandard).toLocaleString()} and above (no upper limit)`
  }
  
  return {
    salaryRange,
    applicableRate: shifResult.effectiveRate,
    contributionType
  }
}

// Example usage and test cases
export const SHIF_EXAMPLES = {
  // Example 1: Very low income (minimum contribution)
  VERY_LOW_INCOME: {
    grossSalary: 8000,
    expectedEmployee: 300, // Minimum contribution
    expectedEmployer: 300,
    expectedMinimumApplied: true
  },
  
  // Example 2: Medium income (standard rate)
  MEDIUM_INCOME: {
    grossSalary: 50000,
    expectedEmployee: 1375, // 2.75% of 50,000
    expectedEmployer: 1375,
    expectedMinimumApplied: false
  },
  
  // Example 3: High income (standard rate, no cap)
  HIGH_INCOME: {
    grossSalary: 300000,
    expectedEmployee: 8250, // 2.75% of 300,000 (no maximum limit)
    expectedEmployer: 8250,
    expectedMinimumApplied: false
  },
  
  // Example 4: Very high income (standard rate, no cap)
  VERY_HIGH_INCOME: {
    grossSalary: 1000000,
    expectedEmployee: 27500, // 2.75% of 1,000,000 (no maximum limit)
    expectedEmployer: 27500,
    expectedMinimumApplied: false
  }
} as const