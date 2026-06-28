import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <section className="py-24">
      <Container className="max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-elevated rounded w-1/3" />
          <div className="h-4 bg-elevated rounded w-2/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-elevated rounded-xl" />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
