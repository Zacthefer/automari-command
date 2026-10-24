import type { ReactNode, SVGProps } from "react";

type MarkProps = SVGProps<SVGSVGElement> & { title?: string };

function Mark({ title, children, ...props }: MarkProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function GaugeMark(props: MarkProps) {
  return (
    <Mark title="Cost per mile" {...props}>
      <path
        d="M6.5 19.5a9.5 9.5 0 1 1 19 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M16 19.2 21.2 11.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="19.4" r="1.6" fill="currentColor" />
      <path d="M8.2 19.5h15.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    </Mark>
  );
}

export function RevenueMark(props: MarkProps) {
  return (
    <Mark title="Revenue per mile" {...props}>
      <path
        d="M7 22.5 13.2 15l4.1 3.6L25 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19.2 9.5H25V15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </Mark>
  );
}

export function ProfitMark(props: MarkProps) {
  return (
    <Mark title="Profit per mile" {...props}>
      <circle cx="16" cy="16" r="8.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M16 10.6v10.8M13.1 13.1c.5-1 1.6-1.6 2.9-1.6 1.7 0 2.9.8 2.9 2.2 0 3.1-5.8 1.5-5.8 4.3 0 1.3 1.2 2.2 2.9 2.2 1.4 0 2.5-.6 3-1.6"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Mark>
  );
}

export function MilesMark(props: MarkProps) {
  return (
    <Mark title="Total miles" {...props}>
      <path
        d="M5.5 21.5h6.2L14 16.8l3.2 6.2 2.4-4.4h7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.2" cy="10.4" r="1.5" fill="currentColor" />
      <circle cx="16" cy="9.6" r="1.5" fill="currentColor" />
      <circle cx="24.2" cy="11.2" r="1.5" fill="currentColor" />
      <path d="M9.4 10.8 14.8 10M17.4 10 22.8 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </Mark>
  );
}

// Box truck from Phosphor Icons (MIT). Uses its own 256-unit viewBox.
export function TruckMark({ title = "Trucks", ...props }: MarkProps) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="m255.42 117l-14-35a15.93 15.93 0 0 0-14.84-10H192v-8a8 8 0 0 0-8-8H32a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h17a32 32 0 0 0 62 0h50a32 32 0 0 0 62 0h17a16 16 0 0 0 16-16v-64a7.9 7.9 0 0 0-.58-3M192 88h34.58l9.6 24H192ZM32 72h144v64H32Zm48 136a16 16 0 1 1 16-16a16 16 0 0 1-16 16m81-24h-50a32 32 0 0 0-62 0H32v-32h144v12.31A32.1 32.1 0 0 0 161 184m31 24a16 16 0 1 1 16-16a16 16 0 0 1-16 16m48-24h-17a32.06 32.06 0 0 0-31-24v-32h48Z" />
    </svg>
  );
}

export function DriversMark(props: MarkProps) {
  return (
    <Mark title="Drivers" {...props}>
      <circle cx="12.2" cy="11.2" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.6 22.2c.5-3.4 2.6-5.2 5.6-5.2s5.1 1.8 5.6 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="21.2" cy="12.1" r="2.5" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
      <path d="M18.4 22.2c.3-2.5 1.6-3.8 3.6-3.8 1.6 0 2.8.8 3.4 2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
    </Mark>
  );
}

export function HolderDriverMark(props: MarkProps) {
  return (
    <Mark title="Driver" {...props}>
      <circle cx="16" cy="11.4" r="3.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.8 23c.7-4.1 3.3-6.2 7.2-6.2s6.5 2.1 7.2 6.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Mark>
  );
}

export function HolderVehicleMark(props: MarkProps) {
  return (
    <Mark title="Vehicle" {...props}>
      <path
        d="M6 18.4 9.2 12.6h8.4L22.8 18.4H6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7.6 18.4h16.2v2.6H7.6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="11.2" cy="22.4" r="1.5" fill="currentColor" />
      <circle cx="20.6" cy="22.4" r="1.5" fill="currentColor" />
    </Mark>
  );
}

export function HolderCompanyMark(props: MarkProps) {
  return (
    <Mark title="Company" {...props}>
      <path d="M8 23.2V10.4h7.2V23.2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M15.2 14.2H24V23.2h-8.8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10.2 13.4h3M10.2 16.4h3M10.2 19.4h3M17.6 17h3.6M17.6 20h3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </Mark>
  );
}
