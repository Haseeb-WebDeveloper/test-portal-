import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    return NextResponse.json({ ok: true, exists: Boolean(user) })
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 })
  }
}


