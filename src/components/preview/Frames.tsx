import { Lock, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'

export function BrowserFrame({ domain, children, className }: { domain: string; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[14px] bg-[#1d1d1f] shadow-[0_40px_90px_-30px_rgba(0,0,0,.65),0_0_0_1px_rgba(255,255,255,.08)] ${className ?? ''}`}>
      <div className="flex h-[34px] items-center gap-3 px-3.5">
        <div className="flex gap-1.5">
          <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex h-[22px] w-[46%] min-w-0 items-center justify-center gap-1.5 rounded-md bg-white/[0.08] px-3 text-[11.5px] text-white/70">
          <Lock size={10} strokeWidth={2.5} className="shrink-0 text-white/50" />
          <span className="truncate">{domain}</span>
        </div>
        <RotateCw size={12} className="text-white/40" />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-[34px] bg-[#111] p-[7px] shadow-[0_40px_80px_-24px_rgba(0,0,0,.7),0_0_0_1px_rgba(255,255,255,.12)] ${className ?? ''}`}>
      <div className="relative overflow-hidden rounded-[27px] bg-black">
        {/* Строка состояния: вырез камеры живёт в ней, а не поверх шапки сайта с названием бизнеса */}
        <div className="relative h-[26px] bg-black">
          <div className="absolute left-1/2 top-[6px] h-[16px] w-[54px] -translate-x-1/2 rounded-full bg-[#0c0c0c] ring-1 ring-white/5" />
        </div>
        {children}
      </div>
    </div>
  )
}
