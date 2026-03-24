import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18" {...props}>
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="6" x="4" y="4" />
      <rect height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="6" x="14" y="4" />
      <rect height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="6" x="4" y="14" />
      <rect height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="6" x="14" y="14" />
    </IconBase>
  );
}

export function MembersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 18.5c1.2-2.4 3-3.5 5.5-3.5s4.3 1.1 5.5 3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="M16 7.5a2.5 2.5 0 1 1 0 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function PaymentIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="5" />
      <path d="M3 10.5h18" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 15.5h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.8-1L14.5 3h-5L9 6a8 8 0 0 0-1.8 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.8 1l.5 3h5l.5-3a8 8 0 0 0 1.8-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </IconBase>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="5" />
      <path d="m5.5 8 6.5 5 6.5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 20V6.5L12 4l6 2.5V20" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M9 9h.01M9 12.5h.01M9 16h.01M15 9h.01M15 12.5h.01M15 16h.01M10.5 20v-3h3v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 12h15M12 4.2c2.1 2.3 3.2 5 3.2 7.8S14.1 17.5 12 19.8M12 4.2C9.9 6.5 8.8 9.2 8.8 12s1.1 5.5 3.2 7.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </IconBase>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4c4.4 0 8 2.9 8 6.6 0 2.4-1.6 4.4-4 4.4h-1.6c-.8 0-1.4.6-1.4 1.4 0 1.2-1 2.1-2.1 2.1C7.1 18.5 4 15.4 4 11.6 4 7.4 7.6 4 12 4Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8.2" cy="10" r="1" fill="currentColor" />
      <circle cx="11.5" cy="7.8" r="1" fill="currentColor" />
      <circle cx="15.3" cy="9.2" r="1" fill="currentColor" />
    </IconBase>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 4h10v16l-2-1.6L13 20l-2-1.6L9 20l-2-1.6L5 20V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M9 9.5h6M9 13h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 18h8M9 18v-1.5c0-.8-.3-1.5-.8-2.1A5.5 5.5 0 0 1 6.5 10 5.5 5.5 0 0 1 12 4.5 5.5 5.5 0 0 1 17.5 10c0 1.7-.6 3.2-1.7 4.4-.5.6-.8 1.3-.8 2.1V18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m7 10 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </IconBase>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m14 7-5 5 5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </IconBase>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m10 7 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </IconBase>
  );
}

export function HelpCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1.4 1-1.4 2.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="12" cy="17" fill="currentColor" r="0.9" />
    </IconBase>
  );
}

export function MoreHorizontalIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6.5" cy="12" fill="currentColor" r="1.5" />
      <circle cx="12" cy="12" fill="currentColor" r="1.5" />
      <circle cx="17.5" cy="12" fill="currentColor" r="1.5" />
    </IconBase>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8.5" r="3.3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 19c1.7-2.8 4-4.2 7-4.2s5.3 1.4 7 4.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 5H7.5A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19H10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="M14 8.5 18 12l-4 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M9 12h9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}
