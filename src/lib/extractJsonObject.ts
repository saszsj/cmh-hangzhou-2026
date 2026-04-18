/**
 * Pull a single JSON object from model output: optional ``` fence, then balanced `{`…`}`.
 * Does not handle `{` inside JSON strings (rare for this schema).
 */
export function extractJsonObject(text: string): string | null {
  let t = text.trim();
  const fenceStart = t.search(/```(?:json)?\s*/i);
  if (fenceStart >= 0) {
    const afterOpen = t.slice(fenceStart).replace(/^```(?:json)?\s*/i, "");
    const close = afterOpen.indexOf("```");
    if (close > 0) {
      t = afterOpen.slice(0, close).trim();
    }
  }

  try {
    JSON.parse(t);
    return t;
  } catch {
    /* fall through */
  }

  const start = t.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i]!;
    if (inString) {
      if (escape) {
        escape = false;
      } else if (c === "\\") {
        escape = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        return t.slice(start, i + 1);
      }
    }
  }
  return null;
}
