type EmptyStateProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-[#f1d59a]/80 bg-[#fff4d7]/80 px-5 py-7 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#f39a00] shadow-sm">
        —
      </div>
      <p className="mt-4 text-base font-black tracking-[-0.02em] text-[#6b2f13]">{title}</p>
      {message && (
        <p className="mt-2 text-[13px] font-bold leading-relaxed text-[#6b2f13]/62">
          {message}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-full bg-[#f39a00] px-5 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(243,154,0,0.28)] transition active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
