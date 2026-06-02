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
        <div className="w-full h-full rounded-xl border-2 border-dashed border-white/70 bg-white/20 flex items-center justify-center text-white text-sm font-bold">
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
        className="w-full h-full bg-white p-2 pb-8 shadow-xl cursor-pointer touch-manipulation select-none"
      >
        <img
          src={src}
          alt={label}
          draggable={false}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover pointer-events-none select-none"
        />
      </div>
    );
  }