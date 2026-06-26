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
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+7px)]">
      <div className="mx-auto flex max-w-[366px] items-center justify-between rounded-[18px] bg-[#fff8e6]/96 px-2 py-1.5 shadow-[0_10px_24px_rgba(63,33,22,0.16)] ring-1 ring-white/70 backdrop-blur-xl">
        {items.map(([iconSrc, label]) => {
          const active = currentTab === label;

          return (
            <button
              key={label}
              type="button"
              onClick={() => setCurrentTab(label)}
              className={`relative flex h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-[14px] px-1 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${
                active ? "bg-[#f4a72d]/18 text-[#f4a72d]" : "text-[#9d7140]"
              } ${label === "カメラ" ? "-mt-5 h-14" : ""}`}
            >
              <div
                className={`relative ${
                  label === "カメラ"
                    ? "flex h-12 w-12 items-center justify-center rounded-full bg-[#0f6a47] shadow-[0_10px_22px_rgba(15,106,71,0.26)] ring-4 ring-[#fff8e6]"
                    : ""
                }`}
              >
                <img
                  src={iconSrc}
                  alt=""
                  className={`h-5 w-5 object-contain transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
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
                className={`mt-0.5 text-[9px] font-black leading-none ${
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
