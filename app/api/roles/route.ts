// app/api/roles/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get all roles
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = await prisma.role.findMany({
      orderBy: { level: 'asc' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    })

    return Response.json({
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        level: role.level,
        userCount: role._count.users,
        permissions: role.permissions.map(rp => ({
          resource: rp.permission.resource,
          action: rp.permission.action,
          scope: rp.permission.scope,
          description: rp.permission.description,
        }))
      }))
    })

  } catch (error) {
    console.error('List roles error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}