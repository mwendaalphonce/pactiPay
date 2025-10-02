
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// GET /api/payslips - Get all payslips with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get('monthYear')
    const employeeId = searchParams.get('employeeId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (monthYear) {
      where.monthYear = monthYear
    }
    
    if (employeeId) {
      where.employeeId = employeeId
    }
    
    const [payslips, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              kraPin: true,
              employeeNumber: true,
              bankName: true,
              bankBranch: true,
              bankAccount: true
            }
          }
        },
        orderBy: [
          { monthYear: 'desc' },
          { employee: { name: 'asc' } }
        ],
        skip,
        take: limit
      }),
      prisma.payrollRun.count({ where })
    ])
    
    // Transform data for payslip view
    const transformedPayslips = payslips.map(payroll => ({
      id: payroll.id,
      employee: payroll.employee,
      monthYear: payroll.monthYear,
      grossPay: payroll.grossPay,
      totalDeductions: payroll.totalDeductions,
      netPay: payroll.netPay,
      createdAt: payroll.createdAt,
      status: 'processed' as const
    }))
    
    return NextResponse.json({
      success: true,
      data: transformedPayslips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payslips:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch payslips' 
      },
      { status: 500 }
    )
  }
}

// src/app/api/payslips/[id]/route.ts
