// src/lib/db-utils.ts

import { prisma, withTransaction, DatabaseError } from './prisma'
import { calculatePayroll, PayrollCalculationResult } from './payroll/calculations'
import type { Employee, PayrollRun, ContractType, PayrollStatus } from '@prisma/client'

/**
 * Database utility functions for Kenya Payroll System
 */

// Employee utilities
export const employeeUtils = {
  /**
   * Get employee with recent payroll history
   */
  async getEmployeeWithPayrollHistory(employeeId: string, months: number = 6) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          payrollRuns: {
            orderBy: { monthYear: 'desc' },
            take: months,
            include: {
              employee: {
                select: { name: true, kraPin: true }
              }
            }
          },
          salaryAdjustments: {
            orderBy: { effectiveDate: 'desc' },
            take: 5
          },
          deductions: {
            where: { isActive: true }
          },
          bonuses: {
            where: { isProcessed: false }
          }
        }
      })

      if (!employee) {
        throw new DatabaseError('Employee not found')
      }

      return employee
    } catch (error) {
      throw new DatabaseError('Failed to fetch employee with payroll history', error as Error)
    }
  },

  /**
   * Check if employee exists by KRA PIN
   */
  async findByKraPin(kraPin: string) {
    try {
      return await prisma.employee.findUnique({
        where: { kraPin }
      })
    } catch (error) {
      throw new DatabaseError('Failed to find employee by KRA PIN', error as Error)
    }
  },

  /**
   * Get all active employees
   */
  async getActiveEmployees() {
    try {
      return await prisma.employee.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      })
    } catch (error) {
      throw new DatabaseError('Failed to fetch active employees', error as Error)
    }
  },

  /**
   * Update employee salary with audit trail
   */
  async updateSalary(
    employeeId: string,
    newBasicSalary: number,
    newAllowances: number,
    reason: string,
    adjustmentType: string,
    effectiveDate: Date
  ) {
    return await withTransaction(async (tx) => {
      // Get current employee data
      const employee = await tx.employee.findUnique({
        where: { id: employeeId }
      })

      if (!employee) {
        throw new DatabaseError('Employee not found')
      }

      // Create salary adjustment record
      await tx.salaryAdjustment.create({
        data: {
          employeeId,
          previousBasicSalary: employee.basicSalary,
          previousAllowances: employee.allowances,
          newBasicSalary,
          newAllowances,
          effectiveDate,
          reason,
          adjustmentType: adjustmentType as any
        }
      })

      // Update employee record
      const updatedEmployee = await tx.employee.update({
        where: { id: employeeId },
        data: {
          basicSalary: newBasicSalary,
          allowances: newAllowances
        }
      })

      return updatedEmployee
    })
  },

  /**
   * Deactivate employee (soft delete)
   */
  async deactivateEmployee(employeeId: string, reason: string) {
    try {
      return await prisma.employee.update({
        where: { id: employeeId },
        data: { isActive: false }
      })
    } catch (error) {
      throw new DatabaseError('Failed to deactivate employee', error as Error)
    }
  }
}

