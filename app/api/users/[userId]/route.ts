// app/api/users/[userId]/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get specific user details
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Users can view their own profile, or SUPER_ADMIN can view anyone's
    if (session.user.id !== params.userId && !session.user.roles?.includes('SUPER_ADMIN')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        hasCompletedOnboarding: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                description: true,
                level: true
              }
            }
          },
          orderBy: {
            role: {
              level: 'asc'
            }
          }
        },
        company: {
          select: {
            id: true,
            companyName: true,
            email: true
          }
        }
      }
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure user is in same company (for SUPER_ADMIN checking other users)
    if (session.user.companyId !== user.companyId && !session.user.roles?.includes('SUPER_ADMIN')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        company: user.company,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.roles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          displayName: ur.role.displayName,
          description: ur.role.description,
          level: ur.role.level,
          assignedAt: ur.assignedAt
        }))
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}