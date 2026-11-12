"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { callbackMessage, type Tone } from "./motive-text";

const TONE_CLASS: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-800",
};

/** The result of the Motive login, read once from the URL; the URL is then cleaned so a refresh doesn't repeat it. */
export function CallbackBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState(() =>
    callbackMessage(searchParams.get("motive"), searchParams.get("reason"))
  );

  useEffect(() => {
    if (searchParams.has("motive")) router.replace(pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  if (!message) return null;
  const Icon = message.tone === "success" ? CheckCircle2 : AlertTriangle;

  return (
    <div
      role={message.tone === "success" ? "status" : "alert"}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${TONE_CLASS[message.tone]}`}
    >
      <p className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
        {message.text}
      </p>
      <button
        onClick={() => setMessage(null)}
        className="shrink-0 rounded-md p-1 transition-colors hover:bg-black/5"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
