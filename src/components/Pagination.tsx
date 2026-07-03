"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  total: number;
  pageSize: number;
  currentPage: number;
  onPageChange?: (page: number) => void;
  /** When set, page numbers render as real <a href> (crawlable); clicks are
   * still intercepted and handled by onPageChange. */
  getHref?: (page: number) => string;
}

export function Pagination({ total, pageSize, currentPage, onPageChange, getHref }: PaginationProps) {
  const t = useTranslations("catalog");
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

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
    <nav aria-label={t("paginationLabel")} className="flex items-center justify-center gap-1">
      {getHref && currentPage > 1 ? (
        <a
          href={getHref(currentPage - 1)}
          onClick={(e) => {
            if (!onPageChange) return;
            e.preventDefault();
            onPageChange(currentPage - 1);
          }}
          className="p-2 rounded-lg transition-colors cursor-pointer text-text-secondary hover:bg-elevated hover:text-text"
          aria-label={t("prevPage")}
        >
          <ChevronLeft className="h-4 w-4" />
        </a>
      ) : (
        <button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            currentPage <= 1
              ? "pointer-events-none text-text-dim"
              : "text-text-secondary hover:bg-elevated hover:text-text"
          }`}
          aria-label={t("prevPage")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {pages.map((p, i) => {
        if (p === "...") {
          return (
            <span key={`dot-${i}`} className="px-2 text-text-dim">
              …
            </span>
          );
        }
        const className = `min-w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${
          p === currentPage
            ? "bg-primary text-white"
            : "text-text-secondary hover:bg-elevated hover:text-text"
        }`;
        return getHref ? (
          <a
            key={p}
            href={getHref(p)}
            onClick={(e) => {
              if (!onPageChange) return;
              e.preventDefault();
              onPageChange(p);
            }}
            aria-label={t("pageLabel", { page: p })}
            aria-current={p === currentPage ? "page" : undefined}
            className={className}
          >
            {p}
          </a>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange?.(p)}
            aria-label={t("pageLabel", { page: p })}
            aria-current={p === currentPage ? "page" : undefined}
            className={className}
          >
            {p}
          </button>
        );
      })}

      {getHref && currentPage < totalPages ? (
        <a
          href={getHref(currentPage + 1)}
          onClick={(e) => {
            if (!onPageChange) return;
            e.preventDefault();
            onPageChange(currentPage + 1);
          }}
          className="p-2 rounded-lg transition-colors cursor-pointer text-text-secondary hover:bg-elevated hover:text-text"
          aria-label={t("nextPage")}
        >
          <ChevronRight className="h-4 w-4" />
        </a>
      ) : (
        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            currentPage >= totalPages
              ? "pointer-events-none text-text-dim"
              : "text-text-secondary hover:bg-elevated hover:text-text"
          }`}
          aria-label={t("nextPage")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </nav>
  );
}
