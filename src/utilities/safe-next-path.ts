/** Only same-site absolute paths survive: no scheme, no `//host`, no backslash tricks. */
export function safeNextPath(value: string | null | undefined, fallback = '/admin/orders'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}
