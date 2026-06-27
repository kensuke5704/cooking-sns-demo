type CameraCardProps = {
    label: string;
    src?: string;
    tilt?: "left" | "right" | "soft";
    onClick: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  
  export default function CameraCard({
    label,
    src,
    tilt = "soft",
    onClick,
    onFileChange,
  }: CameraCardProps) {
    const tiltClass =
      tilt === "left"
        ? "-rotate-[4deg]"
        : tilt === "right"
          ? "-rotate-[3deg]"
          : "-rotate-[1.5deg]";

    return (
      <div className="relative w-full">
        <button type="button" onClick={onClick} className="w-full text-left">
          {src ? (
            <div className={`${tiltClass} rounded-[5px] bg-[#fffaf2] p-[5px] pb-[14px] shadow-[0_8px_16px_rgba(63,33,22,0.14)] ring-1 ring-[#ead8b6]`}>
              <img
                src={src}
                alt={label}
                className="h-[64px] w-full rounded-[3px] object-cover"
                draggable={false}
              />
              <p className="mt-[3px] text-center text-[8px] font-black leading-none text-[#3f2116]">
                {label}
              </p>
            </div>
          ) : (
            <div className={`${tiltClass} rounded-[5px] bg-[#fffaf2] p-[5px] pb-[14px] shadow-[0_8px_16px_rgba(63,33,22,0.13)] ring-1 ring-[#ead8b6]`}>
              <div className="relative flex h-[64px] w-full items-center justify-center overflow-hidden rounded-[3px] bg-[#f4a72d]/10 text-[#dfc79d]">
                <div className="absolute bottom-2 left-[18px] h-[19px] w-[9px] rounded-b-full border-l border-r border-[#dfc79d]/40" />
                <div className="absolute bottom-[14px] left-[12px] h-[9px] w-[18px] rounded-full border border-[#dfc79d]/40" />
                <div className="absolute right-[17px] top-[16px] h-[23px] w-[8px] rounded-full border border-[#dfc79d]/45" />
                <div className="absolute right-[22px] top-[22px] h-[16px] w-[7px] rotate-[-42deg] rounded-full border border-[#dfc79d]/40" />
                <div className="relative h-[28px] w-[38px] translate-y-[4px] rounded-[5px] border-2 border-[#dfc79d]/50 bg-[#fff8e6]/65">
                  <div className="absolute -top-2 left-[10px] h-2.5 w-[16px] rounded-t-[4px] border-x-2 border-t-2 border-[#dfc79d]/50 bg-[#fff8e6]/65" />
                  <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dfc79d]/50" />
                  <div className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-[#dfc79d]/45" />
                </div>
              </div>
              <p className="mt-[3px] text-center text-[8px] font-black leading-none text-[#3f2116]">
                {label}
              </p>
            </div>
          )}
        </button>
  
        {!src && (
          <label className="absolute bottom-[40px] right-[-195px] flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-[#7a6a50]/70 bg-[#fffaf2]/70 text-[18px] font-medium leading-none text-[#0f6a47]">
            +
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
