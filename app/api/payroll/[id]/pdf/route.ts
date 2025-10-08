// app/api/payroll/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id } = await params
    console.log('PDF Route called for ID:', id) 

    // Fetch payslip data
    const baseUrl = request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/payroll/${id}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch payslip data')
    }
    
    const result = await response.json()
    
    if (!result.success || !result.data) {
      throw new Error('Invalid payslip data')
    }

    const { payslipData } = result.data

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
    headers.set('Content-Disposition', `attachment; filename="payslip-${payslipData.payroll.monthYear}-${payslipData.employee.name}.pdf"`)

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

  // Company Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(payslipData.company.name, pageWidth / 2, yPos, { align: 'center' })
  yPos += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(payslipData.company.address, pageWidth / 2, yPos, { align: 'center' })
  yPos += 5
  doc.text(`${payslipData.company.phone} • ${payslipData.company.email}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 5

  if (payslipData.company.kraPin) {
    doc.text(`KRA PIN: ${payslipData.company.kraPin}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
  }

  yPos += 5
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYSLIP', pageWidth / 2, yPos, { align: 'center' })
  yPos += 7

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(getMonthYearDisplay(payslipData.payroll.monthYear), pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // Horizontal line
  doc.setLineWidth(0.5)
  doc.line(leftMargin, yPos, rightMargin, yPos)
  yPos += 8

  // Employee Information (Two Columns)
  const leftColX = leftMargin
  const rightColX = 110
  let leftY = yPos
  let rightY = yPos

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('EMPLOYEE INFORMATION', leftColX, leftY)
  leftY += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  const addLeftRow = (label: string, value: string) => {
    doc.text(`${label}`, leftColX, leftY)
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

  // Right Column
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT INFORMATION', rightColX, rightY)
  rightY += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const addRightRow = (label: string, value: string) => {
    doc.text(`${label}`, rightColX, rightY)
    doc.text(value, rightColX + 35, rightY)
    rightY += 5
  }

  addRightRow('Bank:', payslipData.employee.bankName)
  addRightRow('Account:', payslipData.employee.bankAccount)
  addRightRow('Pay Date:', formatDate(payslipData.payroll.payDate))
  addRightRow('Processed:', formatDate(payslipData.payroll.processedDate))

  yPos = Math.max(leftY, rightY) + 8

  // Helper function to add rows
  const addRow = (label: string, value: string, isBold = false, indent = 0) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.text(label, leftMargin + indent, yPos)
    doc.text(value, rightMargin, yPos, { align: 'right' })
    yPos += 5
  }

  // Earnings Section
  doc.setLineWidth(0.5)
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
  doc.setLineWidth(0.5)
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

  // Employer Contributions
 

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