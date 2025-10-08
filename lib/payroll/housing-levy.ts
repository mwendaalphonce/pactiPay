// src/lib/payroll/housing-levy.ts

import { HOUSING_LEVY_RATES } from '@/lib/constants/kenya-tax-rates'

/**
 * Affordable Housing Levy Calculations for Kenya 2025
 * Based on Finance Act and Housing Development Levy regulations
 */

export interface HousingLevyCalculationResult {
  grossSalary: number
  levyRate: number
  employeeContribution: number
  employerContribution: number
  totalContribution: number
  effectiveRate: number
  isApplicable: boolean
}

/**
 * Calculate Affordable Housing Levy based on gross salary
 * @param grossSalary - Monthly gross salary
 * @returns Housing levy calculation result
 */
export function calculateHousingLevy(grossSalary: number): HousingLevyCalculationResult {
  // Ensure non-negative gross salary
  const adjustedGrossSalary = Math.max(0, grossSalary)
  
  // Check if levy is applicable (salary > 0)
  const isApplicable = adjustedGrossSalary > 0
  
  // Calculate contributions (1.5% each for employee and employer)
  const employeeContribution = isApplicable ? adjustedGrossSalary * HOUSING_LEVY_RATES.EMPLOYEE_RATE : 0
  const employerContribution = isApplicable ? adjustedGrossSalary * HOUSING_LEVY_RATES.EMPLOYER_RATE : 0
  
  // Calculate effective rate
  const effectiveRate = adjustedGrossSalary > 0 ? (employeeContribution / adjustedGrossSalary) * 100 : 0
  
  return {
    grossSalary: adjustedGrossSalary,
    levyRate: HOUSING_LEVY_RATES.EMPLOYEE_RATE,
    employeeContribution: Math.round(employeeContribution * 100) / 100,
    employerContribution: Math.round(employerContribution * 100) / 100,
    totalContribution: Math.round((employeeContribution + employerContribution) * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    isApplicable
  }
}

/**
 * Calculate employee housing levy contribution only (for payroll deductions)
 * @param grossSalary - Monthly gross salary
 * @returns Employee housing levy contribution amount
 */
export function calculateEmployeeHousingLevy(grossSalary: number): number {
  const housingLevyResult = calculateHousingLevy(grossSalary)
  return housingLevyResult.employeeContribution
}

/**
 * Calculate employer housing levy contribution only (for employer costs)
 * @param grossSalary - Monthly gross salary
 * @returns Employer housing levy contribution amount
 */
export function calculateEmployerHousingLevy(grossSalary: number): number {
  const housingLevyResult = calculateHousingLevy(grossSalary)
  return housingLevyResult.employerContribution
}

/**
 * Calculate annual housing levy contributions
 * @param monthlyGrossSalary - Monthly gross salary
 * @returns Annual housing levy contributions
 */
export function calculateAnnualHousingLevy(monthlyGrossSalary: number): {
  employeeAnnual: number
  employerAnnual: number
  totalAnnual: number
} {
  const monthlyHousingLevy = calculateHousingLevy(monthlyGrossSalary)
  
  return {
    employeeAnnual: monthlyHousingLevy.employeeContribution * 12,
    employerAnnual: monthlyHousingLevy.employerContribution * 12,
    totalAnnual: monthlyHousingLevy.totalContribution * 12
  }
}

/**
 * Check if housing levy applies
 * @param grossSalary - Gross salary amount
 * @returns Whether housing levy is applicable
 */
export function isHousingLevyApplicable(grossSalary: number): boolean {
  return grossSalary > 0
}

/**
 * Calculate housing levy impact on net salary
 * @param grossSalary - Gross salary
 * @returns Impact analysis
 */
export function calculateHousingLevyImpact(grossSalary: number): {
  grossSalary: number
  housingLevyDeduction: number
  netSalaryReduction: number
  percentageReduction: number
} {
  const housingLevy = calculateEmployeeHousingLevy(grossSalary)
  const percentageReduction = grossSalary > 0 ? (housingLevy / grossSalary) * 100 : 0
  
  return {
    grossSalary,
    housingLevyDeduction: housingLevy,
    netSalaryReduction: housingLevy,
    percentageReduction: Math.round(percentageReduction * 100) / 100
  }
}

/**
 * Calculate housing levy for different salary brackets
 * @param salaryBrackets - Array of salary amounts to analyze
 * @returns Housing levy calculations for each bracket
 */
export function calculateHousingLevyBrackets(salaryBrackets: number[]): Array<HousingLevyCalculationResult & { salaryBracket: string }> {
  return salaryBrackets.map((salary, index) => ({
    ...calculateHousingLevy(salary),
    salaryBracket: `Bracket ${index + 1}: KSh ${salary.toLocaleString()}`
  }))
}

/**
 * Validate housing levy calculation inputs
 * @param grossSalary - Gross salary
 * @returns Validation result
 */
export function validateHousingLevyInputs(grossSalary: number): {
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
    warnings.push('Zero gross salary will result in no housing levy contributions')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Format housing levy calculation for display
 * @param housingLevyResult - Housing levy calculation result
 * @returns Formatted string representation
 */
export function formatHousingLevyCalculation(housingLevyResult: HousingLevyCalculationResult): string {
  let formatted = `Gross Salary: KSh ${housingLevyResult.grossSalary.toLocaleString()}\n`
  formatted += `Levy Rate: ${(housingLevyResult.levyRate * 100).toFixed(1)}%\n`
  formatted += `Employee Contribution: KSh ${housingLevyResult.employeeContribution.toLocaleString()}\n`
  formatted += `Employer Contribution: KSh ${housingLevyResult.employerContribution.toLocaleString()}\n`
  formatted += `Total Contribution: KSh ${housingLevyResult.totalContribution.toLocaleString()}\n`
  formatted += `Effective Rate: ${housingLevyResult.effectiveRate.toFixed(2)}%\n`
  
  if (!housingLevyResult.isApplicable) {
    formatted += '⚠️ Housing levy not applicable (zero or negative salary)\n'
  }
  
  return formatted
}

/**
 * Calculate cumulative housing levy contributions over time
 * @param monthlyGrossSalary - Monthly gross salary
 * @param numberOfMonths - Number of months to calculate
 * @returns Cumulative contributions
 */
export function calculateCumulativeHousingLevy(monthlyGrossSalary: number, numberOfMonths: number): {
  monthlyEmployee: number
  monthlyEmployer: number
  totalEmployee: number
  totalEmployer: number
  grandTotal: number
  monthlyBreakdown: Array<{
    month: number
    employeeContribution: number
    employerContribution: number
    cumulativeEmployee: number
    cumulativeEmployer: number
  }>
} {
  const monthlyContribution = calculateHousingLevy(monthlyGrossSalary)
  const monthlyBreakdown = []
  
  let cumulativeEmployee = 0
  let cumulativeEmployer = 0
  
  for (let month = 1; month <= numberOfMonths; month++) {
    cumulativeEmployee += monthlyContribution.employeeContribution
    cumulativeEmployer += monthlyContribution.employerContribution
    
    monthlyBreakdown.push({
      month,
      employeeContribution: monthlyContribution.employeeContribution,
      employerContribution: monthlyContribution.employerContribution,
      cumulativeEmployee,
      cumulativeEmployer
    })
  }
  
  return {
    monthlyEmployee: monthlyContribution.employeeContribution,
    monthlyEmployer: monthlyContribution.employerContribution,
    totalEmployee: cumulativeEmployee,
    totalEmployer: cumulativeEmployer,
    grandTotal: cumulativeEmployee + cumulativeEmployer,
    monthlyBreakdown
  }
}

/**
 * Compare housing levy across different salary levels
 * @param salaryRange - Object with min and max salary
 * @param intervals - Number of intervals to calculate
 * @returns Comparison across salary range
 */
export function compareHousingLevyAcrossSalaries(
  salaryRange: { min: number; max: number },
  intervals: number = 10
): Array<{
  salary: number
  employeeContribution: number
  employerContribution: number
  totalContribution: number
  effectiveRate: number
}> {
  const step = (salaryRange.max - salaryRange.min) / (intervals - 1)
  const results = []
  
  for (let i = 0; i < intervals; i++) {
    const salary = salaryRange.min + (step * i)
    const housingLevy = calculateHousingLevy(salary)
    
    results.push({
      salary: Math.round(salary),
      employeeContribution: housingLevy.employeeContribution,
      employerContribution: housingLevy.employerContribution,
      totalContribution: housingLevy.totalContribution,
      effectiveRate: housingLevy.effectiveRate
    })
  }
  
  return results
}

/**
 * Calculate housing levy exemptions (if any apply)
 * Note: Currently no exemptions, but structure for future use
 * @param grossSalary - Gross salary
 * @param employeeCategory - Category of employee
 * @returns Exemption information
 */
export function checkHousingLevyExemptions(
  grossSalary: number,
  employeeCategory: 'regular' | 'casual' | 'contract' | 'intern' = 'regular'
): {
  isExempt: boolean
  exemptionReason: string | null
  applicableRate: number
} {
  // Currently no exemptions for housing levy
  // All employees contribute regardless of category
  
  return {
    isExempt: false,
    exemptionReason: null,
    applicableRate: HOUSING_LEVY_RATES.EMPLOYEE_RATE
  }
}

// Example usage and test cases
export const HOUSING_LEVY_EXAMPLES = {
  // Example 1: Low income
  LOW_INCOME: {
    grossSalary: 15000,
    expectedEmployee: 225, // 1.5% of 15,000
    expectedEmployer: 225,
    expectedTotal: 450
  },
  
  // Example 2: Medium income
  MEDIUM_INCOME: {
    grossSalary: 50000,
    expectedEmployee: 750, // 1.5% of 50,000
    expectedEmployer: 750,
    expectedTotal: 1500
  },
  
  // Example 3: High income
  HIGH_INCOME: {
    grossSalary: 200000,
    expectedEmployee: 3000, // 1.5% of 200,000
    expectedEmployer: 3000,
    expectedTotal: 6000
  }
} as const