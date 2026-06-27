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
    <main className={`min-h-[100dvh] bg-[#fbb23a] px-3 pt-4 pb-[86px] text-[#4b2a1d] ${className}`}>
      <div className="mx-auto w-full max-w-md">
        {(label || title || subtitle || action) && (
          <header className="mb-3 flex min-h-[34px] items-start justify-between gap-3 px-1">
            <div className="min-w-0">
              {label && (
                <p className="sr-only">
                  {label}
                </p>
              )}

              {title && (
                <h1 className="text-[var(--text-header-title)] font-black leading-none text-[#4b2a1d]">
                  {title}
                </h1>
              )}

              {subtitle && (
                <p className="mt-2 max-w-[18rem] text-[10px] font-bold leading-relaxed text-[#4b2a1d]/62">
                  {subtitle}
                </p>
              )}
            </div>

            {action && <div className="shrink-0">{action}</div>}
          </header>
        )}

        {children}
      </div>
    </main>
  );
}
