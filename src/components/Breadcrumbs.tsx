import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-text-muted overflow-x-auto">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1 whitespace-nowrap">
          {i > 0 && (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-dim rtl:rotate-180" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-text transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-text-secondary">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
