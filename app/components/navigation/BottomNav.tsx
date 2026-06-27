type BottomNavProps = {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  unreadCount?: number;
};

export default function BottomNav({
  currentTab,
  setCurrentTab,
  unreadCount = 0,
}: BottomNavProps) {
  const items = [
    "ホーム",
    "つながり",
    "カメラ",
    "カレンダー",
    "プロフィール",
  ];

  return (
    <nav className="fixed inset-x-0 bottom-[24px] z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+7px)]">
      <div className="mx-auto flex max-w-[366px] items-center justify-between rounded-[18px] bg-[#fff8e6]/96 px-2 py-1.5 shadow-[0_10px_24px_rgba(63,33,22,0.16)] ring-1 ring-white/70 backdrop-blur-xl">
        {items.map((label) => {
          const active = currentTab === label;

          return (
            <button
              key={label}
              type="button"
              onClick={() => setCurrentTab(label)}
            className={`relative flex h-10 min-w-0 flex-1 flex-col items-center justify-center rounded-[14px] px-1 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${
                active ? "bg-[#f4a72d]/18 text-[#f4a72d]" : "text-[#9d7140]"
              } ${label === "カメラ" ? "-mt-3 h-[52px]" : ""}`}
            >
              <div
                className={`relative ${
                  label === "カメラ"
                    ? "flex h-11 w-11 items-center justify-center rounded-full bg-[#0f6a47] text-white shadow-[0_10px_22px_rgba(15,106,71,0.26)] ring-4 ring-[#fff8e6]"
                    : active
                      ? "scale-110"
                      : "opacity-60"
                }`}
              >
                <NavIcon
                  label={label}
                  active={active}
                  className={label === "カメラ" ? "h-5 w-5" : "h-3.5 w-3.5"}
                />

                {label === "ホーム" && unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>

              <span
                className={`mt-1 text-[var(--text-nav-label)] font-black leading-none ${
                  label === "カメラ" ? "text-[#7d5632]" : ""
                }`}
              >
                {label === "プロフィール" ? "マイページ" : label === "カメラ" ? "撮る" : label}
              </span>
              {active && label !== "カメラ" && (
                <span className="absolute bottom-1 h-1 w-4 rounded-full bg-[#f4a72d]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function NavIcon({
  label,
  active,
  className,
}: {
  label: string;
  active: boolean;
  className: string;
}) {
  const strokeWidth = active ? 2.35 : 2.05;

  if (label === "ホーム") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M4.2 10.7 12 4.1l7.8 6.6v8.1a1.9 1.9 0 0 1-1.9 1.9h-3.4v-6.1h-5v6.1H6.1a1.9 1.9 0 0 1-1.9-1.9v-8.1Z"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (label === "つながり") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <path d="M8.5 11.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" stroke="currentColor" strokeWidth={strokeWidth} />
        <path d="M15.9 10.9a2.7 2.7 0 1 0 0-5.4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M3.6 20.1c.6-3.7 2.3-5.5 4.9-5.5s4.3 1.8 4.9 5.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M13.9 15.4c2.8.2 4.7 1.7 5.4 4.7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  }

  if (label === "カメラ") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <path d="M7.3 7.3 8.8 5h6.4l1.5 2.3h2.1a2.1 2.1 0 0 1 2.1 2.1v7.5a2.1 2.1 0 0 1-2.1 2.1H5.2a2.1 2.1 0 0 1-2.1-2.1V9.4a2.1 2.1 0 0 1 2.1-2.1h2.1Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="12" cy="13.2" r="3.35" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }

  if (label === "カレンダー") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <path d="M7 4.8v3M17 4.8v3M4.7 9.4h14.6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <rect x="4.2" y="6.5" width="15.6" height="13.4" rx="2.2" stroke="currentColor" strokeWidth={strokeWidth} />
        <path d="M8.2 12.8h.1M12 12.8h.1M15.8 12.8h.1M8.2 16.2h.1M12 16.2h.1" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <circle cx="12" cy="8" r="3.7" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M5.2 20.2c.8-4.1 3.1-6.1 6.8-6.1s6 2 6.8 6.1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}
