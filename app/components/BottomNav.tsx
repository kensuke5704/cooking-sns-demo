type BottomNavProps = {
    currentTab: string;
    setCurrentTab: (tab: string) => void;
  };
  
  export default function BottomNav({ currentTab, setCurrentTab }: BottomNavProps) {
    const items = [
      ["/images/home-icon.png", "ホーム"],
      ["/images/friends-icon.png", "友だち"],
      ["/images/camera-icon.png", "カメラ"],
      ["/images/calendar-icon.png", "カレンダー"],
      ["/images/article-icon.png", "記事"],
    ];
  
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-[999] bg-[#ffe88a] px-3 pt-3 pb-5 flex justify-around rounded-t-[32px] shadow-[0_-4px_12px_rgba(0,0,0,0.12)]">
        {items.map(([iconSrc, label]) => (
          <button
            key={label}
            onClick={() => setCurrentTab(label)}
            className="flex flex-col items-center font-black text-[#f39a00]"
          >
            <img src={iconSrc} alt={label} className="w-8 h-8 object-contain" />
            <span className="text-[11px] mt-1">{label}</span>
          </button>
        ))}
      </nav>
    );
  }