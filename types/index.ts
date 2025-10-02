export interface Employee {
  id: string
  name: string
  kraPin: string
  nationalId: string
  bankName: string
  bankBranch: string
  bankAccount: string
  basicSalary: number
  allowances: number
  startDate: string
  contractType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'CASUAL'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PayrollRun {
  id: string
  monthYear: string
  employeeId: string
  employee?: Employee
  workingDays: number
  actualDays: number
  overtimeHours: number
  holidayHours: number
  basicPay: number
  allowancesPay: number
  overtimePay: number
  bonuses: number
  grossPay: number
  payeTax: number
  nssfEmployee: number
  shifDeduction: number
  housingLevy: number
  loanDeductions: number
  advanceDeductions: number
  otherDeductions: number
  totalDeductions: number
  netPay: number
  nssfEmployer: number
  housingLevyEmployer: number
  ytdGrossPay: number
  ytdPayeTax: number
  ytdNssf: number
  ytdShif: number
  ytdHousingLevy: number
  ytdNetPay: number
  status: 'CALCULATED' | 'PROCESSED' | 'CANCELLED'
  processedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Payslip {
  id: string
  payslipNumber: string
  employeeId: string
  employee?: Employee
  payrollRunId: string
  payrollRun?: PayrollRun
  payPeriod: string
  issueDate: string
  pdfGenerated: boolean
  pdfPath?: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalPayroll: number
  payslipsGenerated: number
  pendingPayrolls: number
  lastPayrollDate?: string
  monthlyGrowth: number
  complianceStatus: 'good' | 'warning' | 'error'
}

export interface Activity {
  id: string
  type: 'employee_added' | 'payroll_processed' | 'payslip_generated' | 'employee_edited' | 'employee_deleted'
  description: string
  timestamp: string
  user?: string
  metadata?: Record<string, any>
}

export interface PayrollSummaryData {
  currentMonth: string
  totalEmployees: number
  processedEmployees: number
  totalGrossPay: number
  totalNetPay: number
  totalDeductions: number
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  dueDate?: string
  lastProcessedDate?: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Form types
export interface EmployeeFormData {
  name: string
  kraPin: string
  nationalId: string
  bankName: string
  bankBranch: string
  bankAccount: string
  basicSalary: number
  allowances: number
  startDate: string
  contractType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'CASUAL'
}

export interface PayrollCalculationInput {
  employeeId: string
  monthYear: string
  workingDays: number
  actualDays: number
  overtimeHours: number
  holidayHours: number
  bonuses: number
  loanDeductions: number
  advanceDeductions: number
  otherDeductions: number
}