"use client";

import { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  value: string;
  className?: string;
}

export function StatCounter({ value, className }: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState("0");
  const started = useRef(false);

  // Extract numeric part and suffix (e.g. "48 000+" → 48000, "+")
  const numeric = parseInt(value.replace(/\s/g, "").replace(/[^0-9]/g, ""), 10);
  const isNumeric = !isNaN(numeric) && numeric > 0;

  useEffect(() => {
    if (!isNumeric) {
      setDisplayed(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const steps = 40;
          const increment = numeric / steps;
          let current = 0;
          const interval = setInterval(() => {
            current += increment;
            if (current >= numeric) {
              clearInterval(interval);
              setDisplayed(value);
            } else {
              const formatted = Math.floor(current)
                .toLocaleString("ru-RU")
                .replace(/,/g, " ");
              setDisplayed(formatted + (value.includes("+") ? "+" : ""));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [numeric, isNumeric, value]);

  return (
    <span ref={ref} className={className}>
      {displayed}
    </span>
  );
}
