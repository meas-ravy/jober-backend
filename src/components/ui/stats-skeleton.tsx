import { Skeleton } from "@/src/components/ui/skeleton";
import { Card, CardHeader } from "@/src/components/ui/card";

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="@container/card">
          <CardHeader>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
