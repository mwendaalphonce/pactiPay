// src/app/api/employees/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch a single employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        payrollRuns: {
          orderBy: {
            monthYear: 'desc'
          },
          take: 12 // Last 12 months
        },
        salaryAdjustments: {
          orderBy: {
            effectiveDate: 'desc'
          }
        },
        deductions: {
          where: {
            isActive: true
          }
        },
        bonuses: {
          where: {
            isProcessed: false
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
          message: 'The specified employee does not exist'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: employee
    })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch employee ',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete an employee (mark as inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            payrollRuns: true
          }
        }
      }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
          message: 'The specified employee does not exist'
        },
        { status: 404 }
      )
    }

    // Soft delete - mark as inactive instead of deleting
    // This preserves payroll history for compliance
    const updatedEmployee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        isActive: false
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_EMPLOYEE',
        entityType: 'Employee',
        entityId: params.id,
        oldValues: existingEmployee,
        newValues: { isActive: false }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee deactivated successfully',
      note: 'Employee marked as inactive. Payroll history preserved for compliance.'
    })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PATCH - Reactivate an inactive employee
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'reactivate') {
      const employee = await prisma.employee.update({
        where: { id: params.id },
        data: {
          isActive: true
        }
      })

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'REACTIVATE_EMPLOYEE',
          entityType: 'Employee',
          entityId: params.id,
          newValues: { isActive: true }
        }
      })

      return NextResponse.json({
        success: true,
        data: employee,
        message: 'Employee reactivated successfully'
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
        message: 'Unsupported action type'
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}