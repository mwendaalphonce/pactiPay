// src/lib/validations.ts

import { z } from 'zod'
import { KRA_PIN_PATTERN, NATIONAL_ID_PATTERN, BANK_ACCOUNT_PATTERN } from '@/lib/constants/kenya-tax-rates'

/**
 * Validation schemas for Kenya Payroll System
 * Using Zod for runtime validation and TypeScript inference
 */

// Employee validation schema with P10 fields
export const employeeSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  kraPin: z.string()
    .regex(KRA_PIN_PATTERN, 'KRA PIN must be in format A123456789Z (1 letter, 9 digits, 1 letter)')
    .length(11, 'KRA PIN must be exactly 11 characters'),
  
  nationalId: z.string()
    .regex(NATIONAL_ID_PATTERN, 'National ID must be 8 digits')
    .length(8, 'National ID must be exactly 8 digits'), 
  
  employeeNumber: z.string()
    .min(1, 'Employee number is required')
    .max(20, 'Employee number must not exceed 20 characters')
    .nullable()
    .optional(),
  
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  
  phoneNumber: z.string()
    .regex(/^(\+254|0)[17]\d{8}$/, 'Invalid Kenyan phone number')
    .optional()
    .or(z.literal('')),
  
  address: z.string()
    .max(200, 'Address must not exceed 200 characters')
    .optional(),
  
  bankName: z.string()
    .min(2, 'Bank name must be at least 2 characters')
    .max(50, 'Bank name must not exceed 50 characters'),
  
  bankBranch: z.string()
    .min(2, 'Bank branch must be at least 2 characters')
    .max(50, 'Bank branch must not exceed 50 characters'),
  
  bankAccount: z.string()
    .regex(BANK_ACCOUNT_PATTERN, 'Bank account must be 10-16 digits')
    .min(10, 'Bank account must be at least 10 digits')
    .max(16, 'Bank account must not exceed 16 digits'),
  
  swiftCode: z.string()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT code format')
    .optional()
    .or(z.literal('')),
  
  basicSalary: z.number()
    .min(15201, 'Basic salary must meet minimum wage requirement (KSh 15,201 for Nairobi)')
    .max(10000000, 'Basic salary seems unusually high, please verify')
    .positive('Basic salary must be positive'),
  
  allowances: z.number()
    .min(0, 'Allowances cannot be negative')
    .max(5000000, 'Allowances seem unusually high, please verify')
    .default(0),
  
  startDate: z.string()
    .or(z.date())
    .transform((val) => {
      if (typeof val === 'string') {
        const date = new Date(val)
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format')
        }
        return date
      }
      return val
    })
    .refine((date) => date <= new Date(), 'Start date cannot be in the future'),
  
  contractType: z.enum(['PERMANENT', 'CONTRACT', 'CASUAL', 'INTERN'], {
    errorMap: () => ({ message: 'Contract type must be PERMANENT, CONTRACT, CASUAL, or INTERN' })
  }).or(z.enum(['permanent', 'contract', 'casual', 'intern']))
  .transform((val) => val.toUpperCase() as 'PERMANENT' | 'CONTRACT' | 'CASUAL' | 'INTERN'),
  
  isActive: z.boolean().optional(),
  
  // ========== P10-SPECIFIC FIELDS ==========
  
  // Residential & Employment Type
  residentialStatus: z.enum(['RESIDENT', 'NON_RESIDENT'], {
    errorMap: () => ({ message: 'Residential status must be RESIDENT or NON_RESIDENT' })
  }).default('RESIDENT'),
  
  employeeType: z.enum(['PRIMARY', 'SECONDARY'], {
    errorMap: () => ({ message: 'Employee type must be PRIMARY or SECONDARY' })
  }).default('PRIMARY'),
  
  // Allowances Breakdown (for P10 reporting)
  housingAllowance: z.number()
    .min(0, 'Housing allowance cannot be negative')
    .max(2000000, 'Housing allowance seems unusually high')
    .default(0),
  
  transportAllowance: z.number()
    .min(0, 'Transport allowance cannot be negative')
    .max(500000, 'Transport allowance seems unusually high')
    .default(0),
  
  leavePay: z.number()
    .min(0, 'Leave pay cannot be negative')
    .max(1000000, 'Leave pay seems unusually high')
    .default(0),
  
  otherAllowances: z.number()
    .min(0, 'Other allowances cannot be negative')
    .max(2000000, 'Other allowances seem unusually high')
    .default(0),
  
  // Pension/Retirement Information
  pensionScheme: z.boolean()
    .default(false),
  
  pensionSchemeNo: z.string()
    .max(50, 'Pension scheme number must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  
  // Housing/Accommodation Benefits
  housingBenefit: z.enum([
    'NOT_PROVIDED',
    'EMPLOYER_OWNED',
    'EMPLOYER_RENTED',
    'AGRICULTURE_FARM'
  ], {
    errorMap: () => ({ message: 'Invalid housing benefit type' })
  }).default('NOT_PROVIDED'),
  
  valueOfQuarters: z.number()
    .min(0, 'Value of quarters cannot be negative')
    .max(5000000, 'Value of quarters seems unusually high')
    .default(0),
  
  actualRent: z.number()
    .min(0, 'Actual rent cannot be negative')
    .max(5000000, 'Actual rent seems unusually high')
    .default(0),
  
  // Tax Relief Information
  ownerOccupierInterest: z.number()
    .min(0, 'Owner occupier interest cannot be negative')
    .max(25000, 'Owner occupier interest relief is capped at KSh 25,000/month')
    .default(0),
})
.refine(
  (data) => {
    // If pension scheme is true, pension scheme number must be provided
    if (data.pensionScheme && !data.pensionSchemeNo?.trim()) {
      return false
    }
    return true
  },
  {
    message: 'Pension scheme registration number is required when enrolled in a pension scheme',
    path: ['pensionSchemeNo']
  }
)
.refine(
  (data) => {
    // If housing benefit is provided, value of quarters should be specified
    if (data.housingBenefit !== 'NOT_PROVIDED' && data.valueOfQuarters === 0) {
      return false
    }
    return true
  },
  {
    message: 'Value of quarters must be specified when housing benefit is provided',
    path: ['valueOfQuarters']
  }
)

