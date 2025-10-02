// src/app/api/payroll/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { calculatePayroll } from '@/app/lib/payroll/calculations'
import { z } from 'zod'

const payrollInputSchema = z.object({
  employeeId: z.string(),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'Month year must be in YYYY-MM format'),
  overtimeHours: z.number().min(0).default(0),
  overtimeType: z.enum(['weekday', 'holiday']).default('weekday'),
  unpaidDays: z.number().min(0).max(31).default(0),
  customDeductions: z.number().min(0).default(0),
  customDeductionDescription: z.string().optional(),
  bonuses: z.number().min(0).default(0),
  bonusDescription: z.string().optional()
})

// POST /api/payroll/calculate - Calculate payroll for an employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = payrollInputSchema.parse(body)
    
    // Fetch employee details
    const employee = await prisma.employee.findUnique({
      where: { id: validatedData.employeeId }
    })
    
    if (!employee) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Employee not found' 
        },
        { status: 404 }
      )
    }
    
    // Check if payroll already exists for this month
    const existingPayroll = await prisma.payrollRun.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        monthYear: validatedData.monthYear
      }
    })
    
    if (existingPayroll) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Payroll for ${validatedData.monthYear} already exists for this employee`,
          data: existingPayroll
        },
        { status: 400 }
      )
    }
    
    // Calculate payroll
    const payrollCalculation = calculatePayroll({
      employee,
      overtimeHours: validatedData.overtimeHours,
      overtimeType: validatedData.overtimeType,
      unpaidDays: validatedData.unpaidDays,
      customDeductions: validatedData.customDeductions,
      bonuses: validatedData.bonuses
    })
    
    // Prepare deductions object for storage
    const deductions = {
      paye: payrollCalculation.deductions.paye,
      nssf: payrollCalculation.deductions.nssf,
      shif: payrollCalculation.deductions.shif,
      housingLevy: payrollCalculation.deductions.housingLevy,
      customDeductions: validatedData.customDeductions,
      customDeductionDescription: validatedData.customDeductionDescription || null,
      totalStatutory: payrollCalculation.deductions.totalStatutory,
      totalDeductions: payrollCalculation.deductions.totalDeductions
    }
    
    // Prepare earnings object
    const earnings = {
      basicSalary: employee.basicSalary,
      allowances: employee.allowances,
      overtime: payrollCalculation.earnings.overtime,
      bonuses: validatedData.bonuses,
      bonusDescription: validatedData.bonusDescription || null,
      grossPay: payrollCalculation.earnings.grossPay
    }
    
    return NextResponse.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.name,
          kraPin: employee.kraPin,
          employeeNumber: employee.employeeNumber
        },
        monthYear: validatedData.monthYear,
        earnings,
        deductions,
        netPay: payrollCalculation.netPay,
        employerContributions: payrollCalculation.employerContributions,
        breakdown: payrollCalculation.breakdown,
        calculations: {
          workingDays: payrollCalculation.calculations.workingDays,
          dailyRate: payrollCalculation.calculations.dailyRate,
          hourlyRate: payrollCalculation.calculations.hourlyRate,
          unpaidDeduction: payrollCalculation.calculations.unpaidDeduction,
          taxableIncome: payrollCalculation.calculations.taxableIncome
        }
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    console.error('Error calculating payroll:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to calculate payroll' 
      },
      { status: 500 }
    )
  }
}