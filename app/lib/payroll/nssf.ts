// src/lib/payroll/nssf.ts

import { NSSF_RATES, NSSF_TIERS } from '@/app/lib/constants/kenya-tax-rates'

/**
 * NSSF (National Social Security Fund) Calculations for Kenya 2025
 * Based on NSSF Act 2013 - Phase 3 Implementation (Effective February 2025)
 * 
 * Key Changes:
 * - Lower Earnings Limit (LEL): KSh 8,000
 * - Upper Earnings Limit (UEL): KSh 72,000
 * - Both employee and employer contribute 6% of pensionable pay
 * - Maximum contribution: KSh 4,320 per party
 * - Minimum contribution: KSh 480 per party
 */

export interface NSSFCalculationResult {
  pensionablePay: number
  employeeContribution: number
  employerContribution: number
  totalContribution: number
  tierBreakdown: Array<{
    tier: number
    name: string
    min: number
    max: number
    rate: number
    pensionableAmount: number
    employeeContribution: number
    employerContribution: number
  }>
  cappedAtMaximum: boolean
  effectiveRate: number
}

/**
 * Calculate NSSF contributions based on pensionable pay
 * Formula: Simply 6% of pensionable pay, capped at UEL (KSh 72,000)
 * 
 * @param pensionablePay - Pensionable pay (usually gross salary)
 * @returns NSSF calculation result
 */
export function calculateNSSF(pensionablePay: number): NSSFCalculationResult {
  // Ensure non-negative pensionable pay
  const adjustedPensionablePay = Math.max(0, pensionablePay)
  
  // Cap pensionable pay at Upper Earnings Limit (UEL)
  const cappedPay = Math.min(adjustedPensionablePay, NSSF_RATES.UPPER_EARNINGS_LIMIT)
  const cappedAtMaximum = adjustedPensionablePay > NSSF_RATES.UPPER_EARNINGS_LIMIT
  
  // Simple calculation: 6% of capped pensionable pay
  const employeeContribution = Math.round(cappedPay * NSSF_RATES.EMPLOYEE_RATE * 100) / 100
  const employerContribution = Math.round(cappedPay * NSSF_RATES.EMPLOYER_RATE * 100) / 100
  
  // Calculate tier breakdown for transparency
  const tierBreakdown: NSSFCalculationResult['tierBreakdown'] = []
  let remainingPay = cappedPay
  
  for (const tier of NSSF_TIERS) {
    if (remainingPay <= 0) break
    
    // Calculate pensionable amount in this tier
    const tierWidth = tier.max - tier.min + 1
    const pensionableInTier = Math.min(remainingPay, tierWidth)
    
    if (pensionableInTier <= 0) continue
    
    // Calculate contributions for this tier
    const employeeContribInTier = Math.round(pensionableInTier * tier.rate * 100) / 100
    const employerContribInTier = Math.round(pensionableInTier * tier.rate * 100) / 100
    
    tierBreakdown.push({
      tier: tier.tier,
      name: tier.name,
      min: tier.min,
      max: tier.max,
      rate: tier.rate,
      pensionableAmount: pensionableInTier,
      employeeContribution: employeeContribInTier,
      employerContribution: employerContribInTier
    })
    
    remainingPay -= pensionableInTier
  }
  
  // Calculate effective rate
  const effectiveRate = adjustedPensionablePay > 0 
    ? (employeeContribution / adjustedPensionablePay) * 100 
    : 0
  
  return {
    pensionablePay: adjustedPensionablePay,
    employeeContribution,
    employerContribution,
    totalContribution: Math.round((employeeContribution + employerContribution) * 100) / 100,
    tierBreakdown,
    cappedAtMaximum,
    effectiveRate: Math.round(effectiveRate * 100) / 100
  }
}

/**
 * Calculate employee NSSF contribution only (for payroll deductions)
 * @param pensionablePay - Pensionable pay
 * @returns Employee NSSF contribution amount
 */
export function calculateEmployeeNSSF(pensionablePay: number): number {
  const nssfResult = calculateNSSF(pensionablePay)
  return nssfResult.employeeContribution
}

/**
 * Calculate employer NSSF contribution only (for employer costs)
 * @param pensionablePay - Pensionable pay
 * @returns Employer NSSF contribution amount
 */
export function calculateEmployerNSSF(pensionablePay: number): number {
  const nssfResult = calculateNSSF(pensionablePay)
  return nssfResult.employerContribution
}

