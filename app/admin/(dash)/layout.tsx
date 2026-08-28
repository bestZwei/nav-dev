import { AdminLayout } from "@/components/admin/admin-layout"

// 后台框架（侧边栏/顶栏/工作区切换器）唯一挂载点：
// 路由组不影响 URL；子模块间导航时 AdminLayout 跨路由复用，
// 避免整棵框架卸载重挂与切换器/侧边栏的重复请求往返
export default function DashLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
