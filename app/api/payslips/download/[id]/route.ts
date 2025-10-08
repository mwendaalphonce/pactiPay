// src/app/api/payslips/download/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePayslipPDF } from '@/pdf/payslip-generator'

// GET /api/payslips/download/[id] - Download payslip as PDF
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
    
    // Prepare payslip data
    const payslipData = {
      employee: {
        name: payroll.employee.name,
        kraPin: payroll.employee.kraPin,
        employeeNumber: payroll.employee.employeeNumber,
        nationalId: payroll.employee.nationalId,
        bankName: payroll.employee.bankName,
        bankBranch: payroll.employee.bankBranch,
        bankAccount: payroll.employee.bankAccount,
        contractType: payroll.employee.contractType
      },
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
        nssf: payroll.nssf, // Employer matches employee contribution
        housingLevy: payroll.housingLevy * 0.5 // Employer pays 1.5%, employee pays 1.5%
      },
      processedDate: payroll.createdAt,
      generatedDate: new Date()
    }
    
    // Generate PDF buffer
    const pdfBuffer = await generatePayslipPDF(payslipData)
    
    // Create filename
    const fileName = `payslip_${payroll.employee.name.replace(/\s+/g, '_')}_${payroll.monthYear}.pdf`
    
    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
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