import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

// Animated line icons adapted from Iconify's line-md set (MIT).
// SMIL animation ignores prefers-reduced-motion, so each icon also renders its
// final frame as a static SVG and CSS shows one or the other.
// SMIL plays once when the SVG mounts; change the parent's `key` to replay it.

type IconProps = SVGProps<SVGSVGElement>;

const CLOUD_ARROW_STATIC =
  "M7 19h0c-2.5 0 -4 -2 -4 -4c0 -2 1.5 -4 4 -4c1 0 1.5 0.5 1.5 0.5M17 19h0c2.5 0 4 -2 4 -4c0 -2 -1.5 -4 -4 -4c-1 0 -1.5 0.5 -1.5 0.5M7 11v-1c0 -2.5 2 -5 5 -5M17 11v-1c0 -2.5 -2 -5 -5 -5M12 15v6M12 22l2 -2M12 22l-2 -2";

function StaticCloudDown({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("hidden motion-reduce:block", className)} {...props}>
      <path
        d={CLOUD_ARROW_STATIC}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

/** Cloud draws itself, then the download arrow drops in. */
export function CloudDownIcon({ className, ...props }: IconProps) {
  return (
    <>
      <svg viewBox="0 0 24 24" aria-hidden className={cn("motion-reduce:hidden", className)} {...props}>
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          <path
            strokeDasharray="18"
            d="M7 19h0c-2.5 0 -4 -2 -4 -4c0 -2 1.5 -4 4 -4c1 0 1.5 0.5 1.5 0.5M17 19h0c2.5 0 4 -2 4 -4c0 -2 -1.5 -4 -4 -4c-1 0 -1.5 0.5 -1.5 0.5"
          >
            <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="18;0" />
          </path>
          <path strokeDasharray="12" strokeDashoffset="12" d="M7 11v-1c0 -2.5 2 -5 5 -5M17 11v-1c0 -2.5 -2 -5 -5 -5">
            <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.4s" to="0" />
          </path>
          <path strokeDasharray="8" strokeDashoffset="8" d="M12 15v6">
            <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.9s" dur="0.2s" to="0" />
          </path>
          <path strokeDasharray="6" strokeDashoffset="6" d="M12 22l2 -2M12 22l-2 -2">
            <animate fill="freeze" attributeName="stroke-dashoffset" begin="1.1s" dur="0.2s" to="0" />
          </path>
        </g>
      </svg>
      <StaticCloudDown className={className} {...props} />
    </>
  );
}

/** Looping "downloading" state: the arrow bobs inside the cloud until unmounted. */
export function CloudDownloadingIcon({ className, ...props }: IconProps) {
  return (
    <>
      <svg viewBox="0 0 24 24" aria-hidden className={cn("motion-reduce:hidden", className)} {...props}>
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7 19h11c2.21 0 4 -1.79 4 -4c0 -2.21 -1.79 -4 -4 -4h-1v-1c0 -2.76 -2.24 -5 -5 -5c-2.42 0 -4.44 1.72 -4.9 4h-0.1c-2.76 0 -5 2.24 -5 5c0 2.76 2.24 5 5 5Z"
        />
        <path fill="currentColor" d="M10.5 10h3v3h2.5l-4 4l-4 -4h2.5Z">
          <animate
            attributeName="d"
            dur="1.5s"
            keyTimes="0;0.25;0.75;1"
            repeatCount="indefinite"
            values="M10.5 10h3v3h2.5l-4 4l-4 -4h2.5Z;M10.5 10h3v4h2.5l-4 4l-4 -4h2.5Z;M10.5 10h3v2h2.5l-4 4l-4 -4h2.5Z;M10.5 10h3v3h2.5l-4 4l-4 -4h2.5Z"
          />
        </path>
      </svg>
      <StaticCloudDown className={className} {...props} />
    </>
  );
}
