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
    <section className={`rounded-[32px] bg-white p-5 shadow-xl ${className}`}>
      {(label || title || description) && (
        <div className="mb-4">
          {label && (
            <p className="text-xs font-black tracking-wide text-[#f39a00]">
              {label}
            </p>
          )}
          {title && <h2 className="mt-1 text-xl font-black">{title}</h2>}
          {description && (
            <p className="mt-2 text-sm font-bold leading-relaxed text-[#6b2f13]/60">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
