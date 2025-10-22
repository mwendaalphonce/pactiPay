// app/api/users/[userId]/roles/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const assignRoleSchema = z.object({
  roleId: z.string(),
})

// Assign role to user
export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can assign roles
    if (!session.user.roles?.includes('SUPER_ADMIN')) {
      return Response.json({ error: 'Forbidden: Only Super Admin can assign roles' }, { status: 403 })
    }

    const body = await req.json()
    const { roleId } = assignRoleSchema.parse(body)

    // Check if user exists and belongs to same company
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, companyId: true, name: true, email: true }
    })

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure users are in same company
    if (targetUser.companyId !== session.user.companyId) {
      return Response.json({ error: 'Cannot assign roles to users in different companies' }, { status: 403 })
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      return Response.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: params.userId,
          roleId: roleId
        }
      }
    })

    if (existingUserRole) {
      return Response.json({ error: 'User already has this role' }, { status: 400 })
    }

    // Assign role
    const userRole = await prisma.userRole.create({
      data: {
        userId: params.userId,
        roleId: roleId,
        assignedBy: session.user.id,
      },
      include: {
        role: true
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'ASSIGN_ROLE',
        entityType: 'UserRole',
        entityId: userRole.userId + '-' + userRole.roleId,
        userId: session.user.id,
        userEmail: session.user.email || '',
        newValues: {
          userId: params.userId,
          userEmail: targetUser.email,
          roleName: role.name,
          roleDisplayName: role.displayName,
          assignedBy: session.user.email,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return Response.json({
      success: true,
      message: `Role "${role.displayName}" assigned to ${targetUser.name}`,
      userRole
    })

  } catch (error) {
    console.error('Assign role error:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({
        error: 'Validation error',
        details: error.issues,
      }, { status: 400 })
    }

    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}

// Remove role from user
export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can remove roles
    if (!session.user.roles?.includes('SUPER_ADMIN')) {
      return Response.json({ error: 'Forbidden: Only Super Admin can remove roles' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const roleId = searchParams.get('roleId')

    if (!roleId) {
      return Response.json({ error: 'roleId is required' }, { status: 400 })
    }

    // Check if user exists and belongs to same company
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, companyId: true, name: true, email: true }
    })

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure users are in same company
    if (targetUser.companyId !== session.user.companyId) {
      return Response.json({ error: 'Cannot remove roles from users in different companies' }, { status: 403 })
    }

    // Get role info for logging
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    })

    // Remove role
    const deleted = await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId: params.userId,
          roleId: roleId
        }
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'REMOVE_ROLE',
        entityType: 'UserRole',
        entityId: deleted.userId + '-' + deleted.roleId,
        userId: session.user.id,
        userEmail: session.user.email || '',
        oldValues: {
          userId: params.userId,
          userEmail: targetUser.email,
          roleName: role?.name,
          roleDisplayName: role?.displayName,
          removedBy: session.user.email,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return Response.json({
      success: true,
      message: `Role "${role?.displayName}" removed from ${targetUser.name}`,
    })

  } catch (error) {
    console.error('Remove role error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}

// Get user's roles
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Users can view their own roles, or SUPER_ADMIN can view anyone's
    if (session.user.id !== params.userId && !session.user.roles?.includes('SUPER_ADMIN')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userRoles = await prisma.userRole.findMany({
      where: { userId: params.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    return Response.json({
      roles: userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName,
        description: ur.role.description,
        level: ur.role.level,
        assignedAt: ur.assignedAt,
        permissions: ur.role.permissions.map(rp => ({
          resource: rp.permission.resource,
          action: rp.permission.action,
          scope: rp.permission.scope,
        }))
      }))
    })

  } catch (error) {
    console.error('Get roles error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}