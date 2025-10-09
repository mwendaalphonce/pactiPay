// app/api/onboarding/complete/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const onboardingSchema = z.object({
  // Step 1: Company Basics
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal('')),
  
  // Step 2: Registration Details
  businessRegNo: z.string().optional().or(z.literal('')),
  kraPin: z.string()
    .min(11, "KRA PIN must be 11 characters")
    .max(11, "KRA PIN must be 11 characters")
    .regex(/^[A-Z]\d{9}[A-Z]$/, "Invalid KRA PIN format (e.g., A123456789Z)"),
  nssfNumber: z.string().optional().or(z.literal('')),
  nhifNumber: z.string().optional().or(z.literal('')),
  shifNumber: z.string().optional().or(z.literal('')),
  housingLevy: z.string().optional().or(z.literal('')),
  
  // Step 3: Location
  physicalAddress: z.string().min(5, "Physical address is required"),
  postalAddress: z.string().optional().or(z.literal('')),
  city: z.string().min(2, "City is required"),
  county: z.string().min(2, "County is required"),
  
  // Step 4: Bank Details (optional)
  bankName: z.string().optional().or(z.literal('')),
  bankBranch: z.string().optional().or(z.literal('')),
  bankAccount: z.string().optional().or(z.literal('')),
  swiftCode: z.string().optional().or(z.literal('')),
  
  // Step 5: Preferences
  payrollDay: z.number().min(1).max(28).default(25),
  signatoryName: z.string().optional().or(z.literal('')),
  signatoryTitle: z.string().optional().or(z.literal('')),
})

export async function POST(req: Request) {
  try {
    
    const session = await getServerSession(authOptions)
    
    
    if (!session) {
      return Response.json({ error: 'No session found. Please sign in again.' }, { status: 401 })
    }
    
    if (!session.user) {
      return Response.json({ error: 'No user found in session. Please sign in again.' }, { status: 401 })
    }
    
    if (!session.user.id) {
      return Response.json({ 
        error: 'Session is invalid. Please sign out and sign in again.',
        debug: process.env.NODE_ENV === 'development' ? { session } : undefined
      }, { status: 401 })
    }
    
    
    // Check if already onboarded
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
 
    if (!user) {
      return Response.json({ error: 'User not found in database' }, { status: 404 })
    }
    
    if (user.hasCompletedOnboarding) {
      return Response.json({ error: 'Already onboarded' }, { status: 400 })
    }
    
    const body = await req.json()
    
    // Validate input
    const validatedData = onboardingSchema.parse(body)
    
    // Check if KRA PIN already exists
    const existingCompany = await prisma.company.findUnique({
      where: { kraPin: validatedData.kraPin.toUpperCase() }
    })
    
    if (existingCompany) {
      return Response.json({ 
        error: 'A company with this KRA PIN already exists' 
      }, { status: 400 })
    }
    
    
    // Create company and update user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          companyName: validatedData.companyName,
          email: validatedData.email,
          phone: validatedData.phone || undefined,
          businessRegNo: validatedData.businessRegNo || undefined,
          kraPin: validatedData.kraPin.toUpperCase(),
          nssfNumber: validatedData.nssfNumber || undefined,
          nhifNumber: validatedData.nhifNumber || undefined,
          shifNumber: validatedData.shifNumber || undefined,
          housingLevy: validatedData.housingLevy || undefined,
          physicalAddress: validatedData.physicalAddress,
          postalAddress: validatedData.postalAddress || undefined,
          city: validatedData.city,
          county: validatedData.county,
          bankName: validatedData.bankName || undefined,
          bankBranch: validatedData.bankBranch || undefined,
          bankAccount: validatedData.bankAccount || undefined,
          swiftCode: validatedData.swiftCode || undefined,
          payrollDay: validatedData.payrollDay,
          signatoryName: validatedData.signatoryName || undefined,
          signatoryTitle: validatedData.signatoryTitle || undefined,
          createdBy: session.user.id,
        },
      })
      
      
      // Update user to mark onboarding complete
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          hasCompletedOnboarding: true,
          onboardingCompletedAt: new Date(),
          companyId: company.id,
        },
      })
      
      
      // Get or create Super Admin role
      let superAdminRole = await tx.role.findUnique({
        where: { name: 'SUPER_ADMIN' }
      })
      
      if (!superAdminRole) {
        
        // Create default roles if they don't exist
        superAdminRole = await tx.role.create({
          data: {
            name: 'SUPER_ADMIN',
            displayName: 'Super Administrator',
            description: 'Full system access',
            level: 1,
          }
        })

        // Create other default roles
        await tx.role.createMany({
          data: [
            {
              name: 'PAYROLL_MANAGER',
              displayName: 'Payroll Manager',
              description: 'Manage payroll operations',
              level: 2,
            },
            {
              name: 'HR_MANAGER',
              displayName: 'HR Manager',
              description: 'Manage employees and HR operations',
              level: 3,
            },
            {
              name: 'VIEWER',
              displayName: 'Viewer',
              description: 'View-only access',
              level: 4,
            }
          ]
        })

        // Create default permissions
        await tx.permission.createMany({
          data: [
            // Employee permissions
            { resource: 'employees', action: 'read', scope: 'all' },
            { resource: 'employees', action: 'write', scope: 'all' },
            { resource: 'employees', action: 'delete', scope: 'all' },
            
            // Payroll permissions
            { resource: 'payroll', action: 'read', scope: 'all' },
            { resource: 'payroll', action: 'write', scope: 'all' },
            { resource: 'payroll', action: 'process', scope: 'all' },
            { resource: 'payroll', action: 'approve', scope: 'all' },
            
            // Reports permissions
            { resource: 'reports', action: 'read', scope: 'all' },
            { resource: 'reports', action: 'download', scope: 'all' },
            
            // Settings permissions
            { resource: 'settings', action: 'read', scope: 'all' },
            { resource: 'settings', action: 'write', scope: 'all' },
          ]
        })

        // Assign all permissions to SUPER_ADMIN
        const allPermissions = await tx.permission.findMany()
        await tx.rolePermission.createMany({
          data: allPermissions.map(p => ({
            roleId: superAdminRole!.id,
            permissionId: p.id,
          }))
        })
        
      }
      
      // Assign Super Admin role to first user
      await tx.userRole.create({
        data: {
          userId: session.user.id,
          roleId: superAdminRole.id,
          assignedBy: session.user.id,
        },
      })
      
      
      // Log audit trail
      await tx.auditLog.create({
        data: {
          action: 'COMPLETE_ONBOARDING',
          entityType: 'Company',
          entityId: company.id,
          userId: session.user.id,
          userEmail: session.user.email || '',
          newValues: {
            companyId: company.id,
            companyName: company.companyName,
            kraPin: company.kraPin,
            timestamp: new Date().toISOString(),
          },
        },
      })
      
      
      return { company, superAdminRole }
    })
    
    
    return Response.json({
      success: true,
      companyId: result.company.id,
      message: 'Onboarding completed successfully',
    })
    
  } catch (error) {
    console.error('❌ Onboarding error:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({
        error: 'Validation error',
        details: error.errors,
      }, { status: 400 })
    }
    
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}