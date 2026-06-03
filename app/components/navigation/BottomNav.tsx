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
    ["/images/calendar-icon.png", "カレンダー"],
    ["/images/camera-icon.png", "カメラ"],
    ["/images/article-icon.png", "記事"],
    ["/images/friends-icon.png", "プロフィール"],
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#f5e7c3] bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-8px_24px_rgba(107,47,19,0.05)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between">
        {items.map(([iconSrc, label]) => {
          const active = currentTab === label;

          return (
            <button
              key={label}
              type="button"
              onClick={() => setCurrentTab(label)}
              className={`relative flex min-w-0 flex-1 items-center justify-center px-1 py-1.5 transition active:scale-[0.97] ${
                active ? "text-[#f39a00]" : "text-[#b88748]"
              }`}
            >
              <div className="relative">
                <img
                  src={iconSrc}
                  alt=""
                  className={`h-7 w-7 object-contain transition ${
                    active ? "scale-110" : "scale-100 opacity-70"
                  }`}
                />

                {label === "ホーム" && unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>

              {active && (
                <span className="absolute bottom-0 h-1 w-5 rounded-full bg-[#f39a00]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
