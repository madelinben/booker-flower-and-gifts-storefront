/** The one credential resolver: a missing secret fails with its name, never its value. */
export function requireSetting(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}
