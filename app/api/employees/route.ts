// src/app/api/employees/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { employeeSchema } from '@/app/lib/validations' 
import { z } from 'zod'

// GET - Fetch all employees or filter by query params
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const contractType = searchParams.get('contractType')

    const whereClause: any = {}
    
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }
    
    if (contractType) {
      whereClause.contractType = contractType.toUpperCase()
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            payrollRuns: true,
            salaryAdjustments: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch employees',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Create a new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the input data
    const validatedData = employeeSchema.parse(body)
    
    // Check for duplicate KRA PIN
    const existingKraPin = await prisma.employee.findUnique({
      where: { kraPin: validatedData.kraPin.toUpperCase() }
    })
    
    if (existingKraPin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate KRA PIN',
          message: 'An employee with this KRA PIN already exists'
        },
        { status: 409 }
      )
    }
    
    // Check for duplicate National ID
    const existingNationalId = await prisma.employee.findUnique({
      where: { nationalId: validatedData.nationalId }
    })
    
    if (existingNationalId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate National ID',
          message: 'An employee with this National ID already exists'
        },
        { status: 409 }
      )
    }
    
    // Check for duplicate Employee Number if provided
    if (validatedData.employeeNumber) {
      const existingEmployeeNumber = await prisma.employee.findUnique({
        where: { employeeNumber: validatedData.employeeNumber }
      })
      
      if (existingEmployeeNumber) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate Employee Number',
            message: 'An employee with this Employee Number already exists'
          },
          { status: 409 }
        )
      }
    }
    
    // Map contract type to match Prisma enum
    const contractTypeMap: Record<string, string> = {
      'permanent': 'PERMANENT',
      'contract': 'CONTRACT',
      'casual': 'CASUAL',
      'intern': 'INTERN'
    }
    
    // Create the employee
    const employee = await prisma.employee.create({
      data: {
        name: validatedData.name,
        kraPin: validatedData.kraPin.toUpperCase(),
        nationalId: validatedData.nationalId,
        employeeNumber: validatedData.employeeNumber || undefined,
        bankName: validatedData.bankName,
        bankBranch: validatedData.bankBranch,
        bankAccount: validatedData.bankAccount,
        basicSalary: validatedData.basicSalary,
        allowances: validatedData.allowances,
        startDate: validatedData.startDate,
        contractType: validatedData.contractType,
        isActive: true
      }
    })
    
    // Log the action (optional - for audit trail)
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_EMPLOYEE',
        entityType: 'Employee',
        entityId: employee.id,
        newValues: employee
      }
    })
    
    return NextResponse.json(
      {
        success: true,
        data: employee,
        message: 'Employee created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating employee:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Invalid employee data',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - Update an existing employee
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing employee ID',
          message: 'Employee ID is required for updates'
        },
        { status: 400 }
      )
    }
    
    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
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
    
    // Validate the update data
    const validatedData = employeeSchema.partial().parse(updateData)
    
    // Check for duplicate KRA PIN (if being updated)
    if (validatedData.kraPin && validatedData.kraPin.toUpperCase() !== existingEmployee.kraPin) {
      const duplicateKraPin = await prisma.employee.findFirst({
        where: {
          kraPin: validatedData.kraPin.toUpperCase(),
          id: { not: id }
        }
      })
      
      if (duplicateKraPin) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate KRA PIN',
            message: 'Another employee with this KRA PIN already exists'
          },
          { status: 409 }
        )
      }
    }
    
    // Check for duplicate National ID (if being updated)
    if (validatedData.nationalId && validatedData.nationalId !== existingEmployee.nationalId) {
      const duplicateNationalId = await prisma.employee.findFirst({
        where: {
          nationalId: validatedData.nationalId,
          id: { not: id }
        }
      })
      
      if (duplicateNationalId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate National ID',
            message: 'Another employee with this National ID already exists'
          },
          { status: 409 }
        )
      }
    }
    
    // Map contract type if provided
    let mappedContractType
    if (validatedData.contractType) {
      const contractTypeMap: Record<string, string> = {
        'permanent': 'PERMANENT',
        'contract': 'CONTRACT',
        'casual': 'CASUAL',
        'intern': 'INTERN'
      }
      mappedContractType = contractTypeMap[validatedData.contractType] as any
    }
    
    // If salary is being changed, create a salary adjustment record
    if (
      (validatedData.basicSalary && validatedData.basicSalary !== existingEmployee.basicSalary) ||
      (validatedData.allowances !== undefined && validatedData.allowances !== existingEmployee.allowances)
    ) {
      await prisma.salaryAdjustment.create({
        data: {
          employeeId: id,
          previousBasicSalary: existingEmployee.basicSalary,
          previousAllowances: existingEmployee.allowances,
          newBasicSalary: validatedData.basicSalary || existingEmployee.basicSalary,
          newAllowances: validatedData.allowances !== undefined ? validatedData.allowances : existingEmployee.allowances,
          effectiveDate: new Date(),
          reason: 'Updated via employee edit',
          adjustmentType: 'OTHER'
        }
      })
    }
    
    // Prepare update data
    const updatePayload: any = {}
    if (validatedData.name) updatePayload.name = validatedData.name
    if (validatedData.kraPin) updatePayload.kraPin = validatedData.kraPin.toUpperCase()
    if (validatedData.nationalId) updatePayload.nationalId = validatedData.nationalId
    if (validatedData.employeeNumber !== undefined) updatePayload.employeeNumber = validatedData.employeeNumber
    if (validatedData.bankName) updatePayload.bankName = validatedData.bankName
    if (validatedData.bankBranch) updatePayload.bankBranch = validatedData.bankBranch
    if (validatedData.bankAccount) updatePayload.bankAccount = validatedData.bankAccount
    if (validatedData.basicSalary) updatePayload.basicSalary = validatedData.basicSalary
    if (validatedData.allowances !== undefined) updatePayload.allowances = validatedData.allowances
    if (validatedData.startDate) updatePayload.startDate = validatedData.startDate
    if (mappedContractType) updatePayload.contractType = mappedContractType
    
    // Update the employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updatePayload
    })
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_EMPLOYEE',
        entityType: 'Employee',
        entityId: id,
        oldValues: existingEmployee,
        newValues: updatedEmployee
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully'
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Invalid employee data',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
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