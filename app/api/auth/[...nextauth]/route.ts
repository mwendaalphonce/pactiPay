// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// This is the ONLY file that should call NextAuth()
// It imports configuration from lib/auth.ts
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }