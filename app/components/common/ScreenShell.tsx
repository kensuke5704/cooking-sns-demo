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
    <main className={`min-h-screen bg-[#f8b72a] px-5 pt-5 pb-28 text-[#6b2f13] ${className}`}>
      <div className="mx-auto w-full max-w-md">
        {(label || title || subtitle || action) && (
          <header className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {label && (
                <p className="text-xs font-black tracking-wide text-white/90">
                  {label}
                </p>
              )}

              {title && (
                <h1 className="mt-1 text-3xl font-black leading-tight text-[#6b2f13]">
                  {title}
                </h1>
              )}

              {subtitle && (
                <p className="mt-2 text-sm font-bold leading-relaxed text-[#6b2f13]/70">
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
