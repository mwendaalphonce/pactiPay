import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/payslips/[id] - Get individual payslip
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payroll = await prisma.payrollRun.findUnique({
      where: { id: params.id },
      include: {
        employee: true
      }
    })
    
    if (!payroll) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payslip not found' 
        },
        { status: 404 }
      )
    }
    
    // Transform data for detailed payslip view
    const payslip = {
      id: payroll.id,
      employee: {
        id: payroll.employee.id,
        name: payroll.employee.name,
        kraPin: payroll.employee.kraPin,
        employeeNumber: payroll.employee.employeeNumber,
        nationalId: payroll.employee.nationalId,
        bankName: payroll.employee.bankName,
        bankBranch: payroll.employee.bankBranch,
        bankAccount: payroll.employee.bankAccount,
        contractType: payroll.employee.contractType
      },
      monthYear: payroll.monthYear,
      payPeriod: {
        month: new Date(payroll.monthYear + '-01').toLocaleString('en-US', { month: 'long' }),
        year: new Date(payroll.monthYear + '-01').getFullYear()
      },
      earnings: {
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        overtime: payroll.overtime,
        bonuses: payroll.bonuses,
        grossPay: payroll.grossPay
      },
      deductions: {
        paye: payroll.paye,
        nssf: payroll.nssf,
        shif: payroll.shif,
        housingLevy: payroll.housingLevy,
        customDeductions: payroll.customDeductions,
        totalStatutory: payroll.paye + payroll.nssf + payroll.shif + payroll.housingLevy,
        totalDeductions: payroll.totalDeductions
      },
      netPay: payroll.netPay,
      createdAt: payroll.createdAt,
      processedBy: 'System', // For future user authentication
      deductionDetails: payroll.deductions as any // JSON field from database
    }
    
    return NextResponse.json({
      success: true,
      data: payslip
    })
  } catch (error) {
    console.error('Error fetching payslip:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch payslip' 
      },
      { status: 500 }
    )
  }
}