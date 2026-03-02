"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Logo from "@/components/logo";

type AppTopbarProps = {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  className?: string;
};

export default function AppTopbar({
  title,
  subtitle,
  showBack = false,
  backLabel = "Back",
  onBack,
  rightSlot,
  className = "",
}: AppTopbarProps) {
  const router = useRouter();

  return (
    <header className={`sticky top-0 z-30 border-b border-white/10 bg-black/85 backdrop-blur-xl ${className}`}>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {showBack && (
            <button
              onClick={() => (onBack ? onBack() : router.back())}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/20 px-2.5 text-xs text-white/80 hover:bg-white/10 sm:px-3"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>{backLabel}</span>
            </button>
          )}
          <button onClick={() => router.push("/")} className="shrink-0" aria-label="Go to dashboard">
            <Logo width={112} height={32} className="h-auto w-[78px] sm:w-[96px] md:w-[112px]" />
          </button>
          {(title || subtitle) && (
            <div className="min-w-0">
              {title && <p className="truncate text-sm font-semibold leading-tight sm:text-base">{title}</p>}
              {subtitle && <p className="truncate text-xs leading-tight text-white/55">{subtitle}</p>}
            </div>
          )}
        </div>

        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : <div />}
      </div>
    </header>
  );
}
