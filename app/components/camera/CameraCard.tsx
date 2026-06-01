type CameraCardProps = {
    label: string;
    src?: string;
    onClick: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  
  export default function CameraCard({
    label,
    src,
    onClick,
    onFileChange,
  }: CameraCardProps) {
    return (
      <div className="w-full">
        <button type="button" onClick={onClick} className="w-full">
          {src ? (
            <div className="bg-white p-2 pb-6 shadow-xl">
              <img
                src={src}
                alt={label}
                className="aspect-[3/4] w-full object-cover"
                draggable={false}
              />
              <p className="mt-1 text-center text-[11px] font-black text-[#6b2f13]">
                {label} 済み
              </p>
            </div>
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl border-2 border-dashed border-white/70 bg-white/20 text-sm font-black text-white">
              ＋ {label}
            </div>
          )}
        </button>
  
        {!src && (
          <label className="mt-2 block rounded-full bg-white px-2 py-2 text-center text-[10px] font-black text-[#6b2f13]">
            ライブラリ
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    );
  }