// src/lib/constants/kenya-tax-rates.ts

/**
 * Kenya Tax Rates and Constants for 2025
 * Based on Finance Act 2024 and NSSF Act 2013 (Phase 3 - Effective February 2025)
 */

// PAYE Tax Bands for 2025
export const PAYE_TAX_BANDS = [
  { min: 0, max: 24000, rate: 0.10 }, // 10% on first KSh 24,000
  { min: 24001, max: 32333, rate: 0.25 }, // 25% on next KSh 8,333 (24,001 - 32,333)
  { min: 32334, max: 500000, rate: 0.30 }, // 30% on next KSh 467,667 (32,334 - 500,000)
  { min: 500001, max: 800000, rate: 0.325 }, // 32.5% on next KSh 300,000 (500,001 - 800,000)
  { min: 800001, max: Infinity, rate: 0.35 } // 35% above KSh 800,000
] as const

// Personal Relief (Monthly)
export const PERSONAL_RELIEF = 2400 // KSh 2,400 per month

// NSSF Rates and Limits for 2025 (Phase 3 - Effective February 2025)
export const NSSF_RATES = {
  EMPLOYEE_RATE: 0.06, // 6% of pensionable pay
  EMPLOYER_RATE: 0.06, // 6% of pensionable pay (matches employee)
  LOWER_EARNINGS_LIMIT: 8000, // KSh 8,000 (LEL) - Tier 1 cap
  UPPER_EARNINGS_LIMIT: 72000, // KSh 72,000 (UEL) - Maximum pensionable pay
  MAX_EMPLOYEE_CONTRIBUTION: 4320, // KSh 4,320 (6% of 72,000)
  MAX_EMPLOYER_CONTRIBUTION: 4320, // KSh 4,320 (6% of 72,000)
  MIN_EMPLOYEE_CONTRIBUTION: 480, // KSh 480 (6% of 8,000)
  MIN_EMPLOYER_CONTRIBUTION: 480 // KSh 480 (6% of 8,000)
} as const

// NSSF Tiers (Phase 3 - February 2025)
export const NSSF_TIERS = [
  { 
    tier: 1,
    name: 'Tier I',
    min: 0, 
    max: 8000, 
    rate: 0.06,
    description: 'Lower Earnings Limit (LEL)'
  },
  { 
    tier: 2,
    name: 'Tier II',
    min: 8001, 
    max: 72000, 
    rate: 0.06,
    description: 'Up to Upper Earnings Limit (UEL)'
  }
] as const

// SHIF (Social Health Insurance Fund) - 2025
export const SHIF_RATES = {
  EMPLOYEE_RATE: 0.0275, // 2.75% of gross salary
  EMPLOYER_RATE: 0.0275, // 2.75% of gross salary
  MIN_CONTRIBUTION: 300, // Minimum KSh 300
  MAX_CONTRIBUTION: Infinity // No upper limit
} as const

// Affordable Housing Levy - 2025
export const HOUSING_LEVY_RATES = {
  EMPLOYEE_RATE: 0.015, // 1.5% of gross salary
  EMPLOYER_RATE: 0.015, // 1.5% of gross salary (matches employee)
  MIN_CONTRIBUTION: 0,
  MAX_CONTRIBUTION: Infinity // No upper limit currently
} as const

// Minimum Wages by Region (2025)
export const MINIMUM_WAGES = {
  NAIROBI: {
    GENERAL: 15201, // KSh 15,201 for general workers
    SKILLED: 16500, // KSh 16,500 for skilled workers
    SECURITY: 13500 // KSh 13,500 for security guards
  },
  MOMBASA: {
    GENERAL: 14500,
    SKILLED: 15800,
    SECURITY: 13000
  },
  KISUMU: {
    GENERAL: 13800,
    SKILLED: 15000,
    SECURITY: 12500
  },
  OTHER_URBAN: {
    GENERAL: 13200,
    SKILLED: 14500,
    SECURITY: 12000
  },
  RURAL: {
    GENERAL: 11500,
    SKILLED: 12800,
    SECURITY: 10500
  }
} as const

// Working Days and Hours
export const WORKING_TIME = {
  STANDARD_WORKING_DAYS_PER_MONTH: 22, // Average working days
  STANDARD_WORKING_HOURS_PER_DAY: 8,
  STANDARD_WORKING_HOURS_PER_MONTH: 176, // 22 * 8
  OVERTIME_WEEKDAY_MULTIPLIER: 1.5, // 1.5x for weekday overtime
  OVERTIME_HOLIDAY_MULTIPLIER: 2.0 // 2x for holiday/weekend overtime
} as const

// Currency and Formatting
export const CURRENCY = {
  CODE: 'KES',
  SYMBOL: 'KSh',
  DECIMAL_PLACES: 2
} as const

// Tax Computation Helpers
export const TAX_COMPUTATION = {
  MONTHS_IN_YEAR: 12,
  DAYS_IN_MONTH: 30, // Standard for salary calculations
  ROUNDING_PRECISION: 2 // Round to 2 decimal places
} as const

// Statutory Deduction Types
export const DEDUCTION_TYPES = {
  PAYE: 'PAYE',
  NSSF: 'NSSF',
  SHIF: 'SHIF',
  HOUSING_LEVY: 'Housing Levy',
  CUSTOM: 'Custom Deduction'
} as const

// Employment Contract Types
export const CONTRACT_TYPES = {
  PERMANENT: 'permanent',
  CONTRACT: 'contract',
  CASUAL: 'casual',
  INTERN: 'intern'
} as const

// KRA PIN Validation Pattern
export const KRA_PIN_PATTERN = /^[A-Z][0-9]{9}[A-Z]$/

// National ID Pattern (8 digits)
export const NATIONAL_ID_PATTERN = /^[0-9]{8}$/

// Bank Account Pattern (basic validation)
export const BANK_ACCOUNT_PATTERN = /^[0-9]{10,16}$/

// Payroll Calculation Constants
export const CALCULATION_CONSTANTS = {
  // Maximum salary subject to NSSF (Upper Earnings Limit)
  MAX_NSSF_PENSIONABLE_PAY: 72000,
  
  // Lower Earnings Limit for NSSF
  MIN_NSSF_PENSIONABLE_PAY: 8000,
  
  // Minimum taxable income (after NSSF deduction)
  MIN_TAXABLE_INCOME: 0,
  
  // Minimum SHIF contribution (no maximum limit)
  MIN_SHIF_MONTHLY: 300
} as const

// Export all constants as a single object for convenience
export const KENYA_TAX_CONFIG = {
  PAYE_TAX_BANDS,
  PERSONAL_RELIEF,
  NSSF_RATES,
  NSSF_TIERS,
  SHIF_RATES,
  HOUSING_LEVY_RATES,
  MINIMUM_WAGES,
  WORKING_TIME,
  CURRENCY,
  TAX_COMPUTATION,
  DEDUCTION_TYPES,
  CONTRACT_TYPES,
  CALCULATION_CONSTANTS
} as const

// Type definitions for better TypeScript support
export type PayeTaxBand = typeof PAYE_TAX_BANDS[number]
export type NssfTier = typeof NSSF_TIERS[number]
export type ContractType = keyof typeof CONTRACT_TYPES
export type DeductionType = keyof typeof DEDUCTION_TYPES
export type MinimumWageRegion = keyof typeof MINIMUM_WAGES