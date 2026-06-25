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
    ["/images/home-icon.png", "ホーム"],
    ["/images/friends-icon.png", "つながり"],
    ["/images/camera-icon.png", "カメラ"],
    ["/images/calendar-icon.png", "カレンダー"],
    ["/images/friends-icon.png", "プロフィール"],
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-5 pb-[calc(env(safe-area-inset-bottom)+14px)]">
      <div className="mx-auto flex max-w-[382px] items-center justify-between rounded-[30px] bg-[#fff8e6]/94 px-3 py-2 shadow-[0_18px_44px_rgba(63,33,22,0.2)] ring-1 ring-white/70 backdrop-blur-xl">
        {items.map(([iconSrc, label]) => {
          const active = currentTab === label;

          return (
            <button
              key={label}
              type="button"
              onClick={() => setCurrentTab(label)}
              className={`relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-full px-1 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${
                active ? "bg-[#f4a72d]/18 text-[#f4a72d]" : "text-[#9d7140]"
              } ${label === "カメラ" ? "-mt-8 h-20" : ""}`}
            >
              <div
                className={`relative ${
                  label === "カメラ"
                    ? "flex h-16 w-16 items-center justify-center rounded-full bg-[#0f6a47] shadow-[0_14px_28px_rgba(15,106,71,0.28)] ring-4 ring-[#fff8e6]"
                    : ""
                }`}
              >
                <img
                  src={iconSrc}
                  alt=""
                  className={`h-6 w-6 object-contain transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    label === "カメラ"
                      ? "brightness-0 invert"
                      : active
                      ? "scale-110"
                      : "scale-100 opacity-58"
                  }`}
                />

                {label === "ホーム" && unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>

              {active && (
                <span className="absolute bottom-0 h-1 w-4 rounded-full bg-[#f4a72d]" />
              )}

              <span
                className={`mt-1 text-[11px] font-black leading-none ${
                  label === "カメラ" ? "text-[#3f2116]" : ""
                }`}
              >
                {label === "プロフィール" ? "マイページ" : label === "カメラ" ? "撮る" : label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
