// src/app/api/payroll/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { calculatePayroll } from '@/app/lib/payroll/calculations'
import { prisma } from '@/app/lib/prisma' // Adjust path as needed

export async function POST(request: NextRequest) {
  try {
    const { monthYear, employeeIds } = await request.json()
    
    if (!monthYear || !employeeIds || !Array.isArray(employeeIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      )
    }
    
    // Fetch all employees
    const employees = await prisma.employee.findMany({
      where: { 
        id: { in: employeeIds }, 
        isActive: true 
      },
      include: {
        insurancePremiums: true // If you have this relation
      }
    })
    
    if (employees.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active employees found' },
        { status: 404 }
      )
    }
    
    const results = []
    const errors = []
    
    // Process each employee
    for (const employee of employees) {
      try {
        // Check if payroll already exists for this month
        const existing = await prisma.payrollRun.findFirst({
          where: {
            employeeId: employee.id,
            monthYear: monthYear
          }
        })
        
        if (existing) {
          errors.push({
            employeeId: employee.id,
            employeeName: employee.name,
            error: 'Payroll already exists for this month'
          })
          continue
        }
        
        // Calculate payroll using library
        const calculationResult = calculatePayroll({
          employee: {
            id: employee.id,
            name: employee.name,
            kraPin: employee.kraPin,
            basicSalary: employee.basicSalary,
            allowances: employee.allowances,
            contractType: employee.contractType || 'permanent',
            //isDisabled: employee.isDisabled || false,
          
          },
          overtimeHours: 0,
          overtimeType: 'weekday',
          unpaidDays: 0,
          customDeductions: 0,
          bonuses: 0
        })
        
        // Save to database
        const payrollRun = await prisma.payrollRun.create({
          data: {
            employeeId: employee.id,
            monthYear: monthYear,
            basicSalary: calculationResult.earnings.basicSalary,
            allowances: calculationResult.earnings.allowances,
            overtime: calculationResult.earnings.overtime,
            bonuses: calculationResult.earnings.bonuses,
            grossPay: calculationResult.earnings.grossPay,
            nssf: calculationResult.deductions.nssf,
            shif: calculationResult.deductions.shif,
            housingLevy: calculationResult.deductions.housingLevy,
            taxableIncome: calculationResult.deductions.taxableIncome,
            paye: calculationResult.deductions.paye,
            customDeductions: calculationResult.deductions.customDeductions,
            totalDeductions: calculationResult.deductions.totalDeductions,
            netPay: calculationResult.netPay,
            overtimeHours: 0,
            unpaidDays: 0,
            status: 'PROCESSED',
            // Store employer contributions if your schema supports it
          },
          include: {
            employee: true
          }
        })
        
        results.push(payrollRun)
      } catch (error: any) {
        console.error(`Error processing payroll for employee ${employee.id}:`, error)
        errors.push({
          employeeId: employee.id,
          employeeName: employee.name,
          error: error.message || 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        total: employeeIds.length,
        successful: results.length,
        failed: errors.length,
        errors: errors
      }
    })
  } catch (error: any) {
    console.error('Bulk payroll processing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process bulk payroll' 
      },
      { status: 500 }
    )
  }
}