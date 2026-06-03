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
        className="h-full w-full cursor-pointer touch-manipulation select-none bg-white p-1.5 pb-5 shadow-[0_14px_34px_rgba(107,47,19,0.14)]"
      >
        <img
          src={src}
          alt={label}
          draggable={false}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover pointer-events-none select-none"
        />
      </div>
    );
  }