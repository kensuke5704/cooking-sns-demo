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
    <main className={`min-h-screen px-5 pt-6 pb-28 text-[#6b2f13] ${className}`}>
      <div className="mx-auto w-full max-w-md">
        {(label || title || subtitle || action) && (
          <header className="mb-5 flex items-end justify-between gap-4">
            <div className="min-w-0">
              {label && (
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/80">
                  {label}
                </p>
              )}

              {title && (
                <h1 className="mt-1 text-[32px] font-black leading-[1.08] tracking-[-0.04em] text-[#6b2f13]">
                  {title}
                </h1>
              )}

              {subtitle && (
                <p className="mt-2 max-w-[18rem] text-[13px] font-bold leading-relaxed text-[#6b2f13]/65">
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
