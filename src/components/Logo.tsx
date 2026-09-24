/** Знак МирВеб: шестигранник с «М», как на аватарке в Telegram, но в одну краску — как у референса */
export function LogoMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25Z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M10.4 21.5V10.8h2.5l3.1 5.2 3.1-5.2h2.5v10.7h-2.6v-6.2l-2.9 4.8h-.3l-2.9-4.8v6.2Z" fill="currentColor" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark />
      <span className="text-[18px] font-semibold tracking-[-0.01em]">МирВеб</span>
    </span>
  )
}
