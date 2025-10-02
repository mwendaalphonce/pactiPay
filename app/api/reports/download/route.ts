// src/app/api/reports/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, month } = body

    if (!type || !month) {
      return NextResponse.json(
        { error: 'Missing required fields: type and month' },
        { status: 400 }
      )
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM format.' },
        { status: 400 }
      )
    }

    let reportData: any[] = []
    let filename = ''

    switch (type) {
      case 'monthly_payroll':
        const payrollData = await generateMonthlyPayrollReport(month)
        reportData = payrollData
        filename = `Monthly_Payroll_Report_${month}.xlsx`
        break

      case 'employee_summary':
        const employeeData = await generateEmployeeSummaryReport()
        reportData = employeeData
        filename = `Employee_Summary_Report_${new Date().toISOString().slice(0, 7)}.xlsx`
        break

      case 'statutory_deductions':
        const deductionsData = await generateStatutoryDeductionsReport(month)
        reportData = deductionsData
        filename = `Statutory_Deductions_Report_${month}.xlsx`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    // Generate Excel file
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(reportData)

    // Auto-size columns
    const maxWidth = 50
    if (reportData.length > 0) {
      const columnWidths = Object.keys(reportData[0]).map(key => {
        const maxLength = Math.max(
          key.length,
          ...reportData.map(row => String(row[key] || '').length)
        )
        return { width: Math.min(maxLength + 2, maxWidth) }
      })
      worksheet['!cols'] = columnWidths
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
    
    // Convert to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return file as response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Reports download API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function generateMonthlyPayrollReport(month: string) {
  const payrollRuns = await prisma.payrollRun.findMany({
    where: {
      monthYear: month
    },
    include: {
      employee: {
        select: {
          name: true,
          kraPin: true,
          nationalId: true,
          employeeNumber: true
        }
      }
    },
    orderBy: {
      employee: {
        name: 'asc'
      }
    }
  })

  return payrollRuns.map(payroll => ({
    'Employee Number': payroll.employee.employeeNumber || 'N/A',
    'Employee Name': payroll.employee.name,
    'KRA PIN': payroll.employee.kraPin,
    'National ID': payroll.employee.nationalId,
    'Basic Salary': payroll.basicSalary,
    'Allowances': payroll.allowances,
    'Overtime': payroll.overtime,
    'Bonuses': payroll.bonuses,
    'Gross Pay': payroll.grossPay,
    'PAYE Tax': payroll.paye,
    'NSSF': payroll.nssf,
    'SHIF': payroll.shif,
    'Housing Levy': payroll.housingLevy,
    'Custom Deductions': payroll.customDeductions,
    'Total Deductions': payroll.totalDeductions,
    'Net Pay': payroll.netPay,
    'Processed Date': payroll.processedAt.toLocaleDateString('en-KE'),
    'Status': payroll.status
  }))
}

async function generateEmployeeSummaryReport() {
  const employees = await prisma.employee.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return employees.map(employee => ({
    'Employee Number': employee.employeeNumber || 'N/A',
    'Employee Name': employee.name,
    'KRA PIN': employee.kraPin,
    'National ID': employee.nationalId,
    'Basic Salary': employee.basicSalary,
    'Allowances': employee.allowances,
    'Total Monthly Salary': employee.basicSalary + employee.allowances,
    'Contract Type': employee.contractType,
    'Start Date': employee.startDate.toLocaleDateString('en-KE'),
    'Bank Name': employee.bankName,
    'Bank Account': employee.bankAccount,
    'Status': employee.isActive ? 'Active' : 'Inactive',
    'Created Date': employee.createdAt.toLocaleDateString('en-KE')
  }))
}

async function generateStatutoryDeductionsReport(month: string) {
  const payrollRuns = await prisma.payrollRun.findMany({
    where: {
      monthYear: month
    },
    include: {
      employee: {
        select: {
          name: true,
          kraPin: true,
          employeeNumber: true
        }
      }
    },
    orderBy: {
      employee: {
        name: 'asc'
      }
    }
  })

  return payrollRuns.map(payroll => ({
    'Employee Number': payroll.employee.employeeNumber || 'N/A',
    'Employee Name': payroll.employee.name,
    'KRA PIN': payroll.employee.kraPin,
    'Gross Pay': payroll.grossPay,
    'PAYE Tax': payroll.paye,
    'NSSF Employee': payroll.nssf,
    'NSSF Employer': payroll.nssf, // In Kenya, employer matches employee contribution
    'SHIF Employee': payroll.shif,
    'Housing Levy Employee': payroll.housingLevy,
    'Housing Levy Employer': payroll.housingLevy * 0.5, // Employer pays 1.5%, employee pays 1.5%
    'Total Employee Statutory': payroll.paye + payroll.nssf + payroll.shif + payroll.housingLevy,
    'Total Employer Statutory': payroll.nssf + (payroll.housingLevy * 0.5),
    'Month': month
  }))
}