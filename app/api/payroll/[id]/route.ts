// app/api/payroll/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { PayslipData } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 SECURITY: Get authenticated user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const payrollId = params.id
    
    // Fetch payroll run with employee and company details
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id: payrollId },
      include: {
        employee: {
          include: {
            company: true
          }
        }
      }
    })
    
    if (!payrollRun) {
      return NextResponse.json(
        { success: false, error: 'Payroll run not found' },
        { status: 404 }
      )
    }
    
    // 🔒 SECURITY: Ensure user can only access payroll from their company
    if (payrollRun.employee.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Cannot access payroll from different company' },
        { status: 403 }
      )
    }
    
    // Get data from JSON fields if available
    const deductions = payrollRun.deductions as any || {}
    const earnings = payrollRun.earnings as any || {}
    const calculations = payrollRun.calculations as any || {}
    
    // Prepare payslip data
    const payslipData: PayslipData = {
      company: {
        id: payrollRun.employee.company.id,
        name: payrollRun.employee.company.companyName,
        address: payrollRun.employee.company.physicalAddress || undefined,
        phone: payrollRun.employee.company.phone || undefined,
        email: payrollRun.employee.company.email,
        kraPin: payrollRun.employee.company.kraPin,
        logo: payrollRun.employee.company.logo || undefined,
        signatoryName: payrollRun.employee.company.signatoryName || undefined,
        signatoryTitle: payrollRun.employee.company.signatoryTitle || undefined,
        signatorySignature: payrollRun.employee.company.signatorySignature || undefined,
      },
      employee: {
        id: payrollRun.employee.id,
        name: payrollRun.employee.name,
        kraPin: payrollRun.employee.kraPin,
        nationalId: payrollRun.employee.nationalId,
        employeeNumber: payrollRun.employee.employeeNumber,
        email: payrollRun.employee.email,
        phone: payrollRun.employee.phoneNumber,
        bankName: payrollRun.employee.bankName,
        bankAccount: payrollRun.employee.bankAccount,
        // Uncomment if you have these fields in your schema
        // position: payrollRun.employee.position || undefined,
        // department: payrollRun.employee.department || undefined,
      },
      payroll: {
        id: payrollRun.id,
        monthYear: payrollRun.monthYear,
        payPeriod: getPayPeriodDisplay(payrollRun.monthYear),
        payDate: payrollRun.processedAt.toISOString(),
        processedDate: payrollRun.createdAt.toISOString(),
        status: payrollRun.status
      },
      earnings: {
        basicSalary: payrollRun.basicSalary,
        allowances: payrollRun.allowances,
        overtime: payrollRun.overtime,
        overtimeHours: payrollRun.overtimeHours || 0,
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
        grossTax: deductions.grossTax || calculations.grossTax || 0,
        personalRelief: deductions.personalRelief || calculations.personalRelief || 2400,
        insuranceRelief: deductions.insuranceRelief || calculations.insuranceRelief || 0,
        paye: payrollRun.paye,
        customDeductions: payrollRun.customDeductions,
        customDeductionDescription: deductions.customDeductionDescription || undefined,
        totalDeductions: payrollRun.totalDeductions
      },
      netPay: payrollRun.netPay,
      employerContributions: {
        nssf: calculations.nssfEmployer || payrollRun.nssf,
        shif: calculations.shifEmployer || payrollRun.shif,
        housingLevy: calculations.housingLevyEmployer || payrollRun.housingLevy,
        total: (calculations.nssfEmployer || payrollRun.nssf) + 
               (calculations.shifEmployer || payrollRun.shif) + 
               (calculations.housingLevyEmployer || payrollRun.housingLevy)
      },
      additionalInfo: {
        unpaidDays: payrollRun.unpaidDays || undefined,
        unpaidDeduction: payrollRun.unpaidDeduction || undefined,
        effectiveTaxRate: calculations.effectiveTaxRate || 
                         (payrollRun.paye / payrollRun.grossPay * 100) || undefined
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
      { success: false, error: 'Failed to fetch payslip', details: error.message },
      { status: 500 }
    )
  }
}

function getPayPeriodDisplay(monthYear: string): string {
  const [year, month] = monthYear.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })
}