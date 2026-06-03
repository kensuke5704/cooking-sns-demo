import type { PairState } from "../../types/calendar";

type CalendarHeaderProps = {
  year: number;
  month: number;
  isPairCalendarOpen: boolean;
  pairState: PairState;
  streakCount: number;
  achievedMilestone: number | null;
  nextMilestone: number | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

const REWARDS = [
  { days: 50, text: "バッジ" },
  { days: 100, text: "フレーム" },
  { days: 365, text: "1年カード" },
];

export default function CalendarHeader({
  year,
  month,
  isPairCalendarOpen,
  pairState,
  streakCount,
  achievedMilestone,
  nextMilestone,
  onPrevMonth,
  onNextMonth,
}: CalendarHeaderProps) {
  return (
    <section className="rounded-[28px] border border-white/75 bg-white/95 p-5 shadow-[0_16px_44px_rgba(107,47,19,0.13)]">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded-full border border-[#f1d59a]/70 bg-[#fff4d7]/80 px-4 py-2 text-sm font-black transition active:scale-[0.97]"
        >
          ←
        </button>

        <h2 className="text-2xl font-black">
          {year}年 {month + 1}月
        </h2>

        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-full border border-[#f1d59a]/70 bg-[#fff4d7]/80 px-4 py-2 text-sm font-black transition active:scale-[0.97]"
        >
          →
        </button>
      </div>

      {isPairCalendarOpen && pairState.partner && (
        <div className="mt-5 rounded-[24px] border border-[#f1d59a]/70 bg-[#fff4d7]/70 p-4">
          <div className="flex items-center gap-3">
            <img
              src={pairState.partner.icon_url || "/images/default-icon.png"}
              alt={pairState.partner.name ?? "ペア相手"}
              className="h-11 w-11 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-[#f39a00]">
                {pairState.code}
              </p>
              <p className="truncate text-sm font-black">
                {pairState.partner.name || pairState.partner.user_id}
              </p>
            </div>

            {achievedMilestone && (
              <div className="shrink-0 rounded-full bg-[#f39a00] px-3 py-2 text-xs font-black text-white shadow-[0_10px_24px_rgba(107,47,19,0.12)]">
                {achievedMilestone}日
              </div>
            )}
          </div>

          <div className="mt-4 rounded-[22px] border border-[#f1d59a]/50 bg-white/90 px-4 py-4 text-center">
            <p className="text-xs font-black text-[#f39a00]">CURRENT STREAK</p>
            <p className="mt-1 text-4xl font-black text-[#6b2f13]">
              {streakCount}
              <span className="ml-1 text-base">日</span>
            </p>
            <p className="mt-2 text-xs font-bold text-[#6b2f13]/60">
              {nextMilestone ? `あと${Math.max(nextMilestone - streakCount, 0)}日` : "COMPLETE"}
            </p>
          </div>

          <div className="mt-4 rounded-[20px] border border-[#f1d59a]/50 bg-white/90 p-3">
            <p className="text-xs font-black text-[#f39a00]">REWARDS</p>
            <div className="mt-3 space-y-2 text-xs font-bold text-[#6b2f13]/75">
              {REWARDS.map((reward) => (
                <RewardRow
                  key={reward.days}
                  days={`${reward.days}日`}
                  text={reward.text}
                  achieved={streakCount >= reward.days}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function RewardRow({
  days,
  text,
  achieved,
}: {
  days: string;
  text: string;
  achieved: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[16px] px-3 py-2 ${
        achieved ? "bg-[#f39a00] text-white" : "bg-[#fff4d7]"
      }`}
    >
      <span className="shrink-0 font-black">{days}</span>
      <span className="text-right">{achieved ? "DONE" : text}</span>
    </div>
  );
}
