// src/app/api/payroll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculatePayroll } from '@/lib/payroll/calculations'
import { z } from 'zod'

const runPayrollSchema = z.object({
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

const batchPayrollSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'Month year must be in YYYY-MM format'),
  employees: z.array(z.object({
    employeeId: z.string(),
    overtimeHours: z.number().min(0).default(0),
    overtimeType: z.enum(['weekday', 'holiday']).default('weekday'),
    unpaidDays: z.number().min(0).max(31).default(0),
    customDeductions: z.number().min(0).default(0),
    customDeductionDescription: z.string().optional(),
    bonuses: z.number().min(0).default(0),
    bonusDescription: z.string().optional()
  }))
})

// GET /api/payroll - Get payroll runs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get('monthYear')
    const employeeId = searchParams.get('employeeId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (monthYear) {
      where.monthYear = monthYear
    }
    
    if (employeeId) {
      where.employeeId = employeeId
    }
    
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payrollRun.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: payrollRuns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payroll runs:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch payroll runs' 
      },
      { status: 500 }
    )
  }
}

// POST /api/payroll - Run payroll (single or batch)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if it's batch processing or single employee
    const isBatch = body.employees && Array.isArray(body.employees)
    
    if (isBatch) {
      return await processBatchPayroll(body)
    } else {
      return await processSinglePayroll(body)
    }
  } catch (error) {
    console.error('Error running payroll:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to run payroll' 
      },
      { status: 500 }
    )
  }
}

async function processSinglePayroll(data: any) {
  const validatedData = runPayrollSchema.parse(data)
  
  // Fetch employee
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
  
  // Check if payroll already exists
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
        error: `Payroll for ${validatedData.monthYear} already exists for this employee` 
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
  
  // Save payroll run
  const payrollRun = await prisma.payrollRun.create({
    data: {
      employeeId: validatedData.employeeId,
      monthYear: validatedData.monthYear,
      basicSalary: employee.basicSalary,
      allowances: employee.allowances,
      overtime: payrollCalculation.earnings.overtime,
      bonuses: validatedData.bonuses,
      grossPay: payrollCalculation.earnings.grossPay,
      paye: payrollCalculation.deductions.paye,
      nssf: payrollCalculation.deductions.nssf,
      shif: payrollCalculation.deductions.shif,
      housingLevy: payrollCalculation.deductions.housingLevy,
      customDeductions: validatedData.customDeductions,
      totalDeductions: payrollCalculation.deductions.totalDeductions,
      netPay: payrollCalculation.netPay,
      deductions: {
        paye: payrollCalculation.deductions.paye,
        nssf: payrollCalculation.deductions.nssf,
        shif: payrollCalculation.deductions.shif,
        housingLevy: payrollCalculation.deductions.housingLevy,
        customDeductions: validatedData.customDeductions,
        customDeductionDescription: validatedData.customDeductionDescription || null,
        totalStatutory: payrollCalculation.deductions.totalStatutory,
        totalDeductions: payrollCalculation.deductions.totalDeductions
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
  
  return NextResponse.json({
    success: true,
    data: payrollRun,
    message: 'Payroll processed successfully'
  }, { status: 201 })
}

async function processBatchPayroll(data: any) {
  const validatedData = batchPayrollSchema.parse(data)
  const results = []
  const errors = []
  
  for (const employeeData of validatedData.employees) {
    try {
      // Fetch employee
      const employee = await prisma.employee.findUnique({
        where: { id: employeeData.employeeId }
      })
      
      if (!employee) {
        errors.push({
          employeeId: employeeData.employeeId,
          error: 'Employee not found'
        })
        continue
      }
      
      // Check if payroll already exists
      const existingPayroll = await prisma.payrollRun.findFirst({
        where: {
          employeeId: employeeData.employeeId,
          monthYear: validatedData.monthYear
        }
      })
      
      if (existingPayroll) {
        errors.push({
          employeeId: employeeData.employeeId,
          employeeName: employee.name,
          error: `Payroll for ${validatedData.monthYear} already exists`
        })
        continue
      }
      
      // Calculate payroll
      const payrollCalculation = calculatePayroll({
        employee,
        overtimeHours: employeeData.overtimeHours,
        overtimeType: employeeData.overtimeType,
        unpaidDays: employeeData.unpaidDays,
        customDeductions: employeeData.customDeductions,
        bonuses: employeeData.bonuses
      })
      
      // Save payroll run
      const payrollRun = await prisma.payrollRun.create({
        data: {
          employeeId: employeeData.employeeId,
          monthYear: validatedData.monthYear,
          basicSalary: employee.basicSalary,
          allowances: employee.allowances,
          overtime: payrollCalculation.earnings.overtime,
          bonuses: employeeData.bonuses,
          grossPay: payrollCalculation.earnings.grossPay,
          paye: payrollCalculation.deductions.paye,
          nssf: payrollCalculation.deductions.nssf,
          shif: payrollCalculation.deductions.shif,
          housingLevy: payrollCalculation.deductions.housingLevy,
          customDeductions: employeeData.customDeductions,
          totalDeductions: payrollCalculation.deductions.totalDeductions,
          netPay: payrollCalculation.netPay,
          deductions: {
            paye: payrollCalculation.deductions.paye,
            nssf: payrollCalculation.deductions.nssf,
            shif: payrollCalculation.deductions.shif,
            housingLevy: payrollCalculation.deductions.housingLevy,
            customDeductions: employeeData.customDeductions,
            customDeductionDescription: employeeData.customDeductionDescription || null,
            totalStatutory: payrollCalculation.deductions.totalStatutory,
            totalDeductions: payrollCalculation.deductions.totalDeductions
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
      
      results.push(payrollRun)
    } catch (error) {
      errors.push({
        employeeId: employeeData.employeeId,
        error: 'Failed to process payroll'
      })
    }
  }
  
  return NextResponse.json({
    success: true,
    data: {
      processed: results,
      errors: errors,
      summary: {
        total: validatedData.employees.length,
        successful: results.length,
        failed: errors.length
      }
    },
    message: `Batch payroll completed. ${results.length} successful, ${errors.length} failed.`
  }, { status: 201 })
}