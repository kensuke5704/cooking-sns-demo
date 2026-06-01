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
    <nav className="fixed bottom-4 left-0 right-0 z-50 bg-white border-t border-[#f1d59a] px-3 py-2">
      <div className="mx-auto flex max-w-md justify-between">
        {items.map(([iconSrc, label]) => {
          const active = currentTab === label;

          return (
            <button
              key={label}
              type="button"
              onClick={() => setCurrentTab(label)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-black ${
                active ? "bg-[#f8b72a] text-white" : "text-[#f39a00]"
              }`}
            >
              <div className="relative">
                <img
                  src={iconSrc}
                  alt=""
                  className="h-6 w-6 object-contain"
                />

                {label === "ホーム" && unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}