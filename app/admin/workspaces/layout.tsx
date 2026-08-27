import { AdminLayout } from "@/components/admin/admin-layout"

export default function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
