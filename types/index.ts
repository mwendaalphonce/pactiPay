export interface Employee {
  id: string
  companyId: string
  name: string
  kraPin: string
  nationalId: string
  employeeNumber?: string
  bankName: string
  bankBranch: string
  bankAccount: string
  swiftCode?: string
  email?: string
  phoneNumber?: string
  address?: string
  basicSalary: number
  allowances: number
  startDate: string 
  contractType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'CASUAL' | 'INTERN' // ✅ FIX: Uppercase to match Prisma
  isActive: boolean
  residentialStatus: 'RESIDENT' | 'NON_RESIDENT'
  employeeType: 'PRIMARY' | 'SECONDARY'
  housingAllowance?: number
  transportAllowance?: number
  leavePay?: number
  otherAllowances?: number
  pensionScheme: boolean
  pensionSchemeNo?: string
  housingBenefit: 'NOT_PROVIDED' | 'EMPLOYER_OWNED' | 'EMPLOYER_RENTED' | 'AGRICULTURE_FARM'
  valueOfQuarters?: number
  actualRent?: number
  ownerOccupierInterest?: number
  createdAt: string 
  updatedAt: string
}

// Form data type - excludes fields managed by the system
export interface EmployeeFormData {
  id?: string
  name: string
  kraPin: string
  nationalId: string
  employeeNumber?: string
  bankName: string
  bankBranch: string
  bankAccount: string
  swiftCode?: string
  email?: string
  phoneNumber?: string
  address?: string
  basicSalary: number
  allowances: number
  startDate: string
  contractType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'CASUAL' | 'INTERN' // ✅ FIX: Uppercase
  residentialStatus?: 'RESIDENT' | 'NON_RESIDENT'
  employeeType?: 'PRIMARY' | 'SECONDARY'
  housingAllowance?: number
  transportAllowance?: number
  leavePay?: number
  otherAllowances?: number
  pensionScheme?: boolean
  pensionSchemeNo?: string
  housingBenefit?: 'NOT_PROVIDED' | 'EMPLOYER_OWNED' | 'EMPLOYER_RENTED' | 'AGRICULTURE_FARM'
  valueOfQuarters?: number
  actualRent?: number
  ownerOccupierInterest?: number
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
  overtimeType: 'WEEKDAY' | 'HOLIDAY' // ✅ FIX: Uppercase to match Prisma
  
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
  createdAt: string 
  updatedAt: string 
}

export interface PayrollDeductions {
  paye: number
  nssf: number
  shif: number
  housingLevy: number
  taxableIncome: number // ✅ Added - was missing
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
  taxableIncome?: number // ✅ Added for clarity
  // Employer contributions
  nssfEmployer?: number
  shifEmployer?: number
  housingLevyEmployer?: number
}

export interface PayslipData {
  // Company Information
  company: {
    id: string
    name: string
    address?: string
    phone?: string
    email?: string
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
    employeeNumber?: string | null
    email?: string | null
    phone?: string | null
    bankName?: string | null
    bankAccount?: string | null
    position?: string
    department?: string
  }
  
  // Payroll Information
  payroll: {
    id: string
    monthYear: string
    payPeriod: string // e.g., "January 2025"
    payDate: string
    processedDate: string
    status: 'DRAFT' | 'PROCESSING' | 'PROCESSED' | 'APPROVED' | 'PAID' | 'CANCELLED'
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