import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
  size?: "sm" | "md";
};

export function BrandMark({
  className,
  logoClassName,
  textClassName,
  size = "md",
}: BrandMarkProps) {
  const logoSize = size === "sm" ? 32 : 36;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/automari-logo.ico"
        alt="Automari logo"
        width={logoSize}
        height={logoSize}
        className={cn("rounded-lg", logoClassName)}
        priority
      />
      <span
        className={cn(
          "font-semibold tracking-tight",
          size === "sm" ? "text-[15px]" : "text-lg",
          textClassName
        )}
      >
        Automari{" "}
        <span className="automari-ai-accent">Ai</span>
      </span>
    </div>
  );
}
