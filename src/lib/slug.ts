// Слаг = только идентификатор (артикул или id-N), без названия: переводы
// названий будут переделываться, а URL должны оставаться стабильными.
// parsePartSlug продолжает понимать старые "PN--name" адреса — страница
// отдаёт с них 301 на канонический.
export function generatePartSlug(partNumber: string | null, id?: number): string {
  return partNumber || (id ? `id-${id}` : "unknown");
}

export function parsePartSlug(slug: string): {
  partNumber: string | null;
  productId: number | null;
  nameSlug: string;
} {
  const parts = slug.split("--");
  const identifier = parts[0];
  const nameSlug = parts.length > 1 ? parts.slice(1).join("--") : "";

  if (identifier.startsWith("id-")) {
    const id = parseInt(identifier.substring(3), 10);
    return { partNumber: null, productId: isNaN(id) ? null : id, nameSlug };
  }

  return { partNumber: identifier, productId: null, nameSlug };
}
