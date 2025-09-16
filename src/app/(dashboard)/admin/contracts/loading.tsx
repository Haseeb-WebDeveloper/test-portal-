import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-6 lg:px-12">
      <div className="flex items-center justify-between mb-16">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div key={idx} className="relative flex flex-col justify-between rounded-tl-xl border border-primary/20 min-h-[260px] overflow-hidden">
            <div className="absolute -top-[26px] right-0 z-10">
              <Skeleton className="h-6 w-32 rounded-t-lg" />
            </div>
            <div className="p-5 pb-4 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-6 w-12 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
            </div>
            <div className="px-5 pb-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-full bg-muted rounded-full h-1.5 relative">
                  <div className="h-2 rounded-full" style={{ width: "60%" }}>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
              <div className="flex items-center justify-between text-base border-t border-border pt-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


