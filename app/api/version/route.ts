import { NextResponse } from "next/server"
import { getAppVersion, getGitSha, isDevVersion } from "@/lib/version"

export const dynamic = "force-dynamic"

export async function GET() {
  const version = getAppVersion()

  return NextResponse.json({
    version,
    isDev: isDevVersion(version),
    gitSha: getGitSha(),
    timestamp: new Date().toISOString(),
  })
}
