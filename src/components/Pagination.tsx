"use client";

import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  total: number;
  pageSize: number;
  currentPage: number;
}

export function Pagination({ total, pageSize, currentPage }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <Link
        href={buildHref(currentPage - 1)}
        className={`p-2 rounded-lg transition-colors ${
          currentPage <= 1
            ? "pointer-events-none text-text-dim"
            : "text-text-secondary hover:bg-elevated hover:text-text"
        }`}
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dot-${i}`} className="px-2 text-text-dim">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={`min-w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              p === currentPage
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-elevated hover:text-text"
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={buildHref(currentPage + 1)}
        className={`p-2 rounded-lg transition-colors ${
          currentPage >= totalPages
            ? "pointer-events-none text-text-dim"
            : "text-text-secondary hover:bg-elevated hover:text-text"
        }`}
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
