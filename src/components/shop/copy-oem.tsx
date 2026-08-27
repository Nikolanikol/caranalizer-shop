'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Check, Copy } from 'lucide-react';

/** Кнопка «скопировать артикул». Клиентская только из-за clipboard. */
export function CopyOem({ value }: { value: string }) {
  // Локаль хуком: компонент клиентский и стоит в пяти местах — пропс тянуть дороже.
  const en = useLocale() === 'en';
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  return (
    <button
      type="button"
      title={en ? 'Copy the part number' : 'Скопировать артикул'}
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-text-muted hover:text-text transition-colors cursor-pointer"
    >
      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}
