// src/app/api/payroll/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { PayslipData } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payrollId = params.id
    
    // Fetch payroll run with employee details
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id: payrollId },
      include: {
        employee: true
      }
    })
    
    if (!payrollRun) {
      return NextResponse.json(
        { success: false, error: 'Payroll run not found' },
        { status: 404 }
      )
    }
    
    // Get deductions from JSON field if available
    const deductions = payrollRun.deductions as any || {}
    const calculations = payrollRun.calculations as any || {}
    
    // Prepare payslip data
    const payslipData: PayslipData = {
      company: {
        name: process.env.COMPANY_NAME || 'Your Company Name',
        address: process.env.COMPANY_ADDRESS || 'Company Address',
        phone: process.env.COMPANY_PHONE || 'Company Phone',
        email: process.env.COMPANY_EMAIL || 'company@email.com',
        kraPin: process.env.COMPANY_KRA_PIN
      },
      employee: {
        id: payrollRun.employee.id,
        name: payrollRun.employee.name,
        kraPin: payrollRun.employee.kraPin,
        nationalId: payrollRun.employee.nationalId,
        employeeNumber: payrollRun.employee.employeeNumber || undefined,
        bankName: payrollRun.employee.bankName,
        bankAccount: payrollRun.employee.bankAccount,
        position: undefined, // Add from employee if you have this field
        department: undefined // Add from employee if you have this field
      },
      payroll: {
        monthYear: payrollRun.monthYear,
        payPeriod: getPayPeriodDisplay(payrollRun.monthYear),
        payDate: payrollRun.processedAt.toISOString(),
        processedDate: payrollRun.createdAt.toISOString()
      },
      earnings: {
        basicSalary: payrollRun.basicSalary,
        allowances: payrollRun.allowances,
        overtime: payrollRun.overtime,
        overtimeHours: payrollRun.overtimeHours,
        bonuses: payrollRun.bonuses,
        bonusDescription: payrollRun.bonusDescription || undefined,
        grossPay: payrollRun.grossPay
      },
      deductions: {
        nssf: payrollRun.nssf,
        shif: payrollRun.shif,
        housingLevy: payrollRun.housingLevy,
        totalAllowable: payrollRun.nssf + payrollRun.shif + payrollRun.housingLevy,
        taxableIncome: payrollRun.taxableIncome,
        grossTax: deductions.grossTax || 0,
        personalRelief: deductions.personalRelief || 0,
        insuranceRelief: deductions.insuranceRelief || 0,
        paye: payrollRun.paye,
        customDeductions: payrollRun.customDeductions,
        customDeductionDescription: deductions.customDeductionDescription || undefined,
        totalDeductions: payrollRun.totalDeductions
      },
      netPay: payrollRun.netPay,
      employerContributions: {
        nssf: calculations.nssfEmployer || 0,
        shif: calculations.shifEmployer || 0,
        housingLevy: calculations.housingLevyEmployer || 0,
        total: (calculations.nssfEmployer || 0) + (calculations.shifEmployer || 0) + (calculations.housingLevyEmployer || 0)
      },
      additionalInfo: {
        unpaidDays: payrollRun.unpaidDays || undefined,
        unpaidDeduction: payrollRun.unpaidDeduction || undefined,
        effectiveTaxRate: calculations.effectiveTaxRate || undefined
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        payrollRun,
        payslipData
      }
    })
  } catch (error: any) {
    console.error('Error fetching payslip:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payslip' },
      { status: 500 }
    )
  }
}

function getPayPeriodDisplay(monthYear: string): string {
  const [year, month] = monthYear.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })
}