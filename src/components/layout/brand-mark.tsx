import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
  size?: "sm" | "md" | "lg";
  /** Use full horizontal wordmark image (best on light backgrounds) */
  variant?: "mark" | "wordmark" | "icon";
};

export function BrandMark({
  className,
  logoClassName,
  textClassName,
  size = "md",
  variant = "mark",
}: BrandMarkProps) {
  if (variant === "wordmark") {
    const width = size === "lg" ? 280 : size === "sm" ? 160 : 220;
    const height = Math.round(width / 3);
    return (
      <div className={cn("flex items-center", className)}>
        <Image
          src="/automari-wordmark-web.png"
          alt="Automari.Ai"
          width={width}
          height={height}
          className={cn("h-auto w-auto object-contain", logoClassName)}
          priority
        />
      </div>
    );
  }

  if (variant === "icon") {
    const logoSize = size === "lg" ? 56 : size === "sm" ? 32 : 40;
    return (
      <Image
        src="/automari-icon-512.png"
        alt="Automari.Ai"
        width={logoSize}
        height={logoSize}
        className={cn("rounded-[22%] shadow-sm", logoClassName, className)}
        priority
      />
    );
  }

  const logoSize = size === "lg" ? 44 : size === "sm" ? 30 : 36;
  const textSize =
    size === "lg" ? "text-[22px]" : size === "sm" ? "text-[15px]" : "text-lg";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/automari-icon-512.png"
        alt="Automari.Ai"
        width={logoSize}
        height={logoSize}
        className={cn("rounded-[22%] shadow-[0_0_0_1px_rgba(0,191,255,0.12)]", logoClassName)}
        priority
      />
      <span
        className={cn(
          "font-semibold tracking-[-0.03em] text-[var(--brand-navy-fg)]",
          textSize,
          textClassName
        )}
      >
        Automari
        <span className="automari-ai-accent">.Ai</span>
      </span>
    </div>
  );
}
