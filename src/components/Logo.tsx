/** TrustForge mark in the TrustRoute style: a gold hairline diamond with a forged "T". For navy backgrounds. */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <rect x="19" y="2.5" width="23.3" height="23.3" transform="rotate(45 19 2.5)" stroke="#C9AE78" strokeWidth="1" />
      <path d="M12.5 14.5h13M19 14.5v11M15.5 22l3.5 3.5 3.5-3.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Arrow() {
  return (
    <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden="true">
      <path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function Check({ color = "#C9AE78" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="m4 9.4 3 3L14 5.6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
