// src/app/api/payslips/download/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePayslipPDF } from '@/lib/pdf-generator'
import { PayslipData } from '@/types'

// GET /api/payslips/download/[id] - Download payslip as PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payroll = await prisma.payrollRun.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: {
            company: true
          }
        }
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

    if (!payroll.employee.company) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Company information not found' 
        },
        { status: 404 }
      )
    }
    
    // Calculate YTD totals for the employee up to this month
    const currentDate = new Date(payroll.monthYear + '-01')
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1)
    
    const ytdPayrolls = await prisma.payrollRun.findMany({
      where: {
        employeeId: payroll.employeeId,
        monthYear: {
          gte: startOfYear.toISOString().slice(0, 7), // YYYY-MM format
          lte: payroll.monthYear
        }
      }
    })
    
    // Calculate YTD totals
    const ytdTotals = ytdPayrolls.reduce(
      (acc, run) => ({
        grossPay: acc.grossPay + run.grossPay,
        paye: acc.paye + run.paye,
        nssf: acc.nssf + run.nssf,
        shif: acc.shif + run.shif,
        housingLevy: acc.housingLevy + run.housingLevy,
        totalDeductions: acc.totalDeductions + run.totalDeductions,
        netPay: acc.netPay + run.netPay
      }),
      {
        grossPay: 0,
        paye: 0,
        nssf: 0,
        shif: 0,
        housingLevy: 0,
        totalDeductions: 0,
        netPay: 0
      }
    )
    
    // Prepare payslip data matching PayslipData interface
    const payslipData: PayslipData = {
      company: {
        id: payroll.employee.company.id,
        name: payroll.employee.company.companyName,
        address: payroll.employee.company.physicalAddress ?? undefined,
        phone: payroll.employee.company.phone ?? undefined,
        email: payroll.employee.company.email,
        kraPin: payroll.employee.company.kraPin ?? undefined,
        logo: payroll.employee.company.logo ?? undefined,
        signatoryName: payroll.employee.company.signatoryName ?? undefined,
        signatoryTitle: payroll.employee.company.signatoryTitle ?? undefined,
        signatorySignature: payroll.employee.company.signatorySignature ?? undefined
      },
      employee: {
        id: payroll.employee.id,
        name: payroll.employee.name,
        kraPin: payroll.employee.kraPin,
        nationalId: payroll.employee.nationalId,
        employeeNumber: payroll.employee.employeeNumber ?? undefined,
        email: payroll.employee.email ?? undefined,
        phone: payroll.employee.phoneNumber ?? undefined,
        bankName: payroll.employee.bankName ?? undefined,
        bankAccount: payroll.employee.bankAccount ?? undefined
      },
      payroll: {
        id: payroll.id,
        monthYear: payroll.monthYear,
        payPeriod: new Date(payroll.monthYear + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        payDate: payroll.processedAt.toISOString(),
        processedDate: payroll.processedAt.toISOString(),
        status: payroll.status
      },
      earnings: {
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        overtime: payroll.overtime,
        overtimeHours: payroll.overtimeHours,
        bonuses: payroll.bonuses,
        bonusDescription: payroll.bonusDescription ?? undefined,
        grossPay: payroll.grossPay
      },
      deductions: {
        nssf: payroll.nssf,
        shif: payroll.shif,
        housingLevy: payroll.housingLevy,
        totalAllowable: payroll.nssf + payroll.shif + payroll.housingLevy,
        taxableIncome: payroll.taxableIncome,
        grossTax: payroll.paye + (payroll.deductions as any)?.personalRelief || 2400,
        personalRelief: (payroll.deductions as any)?.personalRelief || 2400,
        insuranceRelief: (payroll.deductions as any)?.insuranceRelief || 0,
        paye: payroll.paye,
        customDeductions: payroll.customDeductions,
        customDeductionDescription: undefined,
        totalDeductions: payroll.totalDeductions
      },
      netPay: payroll.netPay,
      employerContributions: {
        nssf: payroll.nssf,
        shif: payroll.shif,
        housingLevy: payroll.housingLevy * 0.5,
        total: payroll.nssf + payroll.shif + (payroll.housingLevy * 0.5)
      },
      additionalInfo: {
        unpaidDays: payroll.unpaidDays || undefined,
        unpaidDeduction: payroll.unpaidDeduction || undefined,
        effectiveTaxRate: (payroll.calculations as any)?.effectiveTaxRate,
        ytdGrossPay: ytdTotals.grossPay,
        ytdNetPay: ytdTotals.netPay,
        ytdPaye: ytdTotals.paye
      }
    }
    
    // Generate PDF buffer
    const pdfBuffer = await generatePayslipPDF(payslipData)
    
    // Create filename
    const fileName = `payslip_${payroll.employee.name.replace(/\s+/g, '_')}_${payroll.monthYear}.pdf`
    
    // Return PDF as downloadable file - convert Buffer to Uint8Array
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
    
  } catch (error) {
    console.error('Error generating payslip PDF:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate payslip PDF' 
      },
      { status: 500 }
    )
  }
}

// POST /api/payslips/download/[id] - Preview payslip data (without generating PDF)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payroll = await prisma.payrollRun.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: {
            company: true
          }
        }
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
    
    // Calculate YTD totals
    const currentDate = new Date(payroll.monthYear + '-01')
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1)
    
    const ytdPayrolls = await prisma.payrollRun.findMany({
      where: {
        employeeId: payroll.employeeId,
        monthYear: {
          gte: startOfYear.toISOString().slice(0, 7),
          lte: payroll.monthYear
        }
      }
    })
    
    const ytdTotals = ytdPayrolls.reduce(
      (acc, run) => ({
        grossPay: acc.grossPay + run.grossPay,
        paye: acc.paye + run.paye,
        nssf: acc.nssf + run.nssf,
        shif: acc.shif + run.shif,
        housingLevy: acc.housingLevy + run.housingLevy,
        totalDeductions: acc.totalDeductions + run.totalDeductions,
        netPay: acc.netPay + run.netPay
      }),
      { grossPay: 0, paye: 0, nssf: 0, shif: 0, housingLevy: 0, totalDeductions: 0, netPay: 0 }
    )
    
    const payslipPreview = {
      company: payroll.employee.company,
      employee: payroll.employee,
      payPeriod: {
        month: new Date(payroll.monthYear + '-01').toLocaleString('en-US', { month: 'long' }),
        year: new Date(payroll.monthYear + '-01').getFullYear(),
        monthYear: payroll.monthYear
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
      ytdTotals,
      employerContributions: {
        nssf: payroll.nssf,
        housingLevy: payroll.housingLevy * 0.5
      }
    }
    
    return NextResponse.json({
      success: true,
      data: payslipPreview
    })
    
  } catch (error) {
    console.error('Error previewing payslip:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to preview payslip' 
      },
      { status: 500 }
    )
  }
}