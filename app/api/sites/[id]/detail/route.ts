import { NextRequest, NextResponse } from "next/server"
import { getSiteDetail } from "@/lib/actions"
import { isPluginEnabled } from "@/lib/plugins/runtime"
import { getAdminSession } from "@/lib/api-auth"

// 获取已发布站点的详情内容（前台弹窗按需加载）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 插件禁用时数据接口同步关闭：「禁用即收权」在服务端收口，而非仅隐藏前台 UI
    if (!(await isPluginEnabled("site-detail"))) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const result = await getSiteDetail(id)

    if (!result.success || !result.data) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // 未发布站点：仅管理员可见（后台编辑回填共用），公开访问与公开列表口径一致返回 404
    if (!result.data.isPublished && !(await getAdminSession())) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    return NextResponse.json(result.data, {
      headers: {
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error fetching site detail:", error)
    return NextResponse.json({ error: "Failed to fetch site detail" }, { status: 500 })
  }
}
