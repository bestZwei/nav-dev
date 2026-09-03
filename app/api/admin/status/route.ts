import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/api-auth"

export async function GET() {
  try {
    const session = await getAdminSession()
    return NextResponse.json(
      { isAdmin: Boolean(session) },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { isAdmin: false },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    )
  }
}