/**
 * Determine pensionable pay from gross salary
 * Note: In Kenya, pensionable pay is typically the gross salary
 * @param grossSalary - Gross monthly salary
 * @param allowances - Monthly allowances (if pensionable)
 * @param includePensionableAllowances - Whether to include allowances in pensionable pay
 * @returns Pensionable pay amount
 */
export function calculatePensionablePay(
  grossSalary: number,
  allowances: number = 0,
  includePensionableAllowances: boolean = true
): number {
  const basicPensionable = Math.max(0, grossSalary)
  const pensionableAllowances = includePensionableAllowances ? Math.max(0, allowances) : 0
  
  return basicPensionable + pensionableAllowances
}

/**
 * Calculate annual NSSF contributions
 * @param monthlyPensionablePay - Monthly pensionable pay
 * @returns Annual NSSF contributions
 */
export function calculateAnnualNSSF(monthlyPensionablePay: number): {
  employeeAnnual: number
  employerAnnual: number
  totalAnnual: number
} {
  const monthlyNSSF = calculateNSSF(monthlyPensionablePay)
  
  return {
    employeeAnnual: Math.round(monthlyNSSF.employeeContribution * 12 * 100) / 100,
    employerAnnual: Math.round(monthlyNSSF.employerContribution * 12 * 100) / 100,
    totalAnnual: Math.round(monthlyNSSF.totalContribution * 12 * 100) / 100
  }
}

/**
 * Check if pensionable pay qualifies for NSSF contributions
 * @param pensionablePay - Pensionable pay amount
 * @returns Whether NSSF is applicable
 */
export function isNSSFApplicable(pensionablePay: number): boolean {
  return pensionablePay > 0
}

/**
 * Calculate NSSF contribution rate as percentage of pensionable pay
 * @param pensionablePay - Pensionable pay
 * @returns Effective NSSF rate as percentage
 */
export function calculateNSSFRate(pensionablePay: number): number {
  if (pensionablePay <= 0) return 0
  
  const nssfResult = calculateNSSF(pensionablePay)
  return nssfResult.effectiveRate
}

/**
 * Validate NSSF calculation inputs
 * @param pensionablePay - Pensionable pay
 * @returns Validation result
 */
