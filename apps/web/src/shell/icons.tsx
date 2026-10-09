import type { ReactNode } from 'react';

/** Line icons for the main menu, drawn on a 24 × 24 grid and coloured by `currentColor`. */

interface IconProps {
  readonly className?: string;
}

function Icon({ className, children }: IconProps & { readonly children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </Icon>
  );
}

export function CardsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3h11a1 1 0 0 1 1 1v14" />
      <rect x="4" y="6" width="12" height="15" rx="1.5" />
      <path d="M7.5 11h5M7.5 15h5" />
    </Icon>
  );
}

export function PitchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 12h18" />
      <circle cx="12" cy="12" r="3" />
      <path d="M8 3v3h8V3M8 21v-3h8v3" />
    </Icon>
  );
}

export function SourcesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="5.5" rx="8" ry="2.5" />
      <path d="M4 5.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6" />
      <path d="M4 11.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6" />
    </Icon>
  );
}

export function LogoMark(props: IconProps) {
  return (
    <svg className={props.className} viewBox="0 0 64 64" width="32" height="32" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="var(--color-accent)" />
      <path d="M18 14h28l-4 8H27l-1 6h14l-4 8H25l-3 14h-9z" fill="var(--color-on-accent)" />
    </svg>
  );
}
