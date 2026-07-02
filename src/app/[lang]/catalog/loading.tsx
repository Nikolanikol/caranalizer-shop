import { Container } from "@/components/ui/container";

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-elevated overflow-hidden flex flex-col animate-pulse">
      <div className="aspect-square bg-surface/30" />
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="h-3 w-20 bg-surface/30 rounded" />
        <div className="h-4 w-full bg-surface/30 rounded" />
        <div className="h-4 w-2/3 bg-surface/30 rounded" />
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div className="h-6 w-24 bg-surface/30 rounded" />
          <div className="h-9 w-9 bg-surface/30 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function CatalogLoading() {
  return (
    <section className="py-8">
      <Container>
        <div className="animate-pulse mb-4">
          <div className="h-4 w-32 bg-elevated rounded" />
        </div>
        <div className="h-9 w-full bg-elevated rounded mb-8" />

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden space-y-3">
            <div className="h-10 bg-elevated rounded" />
            <div className="h-5 w-24 bg-elevated rounded" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="h-5 w-28 bg-elevated rounded animate-pulse" />
              <div className="h-10 w-40 bg-elevated rounded animate-pulse" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
