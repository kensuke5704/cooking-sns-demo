type BottomNavProps = {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
};

export default function BottomNav({ currentTab, setCurrentTab }: BottomNavProps) {
  const items = [
    ["/images/home-icon.png", "ホーム"],
    ["/images/calendar-icon.png", "カレンダー"],
    ["/images/camera-icon.png", "カメラ"],
    ["/images/article-icon.png", "記事"],
    ["/images/friends-icon.png", "プロフィール"],
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#f1d59a] px-3 py-2">
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
              <img src={iconSrc} alt="" className="h-7 w-7 object-contain" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}