"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type SignInOverlayProps = {
  status: string;
  detail?: string;
};

export function SignInOverlay({ status, detail }: SignInOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000b1d]/78 backdrop-blur-md">
      <div className="relative flex w-[min(92vw,380px)] flex-col items-center gap-6 rounded-3xl border border-[var(--brand-cyan)]/20 bg-[rgba(7,17,31,0.92)] px-8 py-10 shadow-[0_0_80px_rgba(0,191,255,0.12)]">
        <div className="relative h-24 w-24">
          <span className="signin-ring absolute inset-0 rounded-full border border-[var(--brand-cyan)]/25" />
          <span className="signin-ring-delayed absolute inset-2 rounded-full border border-[var(--brand-cyan)]/40" />
          <span className="signin-core absolute inset-5 flex items-center justify-center rounded-[22%] bg-[var(--brand-navy)] shadow-[0_0_30px_rgba(0,191,255,0.35)]">
            <Image
              src="/automari-icon-512.png"
              alt=""
              width={56}
              height={56}
              className="rounded-[20%]"
              priority
            />
          </span>
          <span className="signin-scan absolute inset-x-3 top-1/2 h-px bg-gradient-to-r from-transparent via-[var(--brand-cyan)] to-transparent" />
        </div>

        <div className="space-y-2 text-center">
          <p className="text-base font-semibold tracking-[-0.02em] text-white">
            {status}
          </p>
          {detail ? (
            <p className="text-sm leading-relaxed text-[#8aa3bd]">{detail}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn("signin-dot h-1.5 w-1.5 rounded-full bg-[var(--brand-cyan)]")}
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
