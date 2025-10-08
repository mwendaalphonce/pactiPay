'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, UserPlus, X, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Role {
  id: string
  name: string
  displayName: string
  description: string
  level: number
  userCount: number
  permissions: Array<{
    resource: string
    action: string
    scope: string | null
  }>
}

interface UserRole {
  id: string
  name: string
  displayName: string
  description: string
  level: number
  assignedAt: string
}

interface UserRoleManagerProps {
  userId: string
  userName: string
  currentRoles: UserRole[]
  onRolesUpdated?: () => void
}

export default function UserRoleManager({ 
  userId, 
  userName, 
  currentRoles: initialRoles,
  onRolesUpdated 
}: UserRoleManagerProps) {
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>(initialRoles)
  const [isLoading, setIsLoading] = useState(true)
  const [assigningRole, setAssigningRole] = useState<string | null>(null)
  const [removingRole, setRemovingRole] = useState<string | null>(null)

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setAllRoles(data.roles)
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Failed to load roles')
    } finally {
      setIsLoading(false)
    }
  }

  const assignRole = async (roleId: string) => {
    try {
      setAssigningRole(roleId)
      
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign role')
      }

      // Refresh user roles
      const rolesResponse = await fetch(`/api/users/${userId}/roles`)
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        setUserRoles(rolesData.roles)
      }

      toast.success(data.message || 'Role assigned successfully')
      onRolesUpdated?.()
    } catch (error) {
      console.error('Error assigning role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to assign role')
    } finally {
      setAssigningRole(null)
    }
  }

  const removeRole = async (roleId: string) => {
    try {
      setRemovingRole(roleId)
      
      const response = await fetch(`/api/users/${userId}/roles?roleId=${roleId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove role')
      }

      // Update local state
      setUserRoles(prev => prev.filter(r => r.id !== roleId))

      toast.success(data.message || 'Role removed successfully')
      onRolesUpdated?.()
    } catch (error) {
      console.error('Error removing role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove role')
    } finally {
      setRemovingRole(null)
    }
  }

  const hasRole = (roleId: string) => {
    return userRoles.some(r => r.id === roleId)
  }

  const getRoleBadgeColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-purple-100 text-purple-800 border-purple-300'
      case 2: return 'bg-blue-100 text-blue-800 border-blue-300'
      case 3: return 'bg-green-100 text-green-800 border-green-300'
      case 4: return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Current Roles for {userName}
          </CardTitle>
          <CardDescription>
            Roles assigned to this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRoles.length === 0 ? (
            <Alert>
              <AlertDescription>
                No roles assigned. Assign a role below to grant permissions.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {userRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getRoleBadgeColor(role.level)}>
                      Level {role.level}
                    </Badge>
                    <div>
                      <h4 className="font-medium">{role.displayName}</h4>
                      <p className="text-sm text-gray-600">{role.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Assigned: {new Date(role.assignedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRole(role.id)}
                    disabled={removingRole === role.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {removingRole === role.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Available Roles
          </CardTitle>
          <CardDescription>
            Assign additional roles to grant more permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {allRoles.map((role) => {
              const isAssigned = hasRole(role.id)
              const isAssigning = assigningRole === role.id

              return (
                <div
                  key={role.id}
                  className={`p-4 border rounded-lg transition-all ${
                    isAssigned 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(role.level)}>
                        Level {role.level}
                      </Badge>
                      {isAssigned && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-1">{role.displayName}</h4>
                  <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                  
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      Permissions ({role.permissions.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((perm, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {perm.resource}:{perm.action}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{role.userCount} users have this role</span>
                  </div>

                  {!isAssigned && (
                    <Button
                      className="w-full mt-3"
                      size="sm"
                      onClick={() => assignRole(role.id)}
                      disabled={isAssigning}
                    >
                      {isAssigning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Assign Role
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}