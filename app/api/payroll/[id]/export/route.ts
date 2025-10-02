// src/app/api/payroll/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

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
    
    // Generate PDF (you'll need a PDF library like jsPDF or Puppeteer)
    // For now, let's return JSON that can be used to generate PDF on frontend
    
    const payslipData = {
      company: {
        name: 'Your Company Name',
        address: 'Company Address',
        phone: 'Company Phone',
        email: 'company@email.com'
      },
      employee: {
        name: payrollRun.employee.name,
        kraPin: payrollRun.employee.kraPin,
        employeeId: payrollRun.employee.id,
        
      },
      period: payrollRun.monthYear,
      processedDate: payrollRun.createdAt,
      earnings: {
        basicSalary: payrollRun.basicSalary,
        allowances: payrollRun.allowances,
        overtime: payrollRun.overtime,
        bonuses: payrollRun.bonuses,
        grossPay: payrollRun.grossPay
      },
      deductions: {
        nssf: payrollRun.nssf,
        shif: payrollRun.shif,
        housingLevy: payrollRun.housingLevy,
        paye: payrollRun.paye,
        customDeductions: payrollRun.customDeductions,
        totalDeductions: payrollRun.totalDeductions
      },
      netPay: payrollRun.netPay,
      
    }
    
    // Return JSON for now - you can implement PDF generation
    return NextResponse.json({
      success: true,
      data: payslipData
    })
    
    // TODO: Implement PDF generation
    // Example with jsPDF:
    /*
    const doc = new jsPDF()
    // ... add content to PDF
    const pdfBuffer = doc.output('arraybuffer')
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="payslip-${payrollRun.monthYear}-${payrollRun.employee.name}.pdf"`
      }
    })
    */
    
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export payslip' },
      { status: 500 }
    )
  }
}