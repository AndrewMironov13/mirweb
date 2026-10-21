/** Знак МирВеб «Острия»: «М», ножки которой уходят двумя остриями. В одну краску, исходник — ~/Claude/logo-m */
export function LogoMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="12 12 96 96" className={className} aria-hidden="true">
      <path d="M12,12 L60,60 L60,79.8 L12,31.8 Z M12,30.8 L25.3,44.1 L25.3,96 L18.65,108 L12,96 Z M28.7,47.5 L42,60.8 L42,78 L35.35,90 L28.7,78 Z M108,12 L60,60 L60,79.8 L108,31.8 Z M108,30.8 L94.7,44.1 L94.7,96 L101.35,108 L108,96 Z M91.3,47.5 L78,60.8 L78,78 L84.65,90 L91.3,78 Z" fill="currentColor" />
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
