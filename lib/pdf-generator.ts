// lib/pdf-generator.ts
import puppeteer from 'puppeteer'
import type { PayslipData } from '@/types'

export async function generatePayslipPDF(payslipData: PayslipData): Promise<Buffer> {
  let browser = null
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()
    
    // Generate HTML content
    const html = generatePayslipHTML(payslipData)
    
    // Set content and wait for it to load
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    })

    return Buffer.from(pdfBuffer)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF')
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

function generatePayslipHTML(data: PayslipData): string {
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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - ${data.employee.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      padding: 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }

    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }

    .company-info h1 {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 5px;
    }

    .company-info p {
      font-size: 11px;
      color: #6b7280;
      margin: 2px 0;
    }

    .payslip-info {
      text-align: right;
    }

    .status-badge {
      display: inline-block;
      background: #d1fae5;
      color: #065f46;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .payslip-info h2 {
      font-size: 20px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 5px;
    }

    .payslip-info p {
      font-size: 11px;
      color: #6b7280;
    }

    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }

    .info-box h3 {
      font-size: 11px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      text-transform: uppercase;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      font-size: 11px;
    }

    .info-row .label {
      color: #6b7280;
    }

    .info-row .value {
      font-weight: 500;
      color: #111827;
    }

    .section {
      margin-bottom: 25px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }

    .subsection-title {
      font-size: 10px;
      font-weight: 600;
      color: #2563eb;
      margin: 12px 0 8px 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .amount-row {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      font-size: 11px;
    }

    .amount-row.indent {
      padding-left: 20px;
    }

    .amount-row .label {
      color: #374151;
    }

    .amount-row .amount {
      font-weight: 500;
    }

    .amount-row.total {
      font-size: 13px;
      font-weight: 600;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
    }

    .amount-row.total.earnings {
      color: #059669;
    }

    .amount-row.total.deductions {
      color: #dc2626;
    }

    .red-amount {
      color: #dc2626;
    }

    .green-amount {
      color: #059669;
    }

    .blue-amount {
      color: #2563eb;
    }

    .tax-calc-box {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      margin: 12px 0;
    }

    .tax-calc-box .subsection-title {
      color: #374151;
      margin-top: 0;
    }

    .net-pay-box {
      background: #dbeafe;
      border: 2px solid #60a5fa;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .net-pay-box .label-section p:first-child {
      font-size: 12px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 2px;
    }

    .net-pay-box .label-section p:last-child {
      font-size: 10px;
      color: #3b82f6;
    }

    .net-pay-box .amount-section {
      text-align: right;
    }

    .net-pay-box .amount-section .amount {
      font-size: 28px;
      font-weight: bold;
      color: #1e3a8a;
    }

    .net-pay-box .amount-section .tax-rate {
      font-size: 10px;
      color: #3b82f6;
      margin-top: 2px;
    }

    .employer-contributions {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }

    .employer-contributions h3 {
      font-size: 11px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
    }

    .contributions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 12px;
    }

    .contribution-item .label {
      font-size: 10px;
      color: #6b7280;
      display: block;
      margin-bottom: 4px;
    }

    .contribution-item .amount {
      font-size: 11px;
      font-weight: 500;
      color: #111827;
    }

    .contributions-total {
      display: flex;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      font-weight: 600;
      color: #374151;
    }

    .footer {
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #6b7280;
      line-height: 1.6;
    }

    .footer p {
      margin: 4px 0;
    }

    .separator {
      height: 1px;
      background: #e5e7eb;
      margin: 12px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>${data.company.name}</h1>
        <p>${data.company.address}</p>
        <p>${data.company.phone} • ${data.company.email}</p>
        ${data.company.kraPin ? `<p>KRA PIN: ${data.company.kraPin}</p>` : ''}
      </div>
      <div class="payslip-info">
        <span class="status-badge">✓ APPROVED</span>
        <h2>PAYSLIP</h2>
        <p>${getMonthYearDisplay(data.payroll.monthYear)}</p>
      </div>
    </div>

    <!-- Employee & Payment Information -->
    <div class="info-section">
      <div class="info-box">
        <h3>👤 Employee Information</h3>
        <div class="info-row">
          <span class="label">Name:</span>
          <span class="value">${data.employee.name}</span>
        </div>
        ${data.employee.employeeNumber ? `
        <div class="info-row">
          <span class="label">Employee No:</span>
          <span class="value">${data.employee.employeeNumber}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="label">KRA PIN:</span>
          <span class="value">${data.employee.kraPin}</span>
        </div>
        <div class="info-row">
          <span class="label">National ID:</span>
          <span class="value">${data.employee.nationalId}</span>
        </div>
        ${data.employee.position ? `
        <div class="info-row">
          <span class="label">Position:</span>
          <span class="value">${data.employee.position}</span>
        </div>
        ` : ''}
        ${data.employee.department ? `
        <div class="info-row">
          <span class="label">Department:</span>
          <span class="value">${data.employee.department}</span>
        </div>
        ` : ''}
      </div>

      <div class="info-box">
        <h3>💳 Payment Information</h3>
        <div class="info-row">
          <span class="label">Bank:</span>
          <span class="value">${data.employee.bankName}</span>
        </div>
        <div class="info-row">
          <span class="label">Account:</span>
          <span class="value">${data.employee.bankAccount}</span>
        </div>
        <div class="info-row">
          <span class="label">Pay Date:</span>
          <span class="value">${formatDate(data.payroll.payDate)}</span>
        </div>
        <div class="info-row">
          <span class="label">Processed:</span>
          <span class="value">${formatDate(data.payroll.processedDate)}</span>
        </div>
      </div>
    </div>

    <!-- Earnings Section -->
    <div class="section">
      <h2 class="section-title">EARNINGS</h2>
      <div class="amount-row">
        <span class="label">Basic Salary</span>
        <span class="amount">${formatCurrency(data.earnings.basicSalary)}</span>
      </div>
      ${data.earnings.allowances > 0 ? `
      <div class="amount-row">
        <span class="label">Allowances</span>
        <span class="amount">${formatCurrency(data.earnings.allowances)}</span>
      </div>
      ` : ''}
      ${data.earnings.overtime > 0 ? `
      <div class="amount-row">
        <span class="label">Overtime (${data.earnings.overtimeHours} hrs)</span>
        <span class="amount">${formatCurrency(data.earnings.overtime)}</span>
      </div>
      ` : ''}
      ${data.earnings.bonuses > 0 ? `
      <div class="amount-row">
        <span class="label">Bonuses ${data.earnings.bonusDescription ? `(${data.earnings.bonusDescription})` : ''}</span>
        <span class="amount">${formatCurrency(data.earnings.bonuses)}</span>
      </div>
      ` : ''}
      <div class="amount-row total earnings">
        <span class="label">GROSS PAY</span>
        <span class="amount">${formatCurrency(data.earnings.grossPay)}</span>
      </div>
    </div>

    <!-- Deductions Section -->
    <div class="section">
      <h2 class="section-title">DEDUCTIONS</h2>
      
      <!-- Allowable Deductions -->
      <p class="subsection-title">ℹ️ ALLOWABLE DEDUCTIONS (Reduce Taxable Income - Dec 2024 Tax Law)</p>
      <div class="amount-row indent">
        <span class="label">NSSF</span>
        <span class="amount red-amount">${formatCurrency(data.deductions.nssf)}</span>
      </div>
      <div class="amount-row indent">
        <span class="label">SHIF</span>
        <span class="amount red-amount">${formatCurrency(data.deductions.shif)}</span>
      </div>
      <div class="amount-row indent">
        <span class="label">Housing Levy</span>
        <span class="amount red-amount">${formatCurrency(data.deductions.housingLevy)}</span>
      </div>
      <div class="amount-row indent" style="font-weight: 600; border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px;">
        <span class="label blue-amount">Total Allowable Deductions</span>
        <span class="amount blue-amount">${formatCurrency(data.deductions.totalAllowable)}</span>
      </div>

      <!-- Tax Calculation -->
      <div class="tax-calc-box">
        <p class="subsection-title">TAX CALCULATION</p>
        <div class="amount-row">
          <span class="label">Taxable Income (After Allowable Deductions)</span>
          <span class="amount">${formatCurrency(data.deductions.taxableIncome)}</span>
        </div>
        <div class="amount-row">
          <span class="label">Gross Tax</span>
          <span class="amount">${formatCurrency(data.deductions.grossTax)}</span>
        </div>
        <div class="amount-row">
          <span class="label green-amount">Less: Personal Relief</span>
          <span class="amount green-amount">-${formatCurrency(data.deductions.personalRelief)}</span>
        </div>
        ${data.deductions.insuranceRelief > 0 ? `
        <div class="amount-row">
          <span class="label green-amount">Less: Insurance Relief</span>
          <span class="amount green-amount">-${formatCurrency(data.deductions.insuranceRelief)}</span>
        </div>
        ` : ''}
        <div class="amount-row" style="font-weight: 600; border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px;">
          <span class="label red-amount">PAYE (Net Tax)</span>
          <span class="amount red-amount">${formatCurrency(data.deductions.paye)}</span>
        </div>
      </div>

      ${data.deductions.customDeductions > 0 ? `
      <!-- Custom Deductions -->
      <p class="subsection-title">OTHER DEDUCTIONS</p>
      <div class="amount-row indent">
        <span class="label">Custom Deductions ${data.deductions.customDeductionDescription ? `(${data.deductions.customDeductionDescription})` : ''}</span>
        <span class="amount red-amount">${formatCurrency(data.deductions.customDeductions)}</span>
      </div>
      ` : ''}

      <div class="amount-row total deductions">
        <span class="label">TOTAL DEDUCTIONS</span>
        <span class="amount">${formatCurrency(data.deductions.totalDeductions)}</span>
      </div>
    </div>

    <!-- Net Pay -->
    <div class="net-pay-box">
      <div class="label-section">
        <p>NET PAY</p>
        <p>Amount to be paid</p>
      </div>
      <div class="amount-section">
        <div class="amount">${formatCurrency(data.netPay)}</div>
        ${data.additionalInfo?.effectiveTaxRate ? `
        <div class="tax-rate">Effective Tax Rate: ${data.additionalInfo.effectiveTaxRate.toFixed(2)}%</div>
        ` : ''}
      </div>
    </div>

    <!-- Employer Contributions -->
    <div class="employer-contributions">
      <h3>EMPLOYER CONTRIBUTIONS</h3>
      <div class="contributions-grid">
        <div class="contribution-item">
          <span class="label">NSSF</span>
          <span class="amount">${formatCurrency(data.employerContributions.nssf)}</span>
        </div>
        <div class="contribution-item">
          <span class="label">SHIF</span>
          <span class="amount">${formatCurrency(data.employerContributions.shif)}</span>
        </div>
        <div class="contribution-item">
          <span class="label">Housing Levy</span>
          <span class="amount">${formatCurrency(data.employerContributions.housingLevy)}</span>
        </div>
      </div>
      <div class="contributions-total">
        <span>Total Employer Contributions</span>
        <span>${formatCurrency(data.employerContributions.total)}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      ${data.additionalInfo?.unpaidDays && data.additionalInfo.unpaidDays > 0 ? `
      <p>* Unpaid Days: ${data.additionalInfo.unpaidDays} days (${formatCurrency(data.additionalInfo.unpaidDeduction || 0)})</p>
      ` : ''}
      <p>* This payslip is computer-generated and does not require a signature.</p>
      <p>* SHIF and Housing Levy are allowable deductions as per December 2024 Tax Laws Amendment Act.</p>
      <p>* For queries, contact the HR department.</p>
    </div>
  </div>
</body>
</html>
  `
}