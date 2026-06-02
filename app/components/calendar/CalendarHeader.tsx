import type { PairState } from "../../types/calendar";

type CalendarHeaderProps = {
  year: number;
  month: number;
  isPairCalendarOpen: boolean;
  pairState: PairState;
  streakCount: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export default function CalendarHeader({
  year,
  month,
  isPairCalendarOpen,
  pairState,
  streakCount,
  onPrevMonth,
  onNextMonth,
}: CalendarHeaderProps) {
  return (
    <section className="rounded-[36px] bg-white p-6 shadow-xl">
      <p className="text-xs font-black text-[#f39a00]">
        {isPairCalendarOpen ? "PAIR CALENDAR" : "COOKING CALENDAR"}
      </p>

      <div className="mt-1 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded-full bg-[#fff4d7] px-4 py-2 text-sm font-black"
        >
          ←
        </button>

        <h1 className="text-3xl font-black">
          {year}年 {month + 1}月
        </h1>

        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-full bg-[#fff4d7] px-4 py-2 text-sm font-black"
        >
          →
        </button>
      </div>

      <p className="mt-3 text-sm font-bold text-[#6b2f13]/60">
        {isPairCalendarOpen
          ? "2人とも投稿した日は星マークが付きます。"
          : "投稿した日は色付きで表示されます。"}
      </p>

      {isPairCalendarOpen && pairState.partner && (
        <div className="mt-5 rounded-[28px] bg-[#fff4d7] p-4">
          <div className="flex items-center gap-3">
            <img
              src={pairState.partner.icon_url || "/images/default-icon.png"}
              alt={pairState.partner.name ?? "ペア相手"}
              className="h-11 w-11 rounded-full object-cover"
            />
            <div>
              <p className="text-xs font-black text-[#f39a00]">
                {pairState.code}
              </p>
              <p className="text-sm font-black">
                {pairState.partner.name || pairState.partner.user_id}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm font-black">現在 {streakCount}日連続</p>
          <p className="mt-1 text-xs font-bold text-[#6b2f13]/70">
            2人とも投稿している連続日数です。今日2人とも投稿済みなら、今日まで含めて数えます。
          </p>
        </div>
      )}
    </section>
  );
}