// Payroll input validation schema
export const payrollInputSchema = z.object({
  employeeId: z.string()
    .min(1, 'Employee ID is required'),
  
  monthYear: z.string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month year must be in YYYY-MM format')
    .refine((val) => {
      const [year, month] = val.split('-').map(Number)
      const inputDate = new Date(year, month - 1)
      const currentDate = new Date()
      const twoYearsAgo = new Date(currentDate.getFullYear() - 2, currentDate.getMonth())
      const sixMonthsAhead = new Date(currentDate.getFullYear(), currentDate.getMonth() + 6)
      
      return inputDate >= twoYearsAgo && inputDate <= sixMonthsAhead
    }, 'Month year must be within reasonable range (not more than 2 years ago or 6 months in future)'),
  
  overtimeHours: z.number()
    .min(0, 'Overtime hours cannot be negative')
    .max(100, 'Overtime hours seem excessive (max 100 hours)')
    .default(0),
  
  overtimeType: z.enum(['weekday', 'holiday'], {
    errorMap: () => ({ message: 'Overtime type must be weekday or holiday' })
  }).default('weekday'),
  
  unpaidDays: z.number()
    .min(0, 'Unpaid days cannot be negative')
    .max(31, 'Unpaid days cannot exceed 31')
    .int('Unpaid days must be a whole number')
    .default(0),
  
  customDeductions: z.number()
    .min(0, 'Custom deductions cannot be negative')
    .max(1000000, 'Custom deductions seem unusually high')
    .default(0),
  
  customDeductionDescription: z.string()
    .max(200, 'Custom deduction description must not exceed 200 characters')
    .optional(),
  
  bonuses: z.number()
    .min(0, 'Bonuses cannot be negative')
    .max(5000000, 'Bonus amount seems unusually high')
    .default(0),
  
  bonusDescription: z.string()
    .max(200, 'Bonus description must not exceed 200 characters')
    .optional()
})

// P10 Report Query Schema
export const p10ReportQuerySchema = z.object({
  month: z.string()
    .regex(/^(0[1-9]|1[0-2])$/, 'Month must be in MM format (01-12)'),
  
  year: z.string()
    .regex(/^\d{4}$/, 'Year must be in YYYY format')
    .refine((val) => {
      const year = parseInt(val)
      const currentYear = new Date().getFullYear()
      return year >= 2020 && year <= currentYear + 1
    }, 'Year must be between 2020 and next year'),
  
  format: z.enum(['json', 'csv', 'excel'])
    .default('excel')
    .optional()
})

// Batch payroll schema
export const batchPayrollSchema = z.object({
  monthYear: z.string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month year must be in YYYY-MM format'),
  
  employees: z.array(payrollInputSchema.omit({ monthYear: true }))
    .min(1, 'At least one employee is required')
    .max(500, 'Cannot process more than 500 employees at once')
})

// Employee update schema (allows partial updates)
export const employeeUpdateSchema = employeeSchema.partial().extend({
  id: z.string().min(1, 'Employee ID is required')
})

// Payroll query schema for filtering
export const payrollQuerySchema = z.object({
  monthYear: z.string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month year must be in YYYY-MM format')
    .optional(),
  
  employeeId: z.string()
    .min(1, 'Employee ID cannot be empty')
    .optional(),
  
  page: z.number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .default(1),
  
  limit: z.number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  
  sortBy: z.enum(['createdAt', 'monthYear', 'grossPay', 'netPay', 'employeeName'])
    .default('createdAt'),
  
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc')
})

