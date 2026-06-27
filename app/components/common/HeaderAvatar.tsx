type HeaderAvatarProps = {
  iconUrl?: string;
  action?: "bell" | "calendar" | "none";
};

export default function HeaderAvatar({ iconUrl, action = "bell" }: HeaderAvatarProps) {
  return (
    <div className="flex items-center gap-[7px]">
      {action !== "none" && (
        <span className="relative flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#fff8e6] text-[#3f2116] shadow-[0_6px_14px_rgba(63,33,22,0.12)] ring-1 ring-white/70">
          {action === "calendar" ? (
            <CalendarGlyph className="h-[16px] w-[16px]" />
          ) : (
            <BellGlyph className="h-[17px] w-[17px]" />
          )}
          {action === "bell" && (
            <span className="absolute right-[-1px] top-[1px] h-[7px] w-[7px] rounded-full bg-[#0f6a47] ring-[1.5px] ring-[#fbb23a]" />
          )}
        </span>
      )}
      <span className="flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#dcebc9] ring-1 ring-[#fff8e6]/85">
        <img
          src={iconUrl || "/images/user1-icon.jpg"}
          alt="ユーザー"
          className="h-full w-full rounded-full object-cover"
        />
      </span>
    </div>
  );
}

export function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M7 4.8v2.7M17 4.8v2.7M5 9.1h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="4.4"
        y="6.4"
        width="15.2"
        height="13.4"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.1 12.7h.1M12 12.7h.1M15.9 12.7h.1M8.1 16h.1M12 16h.1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BellGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M7.5 10.2c0-2.8 1.7-5 4.5-5s4.5 2.2 4.5 5v3.4l1.4 2.3H6.1l1.4-2.3v-3.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.1c.3.9 1 1.4 2 1.4s1.7-.5 2-1.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
