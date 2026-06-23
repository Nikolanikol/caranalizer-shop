const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
  ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function transliterate(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] || char)
    .join("");
}

export function slugify(text: string): string {
  let result = transliterate(text);
  result = result.replace(/[^\w\s-]/g, "");
  result = result.replace(/\s+/g, "-");
  result = result.replace(/-+/g, "-");
  result = result.replace(/^-+|-+$/g, "");
  return result;
}

export function generatePartSlug(
  partNumber: string | null,
  name: string | null | undefined,
  id?: number
): string {
  const slug = slugify(name ?? "");
  const identifier = partNumber || (id ? `id-${id}` : "unknown");
  return `${identifier}--${slug}`;
}

export function parsePartSlug(slug: string): {
  partNumber: string | null;
  productId: number | null;
  nameSlug: string;
} {
  const parts = slug.split("--");
  if (parts.length < 2) {
    return { partNumber: null, productId: null, nameSlug: "" };
  }

  const identifier = parts[0];
  const nameSlug = parts.slice(1).join("--");

  if (identifier.startsWith("id-")) {
    const id = parseInt(identifier.substring(3), 10);
    return { partNumber: null, productId: isNaN(id) ? null : id, nameSlug };
  }

  return { partNumber: identifier, productId: null, nameSlug };
}
