// src/app/api/payroll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculatePayroll } from '@/lib/payroll/calculations'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const runPayrollSchema = z.object({
  employeeId: z.string(),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'Month year must be in YYYY-MM format'),
  overtimeHours: z.number().min(0).default(0),
  overtimeType: z.enum(['weekday', 'holiday', 'WEEKDAY', 'HOLIDAY'])
    .transform(val => val.toUpperCase() as 'WEEKDAY' | 'HOLIDAY')
    .default('WEEKDAY'), // ✅ FIX: Use uppercase default
  unpaidDays: z.number().min(0).max(31).default(0),
  customDeductions: z.number().min(0).default(0),
  customDeductionDescription: z.string().optional().nullable(),
  bonuses: z.number().min(0).default(0),
  bonusDescription: z.string().optional().nullable(),
  // Accept pre-calculated values from frontend
  basicSalary: z.number().optional(),
  allowances: z.number().optional(),
  overtime: z.number().optional(),
  grossPay: z.number().optional(),
  nssf: z.number().optional(),
  shif: z.number().optional(),
  housingLevy: z.number().optional(),
  taxableIncome: z.number().optional(),
  paye: z.number().optional(),
  totalDeductions: z.number().optional(),
  netPay: z.number().optional()
})

const batchPayrollSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'Month year must be in YYYY-MM format'),
  employees: z.array(z.object({
    employeeId: z.string(),
    overtimeHours: z.number().min(0).default(0),
    overtimeType: z.enum(['weekday', 'holiday', 'WEEKDAY', 'HOLIDAY'])
      .transform(val => val.toUpperCase() as 'WEEKDAY' | 'HOLIDAY')
      .default('WEEKDAY'), // ✅ FIX: Use uppercase default
    unpaidDays: z.number().min(0).max(31).default(0),
    customDeductions: z.number().min(0).default(0),
    customDeductionDescription: z.string().optional(),
    bonuses: z.number().min(0).default(0),
    bonusDescription: z.string().optional()
  }))
})

// GET /api/payroll
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          message: 'You must be associated with a company to view payroll data'
        },
        { status: 401 }
      )
    }
    
    const companyId = session.user.companyId
    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get('monthYear')
    const employeeId = searchParams.get('employeeId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    const where: any = {
      employee: {
        companyId: companyId
      }
    }
    
    if (monthYear) {
      where.monthYear = monthYear
    }
    
    if (employeeId) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: employeeId,
          companyId: companyId
        }
      })
      
      if (!employee) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Employee not found or does not belong to your company'
          },
          { status: 404 }
        )
      }
      
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
              employeeNumber: true,
              companyId: true
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

// POST /api/payroll
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          message: 'You must be associated with a company to run payroll'
        },
        { status: 401 }
      )
    }
    
    const companyId = session.user.companyId
    const body = await request.json()
    const isBatch = body.employees && Array.isArray(body.employees)
    
    if (isBatch) {
      return await processBatchPayroll(body, companyId, session.user.id)
    } else {
      return await processSinglePayroll(body, companyId, session.user.id)
    }
  } catch (error) {
    console.error('Error running payroll:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid payroll data',
          details: error.issues // ✅ FIX: Use .issues not .errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to run payroll'
      },
      { status: 500 }
    )
  }
}