// Custom deduction schema
export const customDeductionSchema = z.object({
  amount: z.number()
    .min(0, 'Deduction amount cannot be negative')
    .max(1000000, 'Deduction amount seems unusually high'),
  
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description must not exceed 200 characters'),
  
  type: z.enum(['loan', 'advance', 'sacco', 'insurance', 'other'], {
    errorMap: () => ({ message: 'Deduction type must be loan, advance, sacco, insurance, or other' })
  }),
  
  isRecurring: z.boolean().default(false),
  
  startMonth: z.string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Start month must be in YYYY-MM format')
    .optional(),
  
  endMonth: z.string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'End month must be in YYYY-MM format')
    .optional()
})

// Bonus schema
export const bonusSchema = z.object({
  amount: z.number()
    .min(0, 'Bonus amount cannot be negative')
    .max(5000000, 'Bonus amount seems unusually high'),
  
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description must not exceed 200 characters'),
  
  type: z.enum(['performance', 'annual', 'commission', 'overtime_bonus', 'other'], {
    errorMap: () => ({ message: 'Bonus type must be performance, annual, commission, overtime_bonus, or other' })
  }),
  
  taxable: z.boolean().default(true),
  
  paymentMonth: z.string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Payment month must be in YYYY-MM format')
})

// Bank details validation schema
export const bankDetailsSchema = z.object({
  bankName: z.string()
    .min(2, 'Bank name must be at least 2 characters')
    .max(50, 'Bank name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s&.-]+$/, 'Bank name contains invalid characters'),
  
  bankBranch: z.string()
    .min(2, 'Bank branch must be at least 2 characters')
    .max(50, 'Bank branch must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9\s&.-]+$/, 'Bank branch contains invalid characters'),
  
  bankAccount: z.string()
    .regex(BANK_ACCOUNT_PATTERN, 'Bank account must be 10-16 digits')
    .min(10, 'Bank account must be at least 10 digits')
    .max(16, 'Bank account must not exceed 16 digits'),
  
  swiftCode: z.string()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT code format')
    .optional()
})

// Salary adjustment schema
export const salaryAdjustmentSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  
  newBasicSalary: z.number()
    .min(15201, 'Basic salary must meet minimum wage requirement')
    .max(10000000, 'Basic salary seems unusually high'),
  
  newAllowances: z.number()
    .min(0, 'Allowances cannot be negative')
    .max(5000000, 'Allowances seem unusually high')
    .optional(),
  
  effectiveDate: z.string()
    .or(z.date())
    .transform((val) => {
      if (typeof val === 'string') {
        const date = new Date(val)
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format')
        }
        return date
      }
      return val
    }),
  
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters'),
  
  adjustmentType: z.enum(['promotion', 'increment', 'market_adjustment', 'cost_of_living', 'other'])
})

// Export types for TypeScript inference
export type EmployeeInput = z.infer<typeof employeeSchema>
export type PayrollInput = z.infer<typeof payrollInputSchema>
export type BatchPayrollInput = z.infer<typeof batchPayrollSchema>
export type EmployeeUpdate = z.infer<typeof employeeUpdateSchema>
export type PayrollQuery = z.infer<typeof payrollQuerySchema>
export type P10ReportQuery = z.infer<typeof p10ReportQuerySchema>
export type CustomDeduction = z.infer<typeof customDeductionSchema>
export type Bonus = z.infer<typeof bonusSchema>
export type BankDetails = z.infer<typeof bankDetailsSchema>
export type SalaryAdjustment = z.infer<typeof salaryAdjustmentSchema>

// Validation helper functions
export function validateKraPin(kraPin: string): boolean {
  return KRA_PIN_PATTERN.test(kraPin)
}

export function validateNationalId(nationalId: string): boolean {
  return NATIONAL_ID_PATTERN.test(nationalId)
}

export function validateBankAccount(bankAccount: string): boolean {
  return BANK_ACCOUNT_PATTERN.test(bankAccount)
}

export function isValidMonthYear(monthYear: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthYear)
}

/**
 * Custom validation function for cross-field validation
 */
export function validatePayrollInputCrossFields(input: PayrollInput): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check if custom deduction has description when amount > 0
  if (input.customDeductions > 0 && !input.customDeductionDescription?.trim()) {
    errors.push('Custom deduction description is required when custom deduction amount is specified')
  }
  
  // Check if bonus has description when amount > 0
  if (input.bonuses > 0 && !input.bonusDescription?.trim()) {
    errors.push('Bonus description is required when bonus amount is specified')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}