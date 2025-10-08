// app/api/users/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get all users in the company
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can list all users
    if (!session.user.roles?.includes('SUPER_ADMIN')) {
      return Response.json({ error: 'Forbidden: Only Super Admin can list users' }, { status: 403 })
    }

    // Get all users in the same company
    const users = await prisma.user.findMany({
      where: {
        companyId: session.user.companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                level: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return Response.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        createdAt: user.createdAt,
        roles: user.roles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          displayName: ur.role.displayName,
          level: ur.role.level,
          assignedAt: ur.assignedAt
        }))
      }))
    })

  } catch (error) {
    console.error('List users error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}