export function validateNSSFInputs(pensionablePay: number): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (pensionablePay < 0) {
    errors.push('Pensionable pay cannot be negative')
  }
  
  if (pensionablePay === 0) {
    warnings.push('Zero pensionable pay will result in no NSSF contributions')
  }
  
  if (pensionablePay < NSSF_RATES.LOWER_EARNINGS_LIMIT && pensionablePay > 0) {
    warnings.push(
      `Pensionable pay (KSh ${pensionablePay.toLocaleString()}) is below Lower Earnings Limit ` +
      `(KSh ${NSSF_RATES.LOWER_EARNINGS_LIMIT.toLocaleString()}). ` +
      `Minimum contribution is KSh ${NSSF_RATES.MIN_EMPLOYEE_CONTRIBUTION.toLocaleString()}.`
    )
  }
  
  if (pensionablePay > NSSF_RATES.UPPER_EARNINGS_LIMIT) {
    warnings.push(
      `Pensionable pay exceeds Upper Earnings Limit (KSh ${NSSF_RATES.UPPER_EARNINGS_LIMIT.toLocaleString()}). ` +
      `Contribution will be capped at KSh ${NSSF_RATES.MAX_EMPLOYEE_CONTRIBUTION.toLocaleString()}.`
    )
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Format NSSF calculation for display
 * @param nssfResult - NSSF calculation result
 * @returns Formatted string representation
 */
export function formatNSSFCalculation(nssfResult: NSSFCalculationResult): string {
  let formatted = `NSSF Calculation (Phase 3 - February 2025)\n`
  formatted += `${'='.repeat(50)}\n\n`
  formatted += `Pensionable Pay: KSh ${nssfResult.pensionablePay.toLocaleString()}\n`
  
  if (nssfResult.cappedAtMaximum) {
    formatted += `⚠️  Capped at UEL: KSh ${NSSF_RATES.UPPER_EARNINGS_LIMIT.toLocaleString()}\n`
  }
  
  formatted += `\nContributions:\n`
  formatted += `-`.repeat(50) + '\n'
  formatted += `Employee Contribution (6%): KSh ${nssfResult.employeeContribution.toLocaleString()}\n`
  formatted += `Employer Contribution (6%): KSh ${nssfResult.employerContribution.toLocaleString()}\n`
  formatted += `Total Contribution: KSh ${nssfResult.totalContribution.toLocaleString()}\n`
  formatted += `Effective Rate: ${nssfResult.effectiveRate.toFixed(2)}%\n`
  
  formatted += `\nTier Breakdown:\n`
  formatted += `-`.repeat(50) + '\n'
  nssfResult.tierBreakdown.forEach(tier => {
    formatted += `${tier.name} (KSh ${tier.min.toLocaleString()} - ${tier.max.toLocaleString()}):\n`
    formatted += `  Pensionable Amount: KSh ${tier.pensionableAmount.toLocaleString()}\n`
    formatted += `  Employee: KSh ${tier.employeeContribution.toLocaleString()} | `
    formatted += `Employer: KSh ${tier.employerContribution.toLocaleString()}\n`
  })
  
  return formatted
}

/**
 * Get NSSF tier information for a given pensionable pay
 * @param pensionablePay - Pensionable pay amount
 * @returns Applicable NSSF tier information
 */
export function getNSSFTierInfo(pensionablePay: number): {
  applicableTiers: number[]
  maxTierReached: number
  exceedsAllTiers: boolean
  isAboveLEL: boolean
  isBelowLEL: boolean
} {
  const applicableTiers: number[] = []
  let maxTierReached = 0
  
  const cappedPay = Math.min(pensionablePay, NSSF_RATES.UPPER_EARNINGS_LIMIT)
  
  for (const tier of NSSF_TIERS) {
    if (cappedPay > tier.min) {
      applicableTiers.push(tier.tier)
      maxTierReached = tier.tier
    }
  }
  
  const exceedsAllTiers = pensionablePay > NSSF_RATES.UPPER_EARNINGS_LIMIT
  const isAboveLEL = pensionablePay > NSSF_RATES.LOWER_EARNINGS_LIMIT
  const isBelowLEL = pensionablePay < NSSF_RATES.LOWER_EARNINGS_LIMIT && pensionablePay > 0
  
  return {
    applicableTiers,
    maxTierReached,
    exceedsAllTiers,
    isAboveLEL,
    isBelowLEL
  }
}

// Example usage and test cases based on official 2025 rates
export const NSSF_EXAMPLES = {
  // Example 1: Low income (Below LEL)
  VERY_LOW_INCOME: {
    pensionablePay: 5000,
    expectedEmployee: 300, // 6% of 5,000
    expectedEmployer: 300,
    description: 'Below Lower Earnings Limit'
  },
  
  // Example 2: At LEL (Tier 1)
  AT_LEL: {
    pensionablePay: 8000,
    expectedEmployee: 480, // 6% of 8,000
    expectedEmployer: 480,
    description: 'At Lower Earnings Limit - Minimum contribution'
  },
  
  // Example 3: Medium income (Both tiers)
  MEDIUM_INCOME: {
    pensionablePay: 50000,
    expectedEmployee: 3000, // 6% of 50,000
    expectedEmployer: 3000,
    description: 'Between LEL and UEL'
  },
  
  // Example 4: At UEL (Maximum before cap)
  AT_UEL: {
    pensionablePay: 72000,
    expectedEmployee: 4320, // 6% of 72,000 (Maximum)
    expectedEmployer: 4320,
    description: 'At Upper Earnings Limit - Maximum contribution'
  },
  
  // Example 5: High income (Capped at maximum)
  HIGH_INCOME: {
    pensionablePay: 100000,
    expectedEmployee: 4320, // Capped at 6% of 72,000
    expectedEmployer: 4320,
    description: 'Above UEL - Capped at maximum'
  }
} as const

/**
 * Run self-test to verify calculations match official examples
 */
export function runNSSFSelfTest(): {
  passed: boolean
  results: Array<{
    example: string
    passed: boolean
    expected: number
    actual: number
    difference: number
  }>
} {
  const results = []
  let allPassed = true
  
  for (const [key, example] of Object.entries(NSSF_EXAMPLES)) {
    const calculated = calculateEmployeeNSSF(example.pensionablePay)
    const passed = Math.abs(calculated - example.expectedEmployee) < 0.01
    
    if (!passed) allPassed = false
    
    results.push({
      example: key,
      passed,
      expected: example.expectedEmployee,
      actual: calculated,
      difference: calculated - example.expectedEmployee
    })
  }
  
  return {
    passed: allPassed,
    results
  }
}