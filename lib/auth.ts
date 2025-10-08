// lib/auth.ts
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user || !user.password) {
            throw new Error("Invalid credentials")
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error("Invalid credentials")
          }

          // Return user object that matches the User type
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            hasCompletedOnboarding: user.hasCompletedOnboarding,
            companyId: user.companyId,
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw new Error("Authentication failed")
        }
      }
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Log sign-in attempt
        await prisma.auditLog.create({
          data: {
            action: 'USER_SIGN_IN',
            entityType: 'User',
            entityId: user.id,
            userEmail: user.email || '',
            newValues: {
              provider: account?.provider,
              timestamp: new Date().toISOString(),
            },
          },
        })
      } catch (err) {
        console.error('Audit log error:', err)
      }
      
      return true
    },
    
    async jwt({ token, user, trigger, session, account }) {
      // Initial sign in - user object is available
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        
        // For credentials provider, we get these from authorize()
        if (account?.provider === 'credentials') {
          token.hasCompletedOnboarding = user.hasCompletedOnboarding ?? false
          token.companyId = user.companyId ?? null
        } else {
          // For OAuth providers, fetch from database
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              hasCompletedOnboarding: true,
              companyId: true,
            }
          })
          token.hasCompletedOnboarding = dbUser?.hasCompletedOnboarding ?? false
          token.companyId = dbUser?.companyId ?? null
        }
      }
      
      // Handle session updates
      if (trigger === "update" && session) {
        token.hasCompletedOnboarding = session.hasCompletedOnboarding
        token.companyId = session.companyId
      }
      
      // Fetch fresh data on each request (for roles/permissions)
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              hasCompletedOnboarding: true,
              companyId: true,
            }
          })
          
          if (dbUser) {
            token.hasCompletedOnboarding = dbUser.hasCompletedOnboarding
            token.companyId = dbUser.companyId

            // Fetch company details if onboarded
            if (dbUser.companyId) {
              const company = await prisma.company.findUnique({
                where: { id: dbUser.companyId },
                select: {
                  id: true,
                  companyName: true,
                  email: true,
                  logo: true,
                  isActive: true,
                  plan: true,
                  suspendedAt: true,
                  suspensionReason: true,
                }
              })
              token.company = company

              // Fetch user roles
              const userRoles = await prisma.userRole.findMany({
                where: { userId: dbUser.id },
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

              token.roles = userRoles.map(ur => ur.role.name)
              token.permissions = userRoles.flatMap(ur => 
                ur.role.permissions.map(rp => ({
                  resource: rp.permission.resource,
                  action: rp.permission.action,
                  scope: rp.permission.scope,
                }))
              )
            }
          }
        } catch (error) {
          console.error('JWT callback error:', error)
        }
      }
      
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
        session.user.hasCompletedOnboarding = token.hasCompletedOnboarding as boolean
        session.user.companyId = token.companyId as string | null
        session.user.company = token.company as any
        session.user.roles = token.roles as string[] || []
        session.user.permissions = token.permissions as any[] || []
      }
      
      return session
    },
  },
  
  pages: {
    signIn: '/signin',
    error: '/error',
    newUser: '/onboarding',
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  events: {
    async signOut({ token }) {
      if (token?.email) {
        try {
          await prisma.auditLog.create({
            data: {
              action: 'USER_SIGN_OUT',
              entityType: 'User',
              entityId: token.id as string || 'unknown',
              userEmail: token.email as string,
              newValues: {
                timestamp: new Date().toISOString(),
              },
            },
          })
        } catch (err) {
          console.error('Audit log error:', err)
        }
      }
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

// Type augmentation for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      hasCompletedOnboarding: boolean
      companyId?: string | null
      company?: {
        id: string
        companyName: string
        email: string
        logo?: string | null
        isActive: boolean
        plan: string
        suspendedAt?: Date | null
        suspensionReason?: string | null
      } | null
      roles?: string[]
      permissions?: Array<{
        resource: string
        action: string
        scope?: string | null
      }>
    }
  }
  
  interface User {
    hasCompletedOnboarding?: boolean
    companyId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    hasCompletedOnboarding?: boolean
    companyId?: string | null
    company?: any
    roles?: string[]
    permissions?: any[]
  }
}