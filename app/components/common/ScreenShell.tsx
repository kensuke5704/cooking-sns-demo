import type { ReactNode } from "react";

type ScreenShellProps = {
  label?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function ScreenShell({
  label,
  title,
  subtitle,
  action,
  children,
  className = "",
}: ScreenShellProps) {
  return (
    <main className={`min-h-[100dvh] bg-[#f4a72d] px-3 pt-3 pb-[86px] text-[#4b2a1d] ${className}`}>
      <div className="mx-auto w-full max-w-md">
        {(label || title || subtitle || action) && (
          <header className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              {label && (
                <p className="text-[11px] font-black text-white/85">
                  {label}
                </p>
              )}

              {title && (
                <h1 className="mt-1 text-[20px] font-black leading-[1.08] text-[#4b2a1d]">
                  {title}
                </h1>
              )}

              {subtitle && (
                <p className="mt-1 max-w-[18rem] text-[11px] font-bold leading-relaxed text-[#4b2a1d]/65">
                  {subtitle}
                </p>
              )}
            </div>

            {action && <div className="shrink-0 pb-1">{action}</div>}
          </header>
        )}

        {children}
      </div>
    </main>
  );
}
