// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      hasCompletedOnboarding: boolean
      companyId?: string | null
      company?: {
        id: string
        companyName: string
        email: string
        logo?: string | null
        isActive: boolean
        plan: string
      } | null
      roles?: string[]
      permissions?: Array<{
        resource: string
        action: string
        scope?: string | null
      }>
    } & DefaultSession["user"]
  }
  
  interface User extends DefaultUser {
    hasCompletedOnboarding?: boolean
    companyId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    hasCompletedOnboarding: boolean
    companyId?: string | null
  }
}