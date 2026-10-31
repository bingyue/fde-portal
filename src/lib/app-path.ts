/** Native fetch/download URLs need the same build-time prefix as Next links. */
export function appPath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (base && (path === base || path.startsWith(base + "/"))) return path;
  return base + path;
}
