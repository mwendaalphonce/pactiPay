// src/lib/payroll/paye.ts

/**
 * PAYE (Pay As You Earn) Tax Calculations for Kenya 2025
 * UPDATED: December 2024 Tax Laws Amendment Act
 * SHIF and Housing Levy are now ALLOWABLE DEDUCTIONS
 * 
 * Based on KRA Official Tax Rates (Effective from 1st July 2023)
 * Source: https://www.kra.go.ke/individual/filing-paying/types-of-taxes/individual-income-tax
 */

// Official KRA Tax Rates (Monthly)
export const KRA_TAX_BANDS = [
  { min: 0, max: 24000, rate: 0.10 },           // 10% on first KSh 24,000
  { min: 24001, max: 32333, rate: 0.25 },       // 25% on next KSh 8,333
  { min: 32334, max: 500000, rate: 0.30 },      // 30% on next KSh 467,667
  { min: 500001, max: 800000, rate: 0.325 },    // 32.5% on next KSh 300,000
  { min: 800001, max: Infinity, rate: 0.35 }    // 35% on income above KSh 800,000
] as const

export const PERSONAL_RELIEF_MONTHLY = 2400 // KSh 2,400 per month
export const PERSONAL_RELIEF_ANNUAL = 28800 // KSh 28,800 per annum

export const INSURANCE_RELIEF_RATE = 0.15 // 15% of premiums
export const INSURANCE_RELIEF_MAX_ANNUAL = 60000 // Max KSh 60,000 per annum
export const INSURANCE_RELIEF_MAX_MONTHLY = 5000 // Max KSh 5,000 per month

export const DISABILITY_EXEMPTION_MONTHLY = 150000 // First KSh 150,000 exempt

export interface PayeCalculationResult {
  taxableIncome: number
  grossTax: number
  personalRelief: number
  insuranceRelief: number
  netTax: number
  effectiveRate: number
  taxBandBreakdown: Array<{
    band: number
    description: string
    min: number
    max: number | 'Above'
    rate: number
    taxableAmount: number
    tax: number
  }>
}

export interface InsuranceReliefInput {
  lifeInsurance?: number
  educationPolicy?: number // Must have maturity period of at least 10 years
  healthInsurance?: number
}

/**
 * Calculate PAYE tax based on taxable income
 * UPDATED: This now receives taxable income AFTER all allowable deductions (NSSF, SHIF, Housing Levy)
 * @param taxableIncome - Income after all allowable deductions
 * @param insurancePremiums - Optional insurance premiums for relief
 * @param isDisabled - Whether employee has disability exemption
 * @returns PAYE calculation result
 */
export function calculatePAYE(
  taxableIncome: number,
  insurancePremiums?: InsuranceReliefInput,
  isDisabled: boolean = false
): PayeCalculationResult {
  // Apply disability exemption if applicable
  let adjustedTaxableIncome = Math.max(0, taxableIncome)
  
  if (isDisabled && adjustedTaxableIncome <= DISABILITY_EXEMPTION_MONTHLY) {
    // First KSh 150,000 is exempt for people with disability
    return {
      taxableIncome: adjustedTaxableIncome,
      grossTax: 0,
      personalRelief: 0,
      insuranceRelief: 0,
      netTax: 0,
      effectiveRate: 0,
      taxBandBreakdown: [{
        band: 0,
        description: 'Disability Exemption',
        min: 0,
        max: DISABILITY_EXEMPTION_MONTHLY,
        rate: 0,
        taxableAmount: adjustedTaxableIncome,
        tax: 0
      }]
    }
  }
  
  let grossTax = 0
  const taxBandBreakdown: PayeCalculationResult['taxBandBreakdown'] = []
  
  // Apply tax bands progressively
  for (let i = 0; i < KRA_TAX_BANDS.length; i++) {
    const band = KRA_TAX_BANDS[i]
    
    // Determine how much income falls in this band
    let taxableInBand = 0
    
    if (adjustedTaxableIncome > band.min) {
      if (band.max === Infinity) {
        // Top band - all remaining income
        taxableInBand = adjustedTaxableIncome - band.min
      } else {
        // Middle bands - calculate what falls in this range
        taxableInBand = Math.min(adjustedTaxableIncome, band.max) - band.min
      }
      
      taxableInBand = Math.max(0, taxableInBand)
    }
    
    if (taxableInBand > 0) {
      const taxInBand = taxableInBand * band.rate
      grossTax += taxInBand
      
      // Create description
      let description = ''
      if (i === 0) {
        description = `First KSh ${band.max.toLocaleString()}`
      } else if (band.max === Infinity) {
        description = `Above KSh ${band.min.toLocaleString()}`
      } else {
        const bandAmount = band.max - band.min
        description = `Next KSh ${bandAmount.toLocaleString()}`
      }
      
      taxBandBreakdown.push({
        band: i + 1,
        description,
        min: band.min,
        max: band.max === Infinity ? 'Above' : band.max,
        rate: band.rate,
        taxableAmount: taxableInBand,
        tax: taxInBand
      })
    }
  }
  
  // Calculate insurance relief if applicable
  let insuranceRelief = 0
  if (insurancePremiums) {
    const totalPremiums = (insurancePremiums.lifeInsurance || 0) +
                          (insurancePremiums.educationPolicy || 0) +
                          (insurancePremiums.healthInsurance || 0)
    
    insuranceRelief = Math.min(
      totalPremiums * INSURANCE_RELIEF_RATE,
      INSURANCE_RELIEF_MAX_MONTHLY
    )
  }
  
  // Apply personal relief (cannot exceed gross tax)
  const personalRelief = Math.min(PERSONAL_RELIEF_MONTHLY, grossTax)
  
  // Apply insurance relief (cannot make net tax negative)
  const taxAfterPersonalRelief = Math.max(0, grossTax - personalRelief)
  insuranceRelief = Math.min(insuranceRelief, taxAfterPersonalRelief)
  
  // Calculate net tax
  const netTax = Math.max(0, grossTax - personalRelief - insuranceRelief)
  
  // Calculate effective tax rate
  const effectiveRate = adjustedTaxableIncome > 0 ? (netTax / adjustedTaxableIncome) * 100 : 0
  
  return {
    taxableIncome: Math.round(adjustedTaxableIncome * 100) / 100,
    grossTax: Math.round(grossTax * 100) / 100,
    personalRelief: Math.round(personalRelief * 100) / 100,
    insuranceRelief: Math.round(insuranceRelief * 100) / 100,
    netTax: Math.round(netTax * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    taxBandBreakdown: taxBandBreakdown.map(band => ({
      ...band,
      taxableAmount: Math.round(band.taxableAmount * 100) / 100,
      tax: Math.round(band.tax * 100) / 100
    }))
  }
}

/**
 * Calculate monthly PAYE from gross salary with all allowable deductions
 * UPDATED: Now accepts SHIF and Housing Levy as allowable deductions
 * @param grossSalary - Total gross salary
 * @param nssfContribution - Employee NSSF contribution
 * @param shifContribution - Employee SHIF contribution (NEW: allowable deduction)
 * @param housingLevyContribution - Employee Housing Levy contribution (NEW: allowable deduction)
 * @param insurancePremiums - Optional insurance premiums
 * @param isDisabled - Whether employee has disability exemption
 * @returns PAYE amount
 */
export function calculateMonthlyPAYE(
  grossSalary: number,
  nssfContribution: number,
  shifContribution: number = 0,
  housingLevyContribution: number = 0,
  insurancePremiums?: InsuranceReliefInput,
  isDisabled: boolean = false
): number {
  // NEW FORMULA: Taxable Income = Gross - NSSF - SHIF - Housing Levy
  const taxableIncome = grossSalary - nssfContribution - shifContribution - housingLevyContribution
  const payeResult = calculatePAYE(taxableIncome, insurancePremiums, isDisabled)
  return payeResult.netTax
}

/**
 * Get PAYE calculation breakdown for display purposes
 * UPDATED: Now accepts SHIF and Housing Levy as allowable deductions
 * @param grossSalary - Total gross salary
 * @param nssfContribution - Employee NSSF contribution
 * @param shifContribution - Employee SHIF contribution (NEW: allowable deduction)
 * @param housingLevyContribution - Employee Housing Levy contribution (NEW: allowable deduction)
 * @param insurancePremiums - Optional insurance premiums
 * @param isDisabled - Whether employee has disability exemption
 * @returns Detailed PAYE breakdown
 */
export function getPAYEBreakdown(
  grossSalary: number,
  nssfContribution: number,
  shifContribution: number = 0,
  housingLevyContribution: number = 0,
  insurancePremiums?: InsuranceReliefInput,
  isDisabled: boolean = false
): PayeCalculationResult {
  // NEW FORMULA: Taxable Income = Gross - NSSF - SHIF - Housing Levy
  const taxableIncome = grossSalary - nssfContribution - shifContribution - housingLevyContribution
  return calculatePAYE(taxableIncome, insurancePremiums, isDisabled)
}

/**
 * Calculate annual PAYE from monthly figures
 * @param monthlyGrossSalary - Monthly gross salary
 * @param monthlyNssfContribution - Monthly NSSF contribution
 * @param monthlyShifContribution - Monthly SHIF contribution
 * @param monthlyHousingLevyContribution - Monthly Housing Levy contribution
 * @returns Annual PAYE amount
 */
export function calculateAnnualPAYE(
  monthlyGrossSalary: number,
  monthlyNssfContribution: number,
  monthlyShifContribution: number = 0,
  monthlyHousingLevyContribution: number = 0
): number {
  // For annual calculation, multiply monthly by 12
  const monthlyPaye = calculateMonthlyPAYE(
    monthlyGrossSalary, 
    monthlyNssfContribution,
    monthlyShifContribution,
    monthlyHousingLevyContribution
  )
  return monthlyPaye * 12
}

/**
 * Calculate marginal tax rate for given income level
 * @param taxableIncome - Taxable income level
 * @returns Marginal tax rate as percentage
 */
export function calculateMarginalTaxRate(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0
  
  // Find the tax band this income falls into
  for (const band of KRA_TAX_BANDS) {
    if (taxableIncome >= band.min && taxableIncome <= band.max) {
      return band.rate * 100
    }
  }
  
  // Default to highest rate (shouldn't reach here)
  return KRA_TAX_BANDS[KRA_TAX_BANDS.length - 1].rate * 100
}

/**
 * Calculate effective tax rate
 * UPDATED: Now includes all allowable deductions
 * @param grossSalary - Gross salary
 * @param nssfContribution - NSSF contribution
 * @param shifContribution - SHIF contribution
 * @param housingLevyContribution - Housing Levy contribution
 * @returns Effective tax rate as percentage
 */
export function calculateEffectiveTaxRate(
  grossSalary: number,
  nssfContribution: number,
  shifContribution: number = 0,
  housingLevyContribution: number = 0
): number {
  if (grossSalary <= 0) return 0
  
  const payeAmount = calculateMonthlyPAYE(
    grossSalary, 
    nssfContribution,
    shifContribution,
    housingLevyContribution
  )
  return (payeAmount / grossSalary) * 100
}

/**
 * Validate PAYE calculation inputs
 * @param grossSalary - Gross salary
 * @param nssfContribution - NSSF contribution
 * @param shifContribution - SHIF contribution
 * @param housingLevyContribution - Housing Levy contribution
 * @returns Validation result
 */
export function validatePAYEInputs(
  grossSalary: number,
  nssfContribution: number,
  shifContribution: number = 0,
  housingLevyContribution: number = 0
): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (grossSalary < 0) {
    errors.push('Gross salary cannot be negative')
  }
  
  if (nssfContribution < 0) {
    errors.push('NSSF contribution cannot be negative')
  }
  
  if (shifContribution < 0) {
    errors.push('SHIF contribution cannot be negative')
  }
  
  if (housingLevyContribution < 0) {
    errors.push('Housing Levy contribution cannot be negative')
  }
  
  const totalDeductions = nssfContribution + shifContribution + housingLevyContribution
  if (totalDeductions > grossSalary) {
    errors.push('Total allowable deductions cannot exceed gross salary')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format PAYE calculation for display
 * @param payeResult - PAYE calculation result
 * @returns Formatted string representation
 */
export function formatPAYECalculation(payeResult: PayeCalculationResult): string {
  let formatted = '=== PAYE TAX CALCULATION ===\n\n'
  formatted += `Taxable Income: KSh ${payeResult.taxableIncome.toLocaleString()}\n\n`
  
  formatted += 'TAX BAND BREAKDOWN:\n'
  payeResult.taxBandBreakdown.forEach((band) => {
    const maxDisplay = band.max === 'Above' ? 'Above' : `KSh ${band.max.toLocaleString()}`
    formatted += `Band ${band.band}: ${band.description}\n`
    formatted += `  Range: KSh ${band.min.toLocaleString()} - ${maxDisplay}\n`
    formatted += `  Rate: ${(band.rate * 100).toFixed(1)}%\n`
    formatted += `  Taxable: KSh ${band.taxableAmount.toLocaleString()}\n`
    formatted += `  Tax: KSh ${band.tax.toLocaleString()}\n\n`
  })
  
  formatted += `Gross Tax: KSh ${payeResult.grossTax.toLocaleString()}\n`
  formatted += `Less: Personal Relief: KSh ${payeResult.personalRelief.toLocaleString()}\n`
  
  if (payeResult.insuranceRelief > 0) {
    formatted += `Less: Insurance Relief: KSh ${payeResult.insuranceRelief.toLocaleString()}\n`
  }
  
  formatted += `\nNET PAYE TAX: KSh ${payeResult.netTax.toLocaleString()}\n`
  formatted += `Effective Tax Rate: ${payeResult.effectiveRate.toFixed(2)}%\n`
  
  return formatted
}

/**
 * Demonstrate the impact of December 2024 Tax Law changes
 * Shows comparison between old and new calculation methods
 */
export function demonstrateTaxLawImpact(grossSalary: number): {
  oldMethod: {
    taxableIncome: number
    paye: number
    netPay: number
  }
  newMethod: {
    taxableIncome: number
    paye: number
    netPay: number
  }
  savings: {
    taxSaved: number
    additionalTakeHome: number
    percentageIncrease: number
  }
} {
  // Assume standard contributions
  const nssf = Math.min(grossSalary * 0.06, 2160)
  const shif = Math.min(Math.max(grossSalary * 0.0275, 300), 5000)
  const housingLevy = grossSalary * 0.015
  
  // OLD METHOD (SHIF and Housing Levy not allowable)
  const oldTaxableIncome = grossSalary - nssf
  const oldPaye = calculatePAYE(oldTaxableIncome).netTax
  const oldNetPay = grossSalary - nssf - shif - housingLevy - oldPaye
  
  // NEW METHOD (SHIF and Housing Levy allowable)
  const newTaxableIncome = grossSalary - nssf - shif - housingLevy
  const newPaye = calculatePAYE(newTaxableIncome).netTax
  const newNetPay = grossSalary - nssf - shif - housingLevy - newPaye
  
  const taxSaved = oldPaye - newPaye
  const additionalTakeHome = newNetPay - oldNetPay
  const percentageIncrease = oldNetPay > 0 ? (additionalTakeHome / oldNetPay) * 100 : 0
  
  return {
    oldMethod: {
      taxableIncome: Math.round(oldTaxableIncome * 100) / 100,
      paye: Math.round(oldPaye * 100) / 100,
      netPay: Math.round(oldNetPay * 100) / 100
    },
    newMethod: {
      taxableIncome: Math.round(newTaxableIncome * 100) / 100,
      paye: Math.round(newPaye * 100) / 100,
      netPay: Math.round(newNetPay * 100) / 100
    },
    savings: {
      taxSaved: Math.round(taxSaved * 100) / 100,
      additionalTakeHome: Math.round(additionalTakeHome * 100) / 100,
      percentageIncrease: Math.round(percentageIncrease * 100) / 100
    }
  }
}