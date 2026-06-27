import type { Post } from "../../types/post";

type CalendarGridProps = {
  days: (number | null)[];
  getDateKey: (day: number) => string;
  getPostsByDate: (dateKey: string) => Post[];
  hasPairStar: (day: number) => boolean;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
};

export default function CalendarGrid({
  days,
  getDateKey,
  getPostsByDate,
  hasPairStar,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  return (
    <section className="mt-5 rounded-[28px] border border-white/75 bg-white/95 p-4 shadow-[0_16px_44px_rgba(107,47,19,0.13)]">
      <div className="grid grid-cols-7 gap-2 text-center">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <div key={d} className="py-2 text-xs font-black text-[#f39a00]">
            {d}
          </div>
        ))}

        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;

          const dateKey = getDateKey(day);
          const dayPosts = getPostsByDate(dateKey);
          const posted = dayPosts.length > 0;
          const selected = selectedDate === dateKey;
          const pairStar = hasPairStar(day);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-[18px] text-sm font-black transition active:scale-[0.96] ${
                posted
                  ? "bg-[#6b2f13] text-white"
                  : "bg-[#fff4d7]/85 text-[#6b2f13]"
              } ${selected ? "ring-4 ring-[#f39a00]/40" : ""}`}
            >
              {pairStar && (
                <span className="absolute -right-1 -top-1">
                  <StarIcon />
                </span>
              )}
              <span>{day}</span>
              {posted && <span className="mt-1 text-[9px]">{dayPosts.length}件</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 drop-shadow-[0_10px_24px_rgba(107,47,19,0.12)]"
      fill="#f39a00"
      aria-hidden="true"
    >
      <path d="M12 2.5 14.9 8.6l6.7.9-4.9 4.7 1.2 6.6L12 17.7 6.1 20.8l1.2-6.6-4.9-4.7 6.7-.9L12 2.5Z" />
    </svg>
  );
}
