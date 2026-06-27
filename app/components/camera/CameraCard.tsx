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
        <button type="button" onClick={onClick} className="w-full text-left">
          {src ? (
            <div className="rounded-[5px] bg-[#fffaf2] p-1 pb-4 shadow-[0_8px_16px_rgba(63,33,22,0.14)] ring-1 ring-[#ead8b6]">
              <img
                src={src}
                alt={label}
                className="aspect-[4/3] w-full rounded-[3px] object-cover"
                draggable={false}
              />
              <p className="mt-1 text-center text-[9px] font-black leading-none text-[#3f2116]">
                {label}
              </p>
            </div>
          ) : (
            <div className="rounded-[5px] bg-[#fffaf2] p-1 pb-4 shadow-[0_8px_16px_rgba(63,33,22,0.13)] ring-1 ring-[#ead8b6]">
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[3px] bg-[#f4a72d]/12 text-[18px] font-black text-[#0f6a47]">
                +
              </div>
              <p className="mt-1 text-center text-[9px] font-black leading-none text-[#3f2116]">
                {label}
              </p>
            </div>
          )}
        </button>
  
        {!src && (
          <label className="mt-1 block rounded-full bg-[#fff8e6] px-2 py-1 text-center text-[9px] font-black text-[#3f2116] shadow-sm ring-1 ring-[#dfc79d]/70">
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