async function processSinglePayroll(data: any, companyId: string, userId: string) {
  const validatedData = runPayrollSchema.parse(data)
  
  const employee = await prisma.employee.findFirst({
    where: { 
      id: validatedData.employeeId,
      companyId: companyId
    }
  })
  
  if (!employee) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Employee not found or does not belong to your company' 
      },
      { status: 404 }
    )
  }
  
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
  
  // Use pre-calculated values if provided, otherwise calculate
  let payrollData
  if (validatedData.netPay !== undefined && validatedData.grossPay !== undefined) {
    payrollData = {
      earnings: {
        basicSalary: validatedData.basicSalary!,
        allowances: validatedData.allowances!,
        overtime: validatedData.overtime!,
        grossPay: validatedData.grossPay!
      },
      deductions: {
        paye: validatedData.paye!,
        nssf: validatedData.nssf!,
        shif: validatedData.shif!,
        housingLevy: validatedData.housingLevy!,
        customDeductions: validatedData.customDeductions,
        taxableIncome: validatedData.taxableIncome!,
        totalStatutory: (validatedData.paye! + validatedData.nssf! + validatedData.shif! + validatedData.housingLevy!),
        totalDeductions: validatedData.totalDeductions!
      },
      netPay: validatedData.netPay!,
      calculations: null
    }
  } else {
    // ✅ FIX: Cast employee to match expected type
    const calculation = calculatePayroll({
      employee: employee as any, // Type assertion to handle Prisma vs Interface mismatch
      overtimeHours: validatedData.overtimeHours,
      overtimeType: validatedData.overtimeType,
      unpaidDays: validatedData.unpaidDays,
      customDeductions: validatedData.customDeductions,
      bonuses: validatedData.bonuses
    })
    payrollData = calculation
  }
  
  // ✅ FIX: Ensure calculations is undefined if null (Prisma doesn't accept null for JSON)
  const calculationsData = payrollData.calculations ? payrollData.calculations : undefined
  
  const payrollRun = await prisma.payrollRun.create({
    data: {
      employeeId: validatedData.employeeId,
      monthYear: validatedData.monthYear,
      basicSalary: payrollData.earnings.basicSalary,
      allowances: payrollData.earnings.allowances,
      overtime: payrollData.earnings.overtime,
      overtimeHours: validatedData.overtimeHours,
      overtimeType: validatedData.overtimeType,
      bonuses: validatedData.bonuses,
      bonusDescription: validatedData.bonusDescription,
      unpaidDays: validatedData.unpaidDays,
      unpaidDeduction: 0,
      grossPay: payrollData.earnings.grossPay,
      
      paye: payrollData.deductions.paye,
      nssf: payrollData.deductions.nssf,
      shif: payrollData.deductions.shif,
      housingLevy: payrollData.deductions.housingLevy,
      taxableIncome: payrollData.deductions.taxableIncome,
      customDeductions: validatedData.customDeductions,
      totalDeductions: payrollData.deductions.totalDeductions,
      netPay: payrollData.netPay,
      
      processedBy: userId,
      status: 'PROCESSED',
      
      deductions: {
        paye: payrollData.deductions.paye,
        nssf: payrollData.deductions.nssf,
        shif: payrollData.deductions.shif,
        housingLevy: payrollData.deductions.housingLevy,
        taxableIncome: payrollData.deductions.taxableIncome,
        customDeductions: validatedData.customDeductions,
        customDeductionDescription: validatedData.customDeductionDescription || null,
        totalStatutory: payrollData.deductions.totalStatutory,
        totalDeductions: payrollData.deductions.totalDeductions
      },
      earnings: {
        basicSalary: payrollData.earnings.basicSalary,
        allowances: payrollData.earnings.allowances,
        overtime: payrollData.earnings.overtime,
        bonuses: validatedData.bonuses,
        grossPay: payrollData.earnings.grossPay
      },
      calculations: calculationsData // ✅ FIX: Use undefined instead of null
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          kraPin: true,
          email: true,
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

async function processBatchPayroll(data: any, companyId: string, userId: string) {
  const validatedData = batchPayrollSchema.parse(data)
  const results = []
  const errors = []
  
  for (const employeeData of validatedData.employees) {
    try {
      const employee = await prisma.employee.findFirst({
        where: { 
          id: employeeData.employeeId,
          companyId: companyId
        }
      })
      
      if (!employee) {
        errors.push({
          employeeId: employeeData.employeeId,
          error: 'Employee not found or does not belong to your company'
        })
        continue
      }
      
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
      
      // ✅ FIX: Cast employee to match expected type
      const payrollCalculation = calculatePayroll({
        employee: employee as any,
        overtimeHours: employeeData.overtimeHours,
        overtimeType: employeeData.overtimeType,
        unpaidDays: employeeData.unpaidDays,
        customDeductions: employeeData.customDeductions,
        bonuses: employeeData.bonuses
      })
      
      // ✅ FIX: Ensure calculations is undefined if null
      const calculationsData = payrollCalculation.calculations ? payrollCalculation.calculations : undefined
      
      const payrollRun = await prisma.payrollRun.create({
        data: {
          employeeId: employeeData.employeeId,
          monthYear: validatedData.monthYear,
          basicSalary: employee.basicSalary,
          allowances: employee.allowances,
          overtime: payrollCalculation.earnings.overtime,
          overtimeHours: employeeData.overtimeHours,
          overtimeType: employeeData.overtimeType,
          bonuses: employeeData.bonuses,
          bonusDescription: employeeData.bonusDescription,
          unpaidDays: employeeData.unpaidDays,
          unpaidDeduction: 0,
          grossPay: payrollCalculation.earnings.grossPay,
          
          paye: payrollCalculation.deductions.paye,
          nssf: payrollCalculation.deductions.nssf,
          shif: payrollCalculation.deductions.shif,
          housingLevy: payrollCalculation.deductions.housingLevy,
          taxableIncome: payrollCalculation.deductions.taxableIncome,
          customDeductions: employeeData.customDeductions,
          totalDeductions: payrollCalculation.deductions.totalDeductions,
          netPay: payrollCalculation.netPay,
          
          processedBy: userId,
          status: 'PROCESSED',
          
          deductions: {
            paye: payrollCalculation.deductions.paye,
            nssf: payrollCalculation.deductions.nssf,
            shif: payrollCalculation.deductions.shif,
            housingLevy: payrollCalculation.deductions.housingLevy,
            taxableIncome: payrollCalculation.deductions.taxableIncome,
            customDeductions: employeeData.customDeductions,
            customDeductionDescription: employeeData.customDeductionDescription || null,
            totalStatutory: payrollCalculation.deductions.totalStatutory,
            totalDeductions: payrollCalculation.deductions.totalDeductions
          },
          earnings: {
            basicSalary: employee.basicSalary,
            allowances: employee.allowances,
            overtime: payrollCalculation.earnings.overtime,
            bonuses: employeeData.bonuses,
            grossPay: payrollCalculation.earnings.grossPay
          },
          calculations: calculationsData // ✅ FIX: Use undefined instead of null
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
      console.error(`Error processing payroll for employee ${employeeData.employeeId}:`, error)
      errors.push({
        employeeId: employeeData.employeeId,
        error: error instanceof Error ? error.message : 'Failed to process payroll'
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