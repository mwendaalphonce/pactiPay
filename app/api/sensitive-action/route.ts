// app/api/sensitive-action/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  // Check authentication
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check role
  if (!session.user.roles?.includes('SUPER_ADMIN')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Your protected logic here
  return Response.json({ success: true })
}