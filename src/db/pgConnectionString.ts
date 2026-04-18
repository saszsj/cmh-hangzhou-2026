/**
 * pg v8 / pg-connection-string v2 treat `prefer`, `require`, and `verify-ca`
 * as aliases for `verify-full`. Explicit `verify-full` silences the upgrade
 * warning without changing current connection behavior.
 *
 * @see https://www.postgresql.org/docs/current/libpq-ssl.html
 */
export function withPgSslModeExplicit(connectionString: string): string {
  if (!connectionString) return connectionString;
  try {
    const u = new URL(connectionString);
    const mode = u.searchParams.get("sslmode")?.toLowerCase();
    if (
      mode === "prefer" ||
      mode === "require" ||
      mode === "verify-ca"
    ) {
      u.searchParams.set("sslmode", "verify-full");
    }
    return u.href;
  } catch {
    return connectionString;
  }
}
