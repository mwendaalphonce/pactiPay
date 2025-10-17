
export interface Employee {
  id: string
  name: string
  kraPin: string
  nationalId: string
  employeeNumber?: string
  bankName: string
  bankBranch: string
  bankAccount: string
  swiftCode?: string
  basicSalary: number
  allowances: number
  startDate: string | Date
  contractType: 'PERMANENT' | 'CONTRACT' | 'CASUAL' | 'INTERN'
  isActive: boolean
  email?: string
  phoneNumber?: string
  address?: string
  createdAt: string | Date
  updatedAt: string | Date
  isDisabled?: boolean
  insurancePremiums?: InsurancePremium
}

export interface InsurancePremium {
  id?: string
  lifeInsurance?: number
  educationPolicy?: number
  healthInsurance?: number
}

export interface PayrollRun {
  id: string
  employeeId: string
  employee?: Employee
  monthYear: string // YYYY-MM format
  
  // Earnings
  basicSalary: number
  allowances: number
  overtime: number
  bonuses: number
  grossPay: number
  
  // Overtime Details
  overtimeHours: number
  overtimeType: 'WEEKDAY' | 'HOLIDAY'
  
  // Bonus Details
  bonusDescription?: string
  
  // Unpaid Leave
  unpaidDays: number
  unpaidDeduction: number
  
  // Statutory Deductions (Dec 2024 Tax Law)
  paye: number
  nssf: number
  shif: number
  housingLevy: number
  taxableIncome: number
  
  // Custom Deductions
  customDeductions: number
  
  // Totals
  totalDeductions: number
  netPay: number
  
  // Additional Data (JSON fields)
  deductions?: PayrollDeductions
  earnings?: PayrollEarnings
  calculations?: PayrollCalculations
  
  // Processing Info
  processedAt: string | Date
  processedBy?: string
  status: 'DRAFT' | 'PROCESSING' | 'PROCESSED' | 'APPROVED' | 'PAID' | 'CANCELLED'
  
  // Timestamps
  createdAt: string | Date
  updatedAt: string | Date
}

export interface PayrollDeductions {
  paye: number
  nssf: number
  shif: number
  housingLevy: number
  customDeductions: number
  customDeductionDescription?: string
  totalStatutory: number
  totalDeductions: number
  // Additional breakdown
  personalRelief?: number
  insuranceRelief?: number
  grossTax?: number
}

export interface PayrollEarnings {
  basicSalary: number
  allowances: number
  overtime: number
  bonuses: number
  grossPay: number
}

export interface PayrollCalculations {
  workingDays: number
  dailyRate: number
  hourlyRate: number
  unpaidDeduction: number
  effectiveTaxRate: number
  // Employer contributions
  nssfEmployer?: number
  shifEmployer?: number
  housingLevyEmployer?: number
}

export interface PayslipData {
  // Company Information
  company: {
    name: string
    address: string
    phone: string
    email: string
    kraPin?: string
    logo?: string | null
    signatoryName?: string | null
    signatoryTitle?: string | null
    signatorySignature?: string | null
  }
  
  // Employee Information
  employee: {
    id: string
    name: string
    kraPin: string
    nationalId: string
    employeeNumber?: string
    bankName: string
    bankAccount: string
    position?: string
    department?: string
  }
  
  // Payroll Information
  payroll: {
    monthYear: string
    payPeriod: string // e.g., "January 2025"
    payDate: string
    processedDate: string
  }
  
  // Earnings
  earnings: {
    basicSalary: number
    allowances: number
    overtime: number
    overtimeHours: number
    bonuses: number
    bonusDescription?: string
    grossPay: number
  }
  
  // Deductions
  deductions: {
    // Allowable Deductions (Dec 2024 Tax Law)
    nssf: number
    shif: number
    housingLevy: number
    totalAllowable: number
    
    // Tax
    taxableIncome: number
    grossTax: number
    personalRelief: number
    insuranceRelief: number
    paye: number
    
    // Other
    customDeductions: number
    customDeductionDescription?: string
    totalDeductions: number
  }
  
  // Net Pay
  netPay: number
  
  // Employer Contributions
  employerContributions: {
    nssf: number
    shif: number
    housingLevy: number
    total: number
  }
  
  // Additional Info
  additionalInfo?: {
    unpaidDays?: number
    unpaidDeduction?: number
    effectiveTaxRate?: number
    ytdGrossPay?: number
    ytdNetPay?: number
    ytdPaye?: number
  }
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}