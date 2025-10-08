// app/settings/users/[userId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import UserRoleManager from '@/components/UserRoleManager'
import { useParams } from 'next/navigation'

export default function UserRolePage() {
  const params = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/users/${params.userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
      .finally(() => setLoading(false))
  }, [params.userId])

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage User Roles</h1>
      <UserRoleManager
        userId={user?.id || params.userId}
        userName={user?.name || 'User'}
        currentRoles={user?.roles || []}
        onRolesUpdated={() => {
          // Refresh user data
        }}
      />
    </div>
  )
}