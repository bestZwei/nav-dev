import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Skeleton */}
      <div className="w-64 border-r bg-sidebar">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        <div className="space-y-1 p-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
        <div className="border-t p-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
