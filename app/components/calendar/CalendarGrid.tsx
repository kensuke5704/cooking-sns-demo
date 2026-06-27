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
    <section className="rounded-b-[8px] bg-[#fffaf2]/94 px-3 pb-3 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
      <div className="grid grid-cols-7 overflow-hidden rounded-[6px] border border-[#dfc79d]/60 text-center">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <div
            key={d}
            className={`py-1.5 text-[10px] font-black ${
              d === "日" ? "text-red-600" : d === "土" ? "text-blue-600" : "text-[#3f2116]"
            }`}
          >
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
              className={`relative flex aspect-square flex-col items-center justify-start border-l border-t border-[#dfc79d]/55 p-1.5 text-[11px] font-black transition active:scale-[0.98] ${
                selected
                  ? "rounded-[6px] bg-[#0f6a47] text-[#fff8e6] shadow-[inset_0_-8px_0_rgba(0,0,0,0.1)]"
                  : "bg-[#fffaf2]/72 text-[#3f2116]"
              }`}
            >
              {pairStar && (
                <span className="absolute -right-1 -top-1">
                  <StarIcon />
                </span>
              )}
              <span className="leading-none">{day}</span>
              {posted && (
                dayPosts[0]?.finishedPhoto || dayPosts[0]?.cookingPhoto || dayPosts[0]?.prepPhoto ? (
                  <img
                    src={dayPosts[0].finishedPhoto || dayPosts[0].cookingPhoto || dayPosts[0].prepPhoto}
                    alt=""
                    className="mt-1 h-5 w-5 rounded-full object-cover ring-1 ring-[#dfc79d]"
                  />
                ) : (
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#f4a72d]" />
                )
              )}
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
