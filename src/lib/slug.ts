import { pinyin } from "pinyin-pro";

const RESERVED = new Set(["api", "new", "favicon.ico", "_next", "robots.txt", "sitemap.xml"]);

export function toPinyinInitials(inputName: string) {
  const name = inputName.trim();
  if (!name) return "";

  const hasCjk = /[\u4E00-\u9FFF]/.test(name);
  let raw = "";

  if (hasCjk) {
    raw = pinyin(name, { toneType: "none", type: "array" })
      .map((syllable) => (syllable?.[0] ? syllable[0] : ""))
      .join("");
  } else {
    raw = name;
  }

  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);

  if (slug.length < 2) return "";
  if (RESERVED.has(slug)) return "";
  return slug;
}

export function nextSlugCandidate(base: string, attempt: number) {
  if (attempt <= 1) return base;
  const suffix = String(attempt);
  const trimmed = base.slice(0, Math.max(2, 12 - suffix.length));
  return `${trimmed}${suffix}`;
}

