import { NextResponse } from 'next/server'
import { exportBookmarks } from '@/lib/actions'
import { generateChromeBookmarks } from '@/lib/bookmarks'
import { getAdminSession } from '@/lib/api-auth'

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await exportBookmarks()

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // 生成Chrome书签HTML
    const html = generateChromeBookmarks(result.data)

    // 返回HTML文件下载
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Content-Disposition': `attachment; filename="bookmarks_${new Date().toISOString().split('T')[0]}.html"`,
      },
    })
  } catch (error) {
    console.error('Error exporting bookmarks:', error)
    return NextResponse.json(
      { error: 'Failed to export bookmarks' },
      { status: 500 }
    )
  }
}
