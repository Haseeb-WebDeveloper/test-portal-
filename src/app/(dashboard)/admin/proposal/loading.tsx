import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-6 lg:px-12">
      <div className="flex items-center justify-between mb-16">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <div className="flex flex-col gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="relative flex flex-col lg:flex-row lg:w-[70%] rounded-lg border p-5 gap-4">
            <div className="lg:w-[40%] space-y-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="flex-1 min-h-full lg:border-l lg:pl-5 space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-xl" />
                <Skeleton className="h-6 w-12 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-xl" />
              </div>
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


