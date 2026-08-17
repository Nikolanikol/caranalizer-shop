'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Кнопка «скопировать артикул». Клиентская только из-за clipboard. */
export function CopyOem({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  return (
    <button
      type="button"
      title="Скопировать артикул"
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
