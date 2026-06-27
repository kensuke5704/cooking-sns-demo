import type { ReactNode } from "react";

type SectionCardProps = {
  label?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({
  label,
  title,
  description,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section className={`rounded-[28px] border border-white/75 bg-white/95 p-5 shadow-[0_16px_44px_rgba(107,47,19,0.13)] backdrop-blur ${className}`}>
      {(label || title || description) && (
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-[#f1d59a]/55 pb-4">
          <div className="min-w-0">
            {label && (
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f39a00]">
                {label}
              </p>
            )}
            {title && <h2 className="mt-1 text-[20px] font-black leading-tight tracking-[-0.03em]">{title}</h2>}
            {description && (
              <p className="mt-2 text-[13px] font-bold leading-relaxed text-[#6b2f13]/60">
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      {children}
    </section>
  );
}
