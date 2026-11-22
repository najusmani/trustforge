export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="tf-logo" x1="0" y1="0" x2="34" y2="34">
          <stop offset="0" stopColor="#FFB37A" />
          <stop offset="1" stopColor="#F0602A" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="32" height="32" rx="9" fill="url(#tf-logo)" />
      <path
        d="M9 13h16M17 13v11M12 19.5l5 5 5-5"
        stroke="#1A0E05"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Check({ color = "#FF8A3D" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="m4 9.4 3 3L14 5.6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
