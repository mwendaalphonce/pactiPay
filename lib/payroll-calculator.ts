// lib/payroll-calculator.ts

/**
 * Updated Payroll Calculator for Kenya 2025
 * CRITICAL UPDATE: December 2024 Tax Laws Amendment Act
 * 
 * MAJOR CHANGE:
 * - SHIF and Housing Levy are NOW ALLOWABLE DEDUCTIONS
 * - They reduce taxable income BEFORE PAYE calculation
 * - Order: Gross Pay → NSSF → SHIF → AHL → Taxable Income → PAYE
 */

interface Employee {
  id: string
  name: string
  kraPin: string
  basicSalary: number
  allowances: number
  deductions: Array<{
    amount: number
    type: string
  }>
  bonuses: Array<{
    amount: number
    isTaxable: boolean
  }>
  isDisabled?: boolean
  insurancePremiums?: {
    lifeInsurance?: number
    educationPolicy?: number
    healthInsurance?: number
  }
}

interface PayrollCalculation {
  basicSalary: number
  allowances: number
  overtime: number
  bonuses: number
  nonTaxableBonuses: number
  grossPay: number
  
  // Allowable deductions (NEW: includes SHIF and Housing Levy)
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
  totalDeductions: number
  netPay: number
  
  // Additional info
  overtimeHours?: number
  unpaidDays?: number
  unpaidDeduction?: number
  
  // Employer contributions
  nssfEmployer: number
  shifEmployer: number
  housingLevyEmployer: number
  effectiveTaxRate: number
  
  // Breakdowns
  deductionsBreakdown: {
    loan: number
    advance: number
    other: number
  }
  earningsBreakdown: {
    basicSalary: number
    allowances: number
    overtime: number
    bonuses: number
    nonTaxableBonuses: number
  }
  taxBreakdown: {
    taxableIncome: number
    grossTax: number
    personalRelief: number
    insuranceRelief: number
    netPaye: number
    bands: Array<{
      description: string
      rate: number
      amount: number
      tax: number
    }>
  }
}

/**
 * Calculate payroll for an employee - UPDATED FOR DEC 2024 TAX LAW
 */
export async function calculatePayrollForEmployee(
  employee: Employee,
  monthYear: string,
  workingDays: number,
  overtimeHours: number = 0,
  unpaidDays: number = 0
): Promise<PayrollCalculation> {
  // Calculate earnings
  const basicSalary = employee.basicSalary
  const allowances = employee.allowances
  
  const hourlyRate = basicSalary / 22 / 8
  const overtime = overtimeHours * hourlyRate * 1.5
  
  const dailyRate = basicSalary / 22
  const unpaidDeduction = unpaidDays * dailyRate
  const adjustedBasicSalary = Math.max(0, basicSalary - unpaidDeduction)
  
  const bonuses = employee.bonuses.reduce((sum, b) => sum + (b.isTaxable ? b.amount : 0), 0)
  const nonTaxableBonuses = employee.bonuses.reduce((sum, b) => sum + (b.isTaxable ? 0 : b.amount), 0)

  const grossPay = adjustedBasicSalary + allowances + overtime + bonuses

  // Calculate ALLOWABLE DEDUCTIONS (in order, all reduce taxable income)
  
  // 1. NSSF
  const nssfResult = calculateNSSF(grossPay)
  const nssf = nssfResult.employee
  const nssfEmployer = nssfResult.employer
  
  // 2. SHIF (NEW: now allowable deduction)
  const shifResult = calculateSHIF(grossPay)
  const shif = shifResult.employee
  const shifEmployer = shifResult.employer
  
  // 3. Housing Levy (NEW: now allowable deduction)
  const housingLevyResult = calculateHousingLevy(grossPay)
  const housingLevy = housingLevyResult.employee
  const housingLevyEmployer = housingLevyResult.employer
  
  // Total allowable deductions
  const totalAllowableDeductions = nssf + shif + housingLevy
  
  // Calculate TAXABLE INCOME (NEW FORMULA)
  // Taxable Income = Gross Pay - NSSF - SHIF - Housing Levy
  const taxableIncome = grossPay - totalAllowableDeductions
  
  // Calculate PAYE on taxable income
  const payeResult = calculatePAYE(
    taxableIncome,
    employee.insurancePremiums,
    employee.isDisabled || false
  )
  const paye = payeResult.netTax
  const grossTax = payeResult.grossTax
  const personalRelief = payeResult.personalRelief
  const insuranceRelief = payeResult.insuranceRelief

  // Calculate custom deductions
  const customDeductions = employee.deductions.reduce((sum, d) => sum + d.amount, 0)

  // Total deductions
  const totalDeductions = paye + nssf + shif + housingLevy + customDeductions

  // Net pay
  const netPay = grossPay - totalDeductions + nonTaxableBonuses

  // Calculate effective tax rate
  const effectiveTaxRate = grossPay > 0 ? (paye / grossPay) * 100 : 0

  return {
    basicSalary: adjustedBasicSalary,
    allowances,
    overtime,
    bonuses,
    nonTaxableBonuses,
    grossPay,
    
    // Allowable deductions
    nssf,
    shif,
    housingLevy,
    totalAllowableDeductions,
    
    // Tax
    taxableIncome,
    grossTax,
    personalRelief,
    insuranceRelief,
    paye,
    
    customDeductions,
    totalDeductions,
    netPay,
    overtimeHours,
    unpaidDays,
    unpaidDeduction,
    nssfEmployer,
    shifEmployer,
    housingLevyEmployer,
    effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100,
    deductionsBreakdown: {
      loan: employee.deductions.filter(d => d.type === 'LOAN').reduce((sum, d) => sum + d.amount, 0),
      advance: employee.deductions.filter(d => d.type === 'ADVANCE').reduce((sum, d) => sum + d.amount, 0),
      other: employee.deductions.filter(d => !['LOAN', 'ADVANCE'].includes(d.type)).reduce((sum, d) => sum + d.amount, 0),
    },
    earningsBreakdown: {
      basicSalary: adjustedBasicSalary,
      allowances,
      overtime,
      bonuses,
      nonTaxableBonuses,
    },
    taxBreakdown: payeResult
  }
}

