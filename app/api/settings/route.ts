import { NextResponse } from "next/server"
import { getSystemSettings } from "@/lib/actions"
import { defaultSettings } from "@/lib/client-settings"

export async function GET() {
  try {
    const result = await getSystemSettings()
    if (result.success && result.data) {
      const { id, ...publicSettings } = result.data
      return NextResponse.json({ ...defaultSettings, ...publicSettings })
    }
    return NextResponse.json(defaultSettings)
  } catch (error) {
    console.warn("Using default settings fallback:", error)
    return NextResponse.json(defaultSettings)
  }
}
