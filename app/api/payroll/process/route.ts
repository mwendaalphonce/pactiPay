import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { calculatePayrollForEmployee } from '@/lib/payroll-calculator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { monthYear, workingDays } = body

    if (!monthYear || !workingDays) {
      return NextResponse.json(
        { error: 'Month/Year and working days are required' },
        { status: 400 }
      )
    }

    // Check if payroll already exists
    const existingPayroll = await prisma.payrollRun.findFirst({
      where: { monthYear }
    })

    if (existingPayroll) {
      return NextResponse.json(
        { error: `Payroll for ${monthYear} has already been processed` },
        { status: 400 }
      )
    }

    // Fetch all active employees
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        deductions: {
          where: {
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
        },
        bonuses: {
          where: {
            paymentMonth: monthYear,
            isProcessed: false
          }
        }
      }
    })

    let successCount = 0
    let failedCount = 0
    const errors: any[] = []

    // Process payroll for each employee
    for (const employee of employees) {
      try {
        const calculation = await calculatePayrollForEmployee(
          employee,
          monthYear,
          workingDays
        )

        // Create payroll run
        await prisma.payrollRun.create({
          data: {
            employeeId: employee.id,
            monthYear,
            basicSalary: calculation.basicSalary,
            allowances: calculation.allowances,
            overtime: calculation.overtime,
            bonuses: calculation.bonuses,
            grossPay: calculation.grossPay,
            overtimeHours: calculation.overtimeHours || 0,
            overtimeType: 'WEEKDAY',
            unpaidDays: calculation.unpaidDays || 0,
            unpaidDeduction: calculation.unpaidDeduction || 0,
            paye: calculation.paye,
            nssf: calculation.nssf,
            shif: calculation.shif,
            housingLevy: calculation.housingLevy,
            customDeductions: calculation.customDeductions,
            totalDeductions: calculation.totalDeductions,
            netPay: calculation.netPay,
            deductions: calculation.deductionsBreakdown || {},
            earnings: calculation.earningsBreakdown || {},
            calculations: {
              workingDays,
              actualDays: workingDays,
              nssfEmployer: calculation.nssfEmployer || calculation.nssf,
              housingLevyEmployer: calculation.housingLevyEmployer || calculation.housingLevy,
            },
            status: 'PROCESSED',
            processedAt: new Date(),
          }
        })

        // Mark bonuses as processed
        if (employee.bonuses.length > 0) {
          await prisma.bonus.updateMany({
            where: {
              employeeId: employee.id,
              paymentMonth: monthYear,
              isProcessed: false
            },
            data: { isProcessed: true }
          })
        }

        successCount++
      } catch (error: any) {
        console.error(`Error processing payroll for employee ${employee.id}:`, error)
        failedCount++
        errors.push({
          employeeId: employee.id,
          employeeName: employee.name,
          error: error.message
        })
      }
    }

    // Create payroll batch record
    await prisma.payrollBatch.create({
      data: {
        monthYear,
        totalEmployees: employees.length,
        successfulRuns: successCount,
        failedRuns: failedCount,
        status: failedCount > 0 ? 'COMPLETED' : 'COMPLETED',
        completedAt: new Date(),
        errors: errors.length > 0 ? errors : null,
      }
    })

    return NextResponse.json({
      success: true,
      successCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error processing payroll:', error)
    return NextResponse.json(
      { error: 'Failed to process payroll' },
      { status: 500 }
    )
  }
}

