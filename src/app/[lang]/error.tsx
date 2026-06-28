"use client";

import { Container } from "@/components/ui/container";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="py-24">
      <Container className="max-w-md text-center">
        <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-2">
          Something went wrong
        </h1>
        <p className="text-text-muted mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset}>Try again</Button>
      </Container>
    </section>
  );
}