// Payroll utilities
export const payrollUtils = {
  /**
   * Check if payroll exists for employee and month
   */
  async payrollExists(employeeId: string, monthYear: string): Promise<boolean> {
    try {
      const existing = await prisma.payrollRun.findUnique({
        where: {
          employeeId_monthYear: {
            employeeId,
            monthYear
          }
        }
      })
      return !!existing
    } catch (error) {
      throw new DatabaseError('Failed to check payroll existence', error as Error)
    }
  },

  /**
   * Create payroll run from calculation result
   */
  async createPayrollRun(
    employeeId: string,
    monthYear: string,
    calculationResult: PayrollCalculationResult,
    overtimeHours: number = 0,
    overtimeType: 'WEEKDAY' | 'HOLIDAY' = 'WEEKDAY',
    unpaidDays: number = 0,
    customDeductions: number = 0
  ) {
    try {
      const payrollRun = await prisma.payrollRun.create({
        data: {
          employeeId,
          monthYear,
          basicSalary: calculationResult.earnings.basicSalary,
          allowances: calculationResult.earnings.allowances,
          overtime: calculationResult.earnings.overtime,
          bonuses: calculationResult.earnings.bonuses,
          grossPay: calculationResult.earnings.grossPay,
          overtimeHours,
          overtimeType,
          unpaidDays,
          unpaidDeduction: calculationResult.calculations.unpaidDeduction,
          paye: calculationResult.deductions.paye,
          nssf: calculationResult.deductions.nssf,
          shif: calculationResult.deductions.shif,
          housingLevy: calculationResult.deductions.housingLevy,
          customDeductions,
          totalDeductions: calculationResult.deductions.totalDeductions,
          netPay: calculationResult.netPay,
          status: 'PROCESSED',
          deductions: {
            paye: calculationResult.deductions.paye,
            nssf: calculationResult.deductions.nssf,
            shif: calculationResult.deductions.shif,
            housingLevy: calculationResult.deductions.housingLevy,
            customDeductions: calculationResult.deductions.customDeductions,
            totalStatutory: calculationResult.deductions.totalStatutory,
            totalDeductions: calculationResult.deductions.totalDeductions,
            breakdown: calculationResult.breakdown
          },
          earnings: {
            basicSalary: calculationResult.earnings.basicSalary,
            allowances: calculationResult.earnings.allowances,
            overtime: calculationResult.earnings.overtime,
            bonuses: calculationResult.earnings.bonuses,
            grossPay: calculationResult.earnings.grossPay
          },
          calculations: {
            workingDays: calculationResult.calculations.workingDays,
            dailyRate: calculationResult.calculations.dailyRate,
            hourlyRate: calculationResult.calculations.hourlyRate,
            unpaidDeduction: calculationResult.calculations.unpaidDeduction,
            taxableIncome: calculationResult.calculations.taxableIncome,
            employerContributions: calculationResult.employerContributions
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              kraPin: true,
              employeeNumber: true
            }
          }
        }
      })

      return payrollRun
    } catch (error) {
      throw new DatabaseError('Failed to create payroll run', error as Error)
    }
  },

  /**
   * Get payroll runs with filters
   */
  async getPayrollRuns(filters: {
    monthYear?: string
    employeeId?: string
    status?: PayrollStatus
    page?: number
    limit?: number
  }) {
    try {
      const {
        monthYear,
        employeeId,
        status,
        page = 1,
        limit = 10
      } = filters

      const where: any = {}

      if (monthYear) where.monthYear = monthYear
      if (employeeId) where.employeeId = employeeId
      if (status) where.status = status

      const skip = (page - 1) * limit

      const [payrollRuns, total] = await Promise.all([
        prisma.payrollRun.findMany({
          where,
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                kraPin: true,
                employeeNumber: true
              }
            }
          },
          orderBy: [
            { monthYear: 'desc' },
            { employee: { name: 'asc' } }
          ],
          skip,
          take: limit
        }),
        prisma.payrollRun.count({ where })
      ])

      return {
        data: payrollRuns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      throw new DatabaseError('Failed to fetch payroll runs', error as Error)
    }
  },

  /**
   * Calculate YTD totals for employee
   */
  async getYTDTotals(employeeId: string, year: number) {
    try {
      const startOfYear = `${year}-01`
      const endOfYear = `${year}-12`

      const ytdPayrolls = await prisma.payrollRun.findMany({
        where: {
          employeeId,
          monthYear: {
            gte: startOfYear,
            lte: endOfYear
          },
          status: 'PROCESSED'
        },
        orderBy: { monthYear: 'asc' }
      })

      const totals = ytdPayrolls.reduce(
        (acc, payroll) => ({
          grossPay: acc.grossPay + payroll.grossPay,
          totalDeductions: acc.totalDeductions + payroll.totalDeductions,
          netPay: acc.netPay + payroll.netPay,
          paye: acc.paye + payroll.paye,
          nssf: acc.nssf + payroll.nssf,
          shif: acc.shif + payroll.shif,
          housingLevy: acc.housingLevy + payroll.housingLevy
        }),
        {
          grossPay: 0,
          totalDeductions: 0,
          netPay: 0,
          paye: 0,
          nssf: 0,
          shif: 0,
          housingLevy: 0
        }
      )

      return {
        ...totals,
        monthsCovered: ytdPayrolls.length,
        payrolls: ytdPayrolls
      }
    } catch (error) {
      throw new DatabaseError('Failed to calculate YTD totals', error as Error)
    }
  }
}

