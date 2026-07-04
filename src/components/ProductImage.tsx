"use client";

import { useState } from "react";

const PLACEHOLDER = "/flopimg.jpg";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

/**
 * Картинка товара с фолбэком: если URL отсутствует или файл
 * не загрузился (битая ссылка, недоступный сторадж) — показывает заглушку.
 */
export function ProductImage({ src, alt, className, loading }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const url = !src || failed ? PLACEHOLDER : src;

  return (
    <img
      src={url}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
