export default function PhotoBox({
    src,
    label,
    onClick,
  }: {
    src?: string;
    label: string;
    onClick: (src: string) => void;
  }) {
    if (!src) {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-white/70 bg-white/20 text-sm font-bold text-white">
          {label}
        </div>
      );
    }
  
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onClick(src)}
        onPointerUp={() => onClick(src)}
        className="h-full w-full cursor-pointer touch-manipulation select-none rounded-[10px] border border-[#f1d59a]/70 bg-[#fffaf2] p-1.5 pb-7 shadow-[0_16px_36px_rgba(107,47,19,0.22)] ring-1 ring-white/80"
      >
        <img
          src={src}
          alt={label}
          draggable={false}
          loading="lazy"
          decoding="async"
          className="pointer-events-none h-full w-full select-none rounded-[6px] object-cover"
        />
      </div>
    );
  }