import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

// Export handler as named functions for App Router
export const GET = handler
export const POST = handler