/**
 * NSSF Calculation (unchanged)
 */
function calculateNSSF(grossPay: number): { employee: number; employer: number } {
  const pensionablePay = grossPay
  const tier1Limit = 7000
  const tier2Limit = 36000
  const rate = 0.06

  let employeeContribution = 0

  if (pensionablePay > 0) {
    const tier1Pay = Math.min(pensionablePay, tier1Limit)
    employeeContribution += tier1Pay * rate
  }

  if (pensionablePay > tier1Limit) {
    const tier2Pay = Math.min(pensionablePay - tier1Limit, tier2Limit - tier1Limit)
    employeeContribution += tier2Pay * rate
  }

  const employerContribution = employeeContribution

  return {
    employee: Math.round(employeeContribution * 100) / 100,
    employer: Math.round(employerContribution * 100) / 100
  }
}

/**
 * PAYE Calculation - UPDATED FOR DEC 2024
 * Now receives taxableIncome AFTER all allowable deductions
 */
function calculatePAYE(
  taxableIncome: number,
  insurancePremiums?: {
    lifeInsurance?: number
    educationPolicy?: number
    healthInsurance?: number
  },
  isDisabled: boolean = false
): {
  netTax: number
  grossTax: number
  personalRelief: number
  insuranceRelief: number
  effectiveRate: number
  taxableIncome: number
  bands: Array<{
    description: string
    rate: number
    amount: number
    tax: number
  }>
} {
  const adjustedTaxableIncome = Math.max(0, taxableIncome)

  if (isDisabled && adjustedTaxableIncome <= 150000) {
    return {
      netTax: 0,
      grossTax: 0,
      personalRelief: 0,
      insuranceRelief: 0,
      effectiveRate: 0,
      taxableIncome: adjustedTaxableIncome,
      bands: [{
        description: 'Disability Exemption',
        rate: 0,
        amount: adjustedTaxableIncome,
        tax: 0
      }]
    }
  }

  const bands = [
    { min: 0, max: 24000, rate: 0.10, description: 'First KSh 24,000' },
    { min: 24001, max: 32333, rate: 0.25, description: 'Next KSh 8,333' },
    { min: 32334, max: 500000, rate: 0.30, description: 'Next KSh 467,667' },
    { min: 500001, max: 800000, rate: 0.325, description: 'Next KSh 300,000' },
    { min: 800001, max: Infinity, rate: 0.35, description: 'Above KSh 800,000' }
  ]

  let grossTax = 0
  const taxBands: Array<{ description: string; rate: number; amount: number; tax: number }> = []

  for (const band of bands) {
    let taxableInBand = 0

    if (adjustedTaxableIncome > band.min) {
      if (band.max === Infinity) {
        taxableInBand = adjustedTaxableIncome - band.min
      } else {
        taxableInBand = Math.min(adjustedTaxableIncome, band.max) - band.min
      }
      taxableInBand = Math.max(0, taxableInBand)
    }

    if (taxableInBand > 0) {
      const taxInBand = taxableInBand * band.rate
      grossTax += taxInBand

      taxBands.push({
        description: band.description,
        rate: band.rate * 100,
        amount: taxableInBand,
        tax: taxInBand
      })
    }
  }

  let insuranceRelief = 0
  if (insurancePremiums) {
    const totalPremiums = (insurancePremiums.lifeInsurance || 0) +
                          (insurancePremiums.educationPolicy || 0) +
                          (insurancePremiums.healthInsurance || 0)
    insuranceRelief = Math.min(totalPremiums * 0.15, 5000)
  }

  const personalRelief = Math.min(2400, grossTax)
  const taxAfterPersonalRelief = Math.max(0, grossTax - personalRelief)
  insuranceRelief = Math.min(insuranceRelief, taxAfterPersonalRelief)

  const netTax = Math.max(0, grossTax - personalRelief - insuranceRelief)
  const effectiveRate = adjustedTaxableIncome > 0 ? (netTax / adjustedTaxableIncome) * 100 : 0

  return {
    netTax: Math.round(netTax * 100) / 100,
    grossTax: Math.round(grossTax * 100) / 100,
    personalRelief: Math.round(personalRelief * 100) / 100,
    insuranceRelief: Math.round(insuranceRelief * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    taxableIncome: adjustedTaxableIncome,
    bands: taxBands.map(b => ({
      ...b,
      amount: Math.round(b.amount * 100) / 100,
      tax: Math.round(b.tax * 100) / 100
    }))
  }
}

/**
 * SHIF Calculation (unchanged)
 */
function calculateSHIF(grossPay: number): { employee: number; employer: number } {
  const employeeRate = 0.0275
  const employeeContribution = grossPay * employeeRate
  const employerContribution = employeeContribution

  return {
    employee: Math.round(employeeContribution * 100) / 100,
    employer: Math.round(employerContribution * 100) / 100
  }
}

/**
 * Housing Levy Calculation (unchanged)
 */
function calculateHousingLevy(grossPay: number): { employee: number; employer: number } {
  const rate = 0.015
  const contribution = grossPay * rate

  return {
    employee: Math.round(contribution * 100) / 100,
    employer: Math.round(contribution * 100) / 100
  }
}

/**
 * COMPARISON EXAMPLE: Old vs New Tax Law
 */
export function demonstrateTaxLawChange() {
  const grossPay = 100000
  
  
  // OLD WAY (Before Dec 2024)
  const nssfOld = calculateNSSF(grossPay)
  const taxableIncomeOld = grossPay - nssfOld.employee
  const shifOld = calculateSHIF(grossPay)
  const hlOld = calculateHousingLevy(grossPay)
  const payeOld = calculatePAYE(taxableIncomeOld)
  
  const totalDeductionsOld = payeOld.netTax + nssfOld.employee + shifOld.employee + hlOld.employee
  const netPayOld = grossPay - totalDeductionsOld
  
  // NEW WAY (After Dec 2024)
  const nssfNew = calculateNSSF(grossPay)
  const shifNew = calculateSHIF(grossPay)
  const hlNew = calculateHousingLevy(grossPay)
  const taxableIncomeNew = grossPay - nssfNew.employee - shifNew.employee - hlNew.employee
  const payeNew = calculatePAYE(taxableIncomeNew)
  
  const totalDeductionsNew = payeNew.netTax + nssfNew.employee + shifNew.employee + hlNew.employee
  const netPayNew = grossPay - totalDeductionsNew
  
  // Show the difference
  const savingsFromNewLaw = netPayNew - netPayOld
}

export function validatePayrollInputs(employee: Employee): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!employee.name?.trim()) errors.push('Employee name is required')
  if (!employee.kraPin?.match(/^[A-Z][0-9]{9}[A-Z]$/)) {
    errors.push('Invalid KRA PIN format (should be A123456789Z)')
  }
  if (employee.basicSalary < 0) errors.push('Basic salary cannot be negative')
  if (employee.allowances < 0) errors.push('Allowances cannot be negative')

  if (employee.deductions) {
    employee.deductions.forEach((d, index) => {
      if (d.amount < 0) errors.push(`Deduction ${index + 1} amount cannot be negative`)
    })
  }

  if (employee.bonuses) {
    employee.bonuses.forEach((b, index) => {
      if (b.amount < 0) errors.push(`Bonus ${index + 1} amount cannot be negative`)
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}