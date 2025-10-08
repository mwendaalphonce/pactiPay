// app/api/payroll/[id]/pdf/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePayslipPDF } from '@/lib/pdf-generator'
import type { PayslipData } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch payroll run with all related data
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id: params.id },
      include: {
        employee: true,
        company: true
      }
    })

    if (!payrollRun) {
      return NextResponse.json(
        { error: 'Payslip not found' },
        { status: 404 }
      )
    }

    // Transform data to PayslipData format
    const payslipData: PayslipData = {
      employee: {
        id: payrollRun.employee.id,
        name: payrollRun.employee.name,
        employeeNumber: payrollRun.employee.employeeNumber || undefined,
        kraPin: payrollRun.employee.kraPin,
        nationalId: payrollRun.employee.nationalId,
        email: payrollRun.employee.email || undefined,
        phone: payrollRun.employee.phone || undefined,
        position: payrollRun.employee.position || undefined,
        department: payrollRun.employee.department || undefined,
        bankName: payrollRun.employee.bankName,
        bankAccount: payrollRun.employee.bankAccount
      },
      company: {
        id: payrollRun.company.id,
        name: payrollRun.company.name,
        address: payrollRun.company.address,
        phone: payrollRun.company.phone,
        email: payrollRun.company.email,
        kraPin: payrollRun.company.kraPin || undefined
      },
      payroll: {
        id: payrollRun.id,
        monthYear: payrollRun.monthYear,
        payDate: payrollRun.payDate,
        processedDate: payrollRun.processedDate || new Date(),
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
        grossTax: payrollRun.grossTax,
        personalRelief: payrollRun.personalRelief,
        insuranceRelief: payrollRun.insuranceRelief,
        paye: payrollRun.paye,
        customDeductions: payrollRun.customDeductions,
        customDeductionDescription: payrollRun.customDeductionDescription || undefined,
        totalDeductions: payrollRun.totalDeductions
      },
      employerContributions: {
        nssf: payrollRun.employerNssf,
        shif: payrollRun.employerShif,
        housingLevy: payrollRun.employerHousingLevy,
        total: payrollRun.employerNssf + payrollRun.employerShif + payrollRun.employerHousingLevy
      },
      netPay: payrollRun.netPay,
      additionalInfo: {
        unpaidDays: payrollRun.unpaidDays || undefined,
        unpaidDeduction: payrollRun.unpaidDeduction || undefined,
        effectiveTaxRate: payrollRun.effectiveTaxRate || undefined
      }
    }

    // Generate PDF
    const pdfBuffer = await generatePayslipPDF(payslipData)
    
    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="payslip-${payrollRun.monthYear}-${payrollRun.employee.name.replace(/\s+/g, '-')}.pdf"`,
        'Cache-Control': 'no-cache'
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}