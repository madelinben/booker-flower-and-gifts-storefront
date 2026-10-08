export function Ladybird({ className = 'size-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <path d="M26 8c-3-4-6-4-8-3M38 8c3-4 6-4 8-3" stroke="#161a17" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="14" r="9" fill="#161a17" />
      <path d="M32 18c-14 0-22 9-22 20s9 20 22 20 22-9 22-20-8-20-22-20z" fill="var(--accent)" />
      <path d="M32 18v40" stroke="#161a17" strokeWidth="2.5" />
      <g fill="#161a17"><circle cx="21" cy="33" r="4.5" /><circle cx="43" cy="33" r="4.5" /><circle cx="22" cy="47" r="3.5" /><circle cx="42" cy="47" r="3.5" /></g>
    </svg>
  );
}
