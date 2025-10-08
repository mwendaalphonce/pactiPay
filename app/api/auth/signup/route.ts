// app/api/auth/signup/route.ts
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate input
    const validatedData = signupSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return Response.json({ 
        error: 'An account with this email already exists' 
      }, { status: 400 })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        hasCompletedOnboarding: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })
    
    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'USER_SIGNUP',
        entityType: 'User',
        entityId: user.id,
        userEmail: user.email,
        newValues: {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString(),
        },
      },
    }).catch(err => console.error('Audit log error:', err))
    
    return Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      message: 'Account created successfully',
    })
    
  } catch (error) {
    console.error('Signup error:', error)
    
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