// Deduction utilities
export const deductionUtils = {
  /**
   * Get active custom deductions for employee
   */
  async getActiveDeductions(employeeId: string, monthYear: string) {
    try {
      return await prisma.customDeduction.findMany({
        where: {
          employeeId,
          isActive: true,
          OR: [
            { isRecurring: false },
            {
              isRecurring: true,
              startMonth: { lte: monthYear },
              OR: [
                { endMonth: null },
                { endMonth: { gte: monthYear } }
              ]
            }
          ]
        }
      })
    } catch (error) {
      throw new DatabaseError('Failed to fetch active deductions', error as Error)
    }
  },

  /**
   * Create recurring deduction
   */
  async createRecurringDeduction(
    employeeId: string,
    amount: number,
    description: string,
    type: string,
    startMonth: string,
    endMonth?: string
  ) {
    try {
      return await prisma.customDeduction.create({
        data: {
          employeeId,
          amount,
          description,
          type: type as any,
          isRecurring: true,
          startMonth,
          endMonth,
          isActive: true
        }
      })
    } catch (error) {
      throw new DatabaseError('Failed to create recurring deduction', error as Error)
    }
  }
}

// Bonus utilities
export const bonusUtils = {
  /**
   * Get pending bonuses for employee and month
   */
  async getPendingBonuses(employeeId: string, monthYear: string) {
    try {
      return await prisma.bonus.findMany({
        where: {
          employeeId,
          paymentMonth: monthYear,
          isProcessed: false
        }
      })
    } catch (error) {
      throw new DatabaseError('Failed to fetch pending bonuses', error as Error)
    }
  },

  /**
   * Mark bonus as processed
   */
  async markBonusProcessed(bonusId: string) {
    try {
      return await prisma.bonus.update({
        where: { id: bonusId },
        data: { isProcessed: true }
      })
    } catch (error) {
      throw new DatabaseError('Failed to mark bonus as processed', error as Error)
    }
  }
}

// Audit utilities
export const auditUtils = {
  /**
   * Log audit event
   */
  async logAudit(
    action: string,
    entityType: string,
    entityId: string,
    oldValues?: any,
    newValues?: any,
    userId?: string,
    userEmail?: string
  ) {
    try {
      return await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          oldValues: oldValues || null,
          newValues: newValues || null,
          userId,
          userEmail
        }
      })
    } catch (error) {
      // Don't throw on audit failures - log and continue
      console.error('Failed to create audit log:', error)
    }
  },

  /**
   * Get audit trail for entity
   */
  async getAuditTrail(entityType: string, entityId: string, limit: number = 50) {
    try {
      return await prisma.auditLog.findMany({
        where: {
          entityType,
          entityId
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      throw new DatabaseError('Failed to fetch audit trail', error as Error)
    }
  }
}

// Reporting utilities
export const reportingUtils = {
  /**
   * Get payroll summary for month
   */
  async getMonthlyPayrollSummary(monthYear: string) {
    try {
      const payrollRuns = await prisma.payrollRun.findMany({
        where: {
          monthYear,
          status: 'PROCESSED'
        },
        include: {
          employee: {
            select: { name: true, contractType: true }
          }
        }
      })

      const summary = payrollRuns.reduce(
        (acc, run) => ({
          totalEmployees: acc.totalEmployees + 1,
          totalGrossPay: acc.totalGrossPay + run.grossPay,
          totalDeductions: acc.totalDeductions + run.totalDeductions,
          totalNetPay: acc.totalNetPay + run.netPay,
          totalPAYE: acc.totalPAYE + run.paye,
          totalNSSF: acc.totalNSSF + run.nssf,
          totalSHIF: acc.totalSHIF + run.shif,
          totalHousingLevy: acc.totalHousingLevy + run.housingLevy
        }),
        {
          totalEmployees: 0,
          totalGrossPay: 0,
          totalDeductions: 0,
          totalNetPay: 0,
          totalPAYE: 0,
          totalNSSF: 0,
          totalSHIF: 0,
          totalHousingLevy: 0
        }
      )

      return {
        monthYear,
        ...summary,
        averageGrossPay: summary.totalEmployees > 0 ? summary.totalGrossPay / summary.totalEmployees : 0,
        averageNetPay: summary.totalEmployees > 0 ? summary.totalNetPay / summary.totalEmployees : 0,
        payrollRuns
      }
    } catch (error) {
      throw new DatabaseError('Failed to generate monthly payroll summary', error as Error)
    }
  }
}