import { randomBytes } from "crypto";

const RESERVED = new Set([
  "api",
  "new",
  "favicon.ico",
  "_next",
  "robots.txt",
  "sitemap.xml",
]);

/** a-z and 0-9 for short, URL-safe paths */
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * One random slug candidate (default length ≈ 52 bits entropy).
 * Caller should check DB uniqueness and retry on collision.
 */
export function randomSlug(length = 10): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]!;
  }
  if (RESERVED.has(out)) {
    return randomSlug(length);
  }
  return out;
}
