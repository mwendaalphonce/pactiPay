// app/api/payroll/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsPDF } from 'jspdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id } = await params

    // 🔒 SECURITY: Get authenticated user's session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized - No company associated with user' },
        { status: 401 }
      )
    }

    // ✅ DIRECT DATABASE QUERY - No HTTP fetch!
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
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
        { error: 'Payslip not found' },
        { status: 404 }
      )
    }

    // 🔒 SECURITY: Verify user can only access payroll from their company
    if (payrollRun.employee.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot access payroll from different company' },
        { status: 403 }
      )
    }

    // Get additional data from JSON fields
    const deductions = (payrollRun.deductions as any) || {}
    const calculations = (payrollRun.calculations as any) || {}

    // Build payslip data
    const payslipData = {
      employee: {
        id: payrollRun.employee.id,
        name: payrollRun.employee.name,
        employeeNumber: payrollRun.employee.employeeNumber || undefined,
        kraPin: payrollRun.employee.kraPin,
        nationalId: payrollRun.employee.nationalId,
        email: payrollRun.employee.email || undefined,
        phone: payrollRun.employee.phoneNumber || undefined,
        bankName: payrollRun.employee.bankName,
        bankAccount: payrollRun.employee.bankAccount,
        position: undefined, // Add if you have this field
        department: undefined // Add if you have this field
      },
      company: {
        id: payrollRun.employee.company.id,
        name: payrollRun.employee.company.companyName,
        address: payrollRun.employee.company.physicalAddress || 
                 payrollRun.employee.company.postalAddress || 
                 'Address not provided',
        phone: payrollRun.employee.company.phone || 'N/A',
        email: payrollRun.employee.company.email,
        kraPin: payrollRun.employee.company.kraPin
      },
      payroll: {
        id: payrollRun.id,
        monthYear: payrollRun.monthYear,
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
      additionalInfo: {
        unpaidDays: payrollRun.unpaidDays || undefined,
        unpaidDeduction: payrollRun.unpaidDeduction || undefined,
        effectiveTaxRate: calculations.effectiveTaxRate || 
                         (payrollRun.grossPay > 0 ? (payrollRun.paye / payrollRun.grossPay * 100) : 0)
      }
    }

    // Create PDF with jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Generate PDF content
    generatePayslipPDF(doc, payslipData)

    // Get PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Set up response headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="payslip-${payslipData.payroll.monthYear}-${payslipData.employee.name.replace(/\s+/g, '-')}.pdf"`)

    return new NextResponse(pdfBuffer, { 
      status: 200,
      headers 
    })

  } catch (error) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generatePayslipPDF(doc: jsPDF, payslipData: any) {
  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMonthYearDisplay = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })
  }

  let yPos = 20
  const leftMargin = 15
  const rightMargin = 195
  const pageWidth = 210

  // Two Column Header - Company Info (Left) | Payslip Info (Right)
  const headerStartY = yPos
  
  // LEFT SIDE - Company Information
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(payslipData.company.name.toUpperCase(), leftMargin, yPos)
  yPos += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(payslipData.company.address, leftMargin, yPos)
  yPos += 4
  doc.text(payslipData.company.phone, leftMargin, yPos)
  yPos += 4
  doc.text(payslipData.company.email, leftMargin, yPos)
  yPos += 4

  if (payslipData.company.kraPin) {
    doc.setFont('helvetica', 'bold')
    doc.text(`KRA PIN: `, leftMargin, yPos)
     doc.setTextColor(37, 99, 235) 
    doc.setFont('helvetica', 'normal')
    doc.text(payslipData.company.kraPin, leftMargin + 17, yPos)
    yPos += 4
  }

  // RIGHT SIDE - Payslip Information
  let rightYPos = headerStartY
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  // Blue color for PAYSLIP
  doc.text('PAYSLIP', rightMargin, rightYPos, { align: 'right' })
  rightYPos += 8

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(getMonthYearDisplay(payslipData.payroll.monthYear), rightMargin, rightYPos, { align: 'right' })
  rightYPos += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Pay Date: ${formatDate(payslipData.payroll.payDate)}`, rightMargin, rightYPos, { align: 'right' })
  rightYPos += 4
  doc.text(`Processed: ${formatDate(payslipData.payroll.processedDate)}`, rightMargin, rightYPos, { align: 'right' })
  
  doc.setTextColor(0, 0, 0)
  
  // Reset yPos to the maximum of both columns
  yPos = Math.max(yPos, rightYPos) + 8

  // Horizontal line
  doc.setLineWidth(0.1)
  doc.line(leftMargin, yPos, rightMargin, yPos)
  yPos += 8

  // Employee Information Section
  const leftColX = leftMargin
  const rightColX = 110
  let leftY = yPos
  let rightY = yPos

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(37, 99, 235)
  doc.text('EMPLOYEE INFORMATION', leftColX, leftY)
  doc.setTextColor(0, 0, 0)
  leftY += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  const addLeftRow = (label: string, value: string) => {
    doc.setTextColor(100, 100, 100)
    doc.text(`${label}`, leftColX, leftY)
    doc.setTextColor(0, 0, 0)
    doc.text(value, leftColX + 40, leftY)
    leftY += 5
  }

  addLeftRow('Name:', payslipData.employee.name)
  if (payslipData.employee.employeeNumber) {
    addLeftRow('Employee No:', payslipData.employee.employeeNumber)
  }
  addLeftRow('KRA PIN:', payslipData.employee.kraPin)
  addLeftRow('National ID:', payslipData.employee.nationalId)
  if (payslipData.employee.position) {
    addLeftRow('Position:', payslipData.employee.position)
  }
  if (payslipData.employee.department) {
    addLeftRow('Department:', payslipData.employee.department)
  }

  // Right Column - Bank Information
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(37, 99, 235)
  doc.text('BANK INFORMATION', rightColX, rightY)
  doc.setTextColor(0, 0, 0)
  rightY += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const addRightRow = (label: string, value: string) => {
    doc.setTextColor(100, 100, 100)
    doc.text(`${label}`, rightColX, rightY)
    doc.setTextColor(0, 0, 0)
    doc.text(value, rightColX + 35, rightY)
    rightY += 5
  }

  addRightRow('Bank:', payslipData.employee.bankName)
  addRightRow('Account:', payslipData.employee.bankAccount)

  yPos = Math.max(leftY, rightY) + 8

  // Helper function to add rows
  const addRow = (label: string, value: string, isBold = false, indent = 0) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.text(label, leftMargin + indent, yPos)
    doc.text(value, rightMargin, yPos, { align: 'right' })
    yPos += 5
  }

  // Earnings Section
  doc.setLineWidth(0.1)
  doc.line(leftMargin, yPos, rightMargin, yPos)
  yPos += 5

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('EARNINGS', leftMargin, yPos)
  yPos += 7

  doc.setFontSize(9)
  addRow('Basic Salary', formatCurrency(payslipData.earnings.basicSalary))
  
  if (payslipData.earnings.allowances > 0) {
    addRow('Allowances', formatCurrency(payslipData.earnings.allowances))
  }

  if (payslipData.earnings.overtime > 0) {
    addRow(`Overtime (${payslipData.earnings.overtimeHours} hrs)`, formatCurrency(payslipData.earnings.overtime))
  }

  if (payslipData.earnings.bonuses > 0) {
    const bonusLabel = payslipData.earnings.bonusDescription 
      ? `Bonuses (${payslipData.earnings.bonusDescription})` 
      : 'Bonuses'
    addRow(bonusLabel, formatCurrency(payslipData.earnings.bonuses))
  }

  yPos += 2
  doc.line(leftMargin, yPos, rightMargin, yPos)
  yPos += 5
  doc.setFontSize(11)
  addRow('GROSS PAY', formatCurrency(payslipData.earnings.grossPay), true)
  yPos += 5

  // Deductions Section
  doc.setFontSize(9)
  doc.line(leftMargin, yPos, rightMargin, yPos)
  yPos += 5

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DEDUCTIONS', leftMargin, yPos)
  yPos += 7

  // Allowable Deductions
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(37, 99, 235)
  doc.text('ALLOWABLE DEDUCTIONS ', leftMargin, yPos)
  doc.setTextColor(0, 0, 0)
  yPos += 5

  doc.setFontSize(9)
  addRow('NSSF', formatCurrency(payslipData.deductions.nssf), false, 3)
  addRow('SHIF', formatCurrency(payslipData.deductions.shif), false, 3)
  addRow('Housing Levy', formatCurrency(payslipData.deductions.housingLevy), false, 3)
  addRow('Total Allowable Deductions', formatCurrency(payslipData.deductions.totalAllowable), true, 3)
  yPos += 3

  // Tax Calculation
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)
  doc.text('TAX CALCULATION', leftMargin, yPos)
  doc.setTextColor(0, 0, 0)
  yPos += 5

  doc.setFontSize(9)
  addRow('Taxable Income (After Allowable Deductions)', formatCurrency(payslipData.deductions.taxableIncome), false, 3)
  addRow('Gross Tax', formatCurrency(payslipData.deductions.grossTax), false, 3)
  addRow('Less: Personal Relief', `-${formatCurrency(payslipData.deductions.personalRelief)}`, false, 3)
  
  if (payslipData.deductions.insuranceRelief > 0) {
    addRow('Less: Insurance Relief', `-${formatCurrency(payslipData.deductions.insuranceRelief)}`, false, 3)
  }
  
  addRow('PAYE (Net Tax)', formatCurrency(payslipData.deductions.paye), true, 3)
  yPos += 3

  // Other Deductions
  if (payslipData.deductions.customDeductions > 0) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('OTHER DEDUCTIONS', leftMargin, yPos)
    yPos += 5

    doc.setFontSize(9)
    const customLabel = payslipData.deductions.customDeductionDescription 
      ? `Custom Deductions (${payslipData.deductions.customDeductionDescription})` 
      : 'Custom Deductions'
    addRow(customLabel, formatCurrency(payslipData.deductions.customDeductions), false, 3)
    yPos += 3
  }

  doc.line(leftMargin, yPos, rightMargin, yPos)
  yPos += 5
  doc.setFontSize(11)
  addRow('TOTAL DEDUCTIONS', formatCurrency(payslipData.deductions.totalDeductions), true)
  yPos += 8

  // Net Pay Box
  doc.setFillColor(219, 234, 254)
  doc.setDrawColor(59, 130, 246)
  doc.setLineWidth(0.1)
  doc.rect(leftMargin, yPos, rightMargin - leftMargin, 15, 'FD')
  
  doc.setTextColor(30, 58, 138)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('NET PAY', leftMargin + 3, yPos + 6)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Amount to be paid', leftMargin + 3, yPos + 10)
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(payslipData.netPay), rightMargin - 3, yPos + 9, { align: 'right' })
  
  doc.setTextColor(0, 0, 0)
  yPos += 20

  // Footer
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  
  if (payslipData.additionalInfo?.unpaidDays && payslipData.additionalInfo.unpaidDays > 0) {
    doc.text(`* Unpaid Days: ${payslipData.additionalInfo.unpaidDays} days (${formatCurrency(payslipData.additionalInfo.unpaidDeduction || 0)})`, leftMargin, yPos)
    yPos += 4
  }
  doc.text('* This payslip is computer-generated and does not require a signature.', leftMargin, yPos)
  yPos += 4
  doc.text('* SHIF and Housing Levy are allowable deductions as per December 2024 Tax Laws Amendment Act.', leftMargin, yPos)
  yPos += 4
  doc.text('* For queries, contact the HR department.', leftMargin, yPos)
}