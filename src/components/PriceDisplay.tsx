import { formatPrice, formatKrw, convertPrice } from "@/lib/pricing";

interface PriceDisplayProps {
  priceKrw: number;
  currency: string;
  rate: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({
  priceKrw,
  currency,
  rate,
  size = "md",
  className = "",
}: PriceDisplayProps) {
  const converted = convertPrice(priceKrw, rate);
  const isKrw = currency === "KRW";

  const sizeClasses = {
    sm: { main: "text-sm", sub: "text-xs" },
    md: { main: "text-lg", sub: "text-xs" },
    lg: { main: "text-2xl", sub: "text-sm" },
  };
  const s = sizeClasses[size];

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={`${s.main} font-bold text-text`}>
        {isKrw ? formatKrw(priceKrw) : formatPrice(converted, currency)}
      </span>
      {!isKrw && (
        <span className={`${s.sub} text-text-dim`}>{formatKrw(priceKrw)}</span>
      )}
    </div>
  );
}
