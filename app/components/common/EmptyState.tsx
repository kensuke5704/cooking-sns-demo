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
    <div className="rounded-[24px] border border-[#dfc79d]/80 bg-[#fff8e6]/80 px-5 py-7 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#0f6a47] shadow-sm">
        —
      </div>
      <p className="mt-4 text-base font-black text-[#3f2116]">{title}</p>
      {message && (
        <p className="mt-2 text-[13px] font-bold leading-relaxed text-[#3f2116]/62">
          {message}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-full bg-[#0f6a47] px-5 py-3 text-sm font-black text-[#fff8e6] shadow-[0_10px_24px_rgba(15,106,71,0.22)] transition active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
