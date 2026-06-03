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
    <section className="rounded-[36px] bg-white p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded-full bg-[#fff4d7] px-4 py-2 text-sm font-black"
        >
          ←
        </button>

        <h2 className="text-2xl font-black">
          {year}年 {month + 1}月
        </h2>

        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-full bg-[#fff4d7] px-4 py-2 text-sm font-black"
        >
          →
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-[#fff4d7] px-4 py-3 text-sm font-bold text-[#6b2f13]/70">
        {isPairCalendarOpen
          ? "星マークの日は2人とも投稿済みです。"
          : "色付きの日を押すと投稿を確認できます。"}
      </div>

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

          <div className="mt-4 rounded-2xl bg-white p-3">
            <p className="text-xs font-black text-[#f39a00]">連続特典</p>
            <div className="mt-3 space-y-2 text-xs font-bold text-[#6b2f13]/75">
              <RewardRow days="50日" text="記念バッジを表示" />
              <RewardRow days="100日" text="特別フレームを解放" />
              <RewardRow days="365日" text="1年記念カードを表示" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function RewardRow({ days, text }: { days: string; text: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#fff4d7] px-3 py-2">
      <span className="shrink-0 font-black text-[#6b2f13]">{days}</span>
      <span className="text-right">{text}</span>
    </div>
  );
}
