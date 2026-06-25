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
    <section className={`rounded-[30px] bg-[#fffaf2]/94 p-5 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65 backdrop-blur ${className}`}>
      {(label || title || description) && (
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-[#dfc79d]/55 pb-4">
          <div className="min-w-0">
            {label && (
              <p className="text-[11px] font-black text-[#0f6a47]">
                {label}
              </p>
            )}
            {title && <h2 className="mt-1 text-[20px] font-black leading-tight text-[#3f2116]">{title}</h2>}
            {description && (
              <p className="mt-2 text-[13px] font-bold leading-relaxed text-[#3f2116]/62">
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
