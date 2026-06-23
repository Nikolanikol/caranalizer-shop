import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-lg border border-border bg-elevated px-4 pe-10 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors appearance-none cursor-pointer",
      "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%2394a3b8%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22m4.427%206.427%203.396%203.396a.25.25%200%200%200%20.354%200l3.396-3.396A.25.25%200%200%200%2011.396%206H4.604a.25.25%200%200%200-.177.427z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[position:calc(100%-12px)_center] bg-no-repeat",
      "[html[dir='rtl']_&]:bg-[position:12px_center]",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
