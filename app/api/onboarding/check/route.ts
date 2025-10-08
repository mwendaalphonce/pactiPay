// app/api/onboarding/check/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        hasCompletedOnboarding: true,
        onboardingCompletedAt: true,
        companyId: true,
        company: {
          select: {
            id: true,
            companyName: true,
            email: true,
            isActive: true,
          }
        }
      }
    })
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    
    return Response.json({
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      onboardingCompletedAt: user.onboardingCompletedAt,
      company: user.company,
    })
    
  } catch (error) {
    console.error('Check onboarding error:', error)
    return Response.json({
      error: 'Internal server error',
    }, { status: 500 })
  }
}