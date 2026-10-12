type KichThuocLogo = "sm" | "md" | "lg";

const KICH_THUOC: Record<KichThuocLogo, { hop: number; chu: string }> = {
  sm: { hop: 32, chu: "text-sm" },
  md: { hop: 40, chu: "text-base" },
  lg: { hop: 56, chu: "text-xl" },
};

/** Biểu trưng dạng giọt serum cách điệu — gợi mỹ phẩm, không phải chữ "O" đơn thuần. */
export function LogoMark({ size = "md", className }: { size?: KichThuocLogo; className?: string }) {
  const { hop } = KICH_THUOC[size];
  return (
    <svg
      viewBox="0 0 40 40"
      width={hop}
      height={hop}
      className={className}
      role="img"
      aria-label="Biểu trưng Omyn"
    >
      <defs>
        <linearGradient id="omynLogoGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--omyn-primary)" />
          <stop offset="1" stopColor="var(--omyn-primary-dark)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#omynLogoGrad)" />
      <path
        d="M20 7.5c-5.7 4.3-9.2 8.7-9.2 13.3 0 5.4 4.1 9.7 9.2 9.7s9.2-4.3 9.2-9.7c0-4.6-3.5-9-9.2-13.3Z"
        fill="#ffffff"
        fillOpacity="0.95"
      />
      <circle cx="20" cy="22.2" r="3.1" fill="var(--omyn-accent)" />
    </svg>
  );
}

export function Logo({
  size = "md",
  showText = true,
  className,
}: {
  size?: KichThuocLogo;
  showText?: boolean;
  className?: string;
}) {
  const { chu } = KICH_THUOC[size];
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} />
      {showText && (
        <div className="leading-tight">
          <div className={`font-semibold tracking-tight text-slate-900 dark:text-white ${chu}`}>OMYN</div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            HRM nội bộ
          </div>
        </div>
      )}
    </div>
  );
}
