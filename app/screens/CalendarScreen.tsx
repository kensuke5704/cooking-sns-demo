"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarDetail from "../components/calendar/CalendarDetail";
import CalendarPopup from "../components/calendar/CalendarPopup";
import PairCalendarBackButton from "../components/calendar/PairCalendarBackButton";
import { useCalendarPosts } from "../hooks/calendar/useCalendarPosts";
import { usePairCalendar } from "../hooks/calendar/usePairCalendar";
import { getCurrentUser } from "../lib/auth";
import {
  getAchievedPairStreakMilestone,
  getMonthDays,
  getNextPairStreakMilestone,
  getPairStreak,
  hasBothPostedOnDate,
} from "../lib/calendar";
import type { CalendarPopupState } from "../types/calendar";
import { supabase } from "../lib/supabase";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [popup, setPopup] = useState<CalendarPopupState>(null);

  const currentUser = getCurrentUser();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const days = getMonthDays(year, month);

  function showPopup(title: string, message?: string) {
    setPopup({ title, message });
  }

  function showConfirmPopup(popupState: NonNullable<CalendarPopupState>) {
    setPopup(popupState);
  }

  const { posts, pairPosts, loadCalendarPosts, loadPairPosts, clearPairPosts } =
    useCalendarPosts(currentUser, showPopup);

  const {
    pairState,
    pairPartners,
    codeInput,
    isPairCalendarOpen,
    setCodeInput,
    loadPairStatus,
    submitPairCode,
    openPairCalendar,
    deletePair,
    cancelPendingCode,
    resetPairCalendarView,
  } = usePairCalendar({
    currentUser,
    loadPairPosts,
    clearPairPosts,
    showPopup,
    showConfirmPopup,
    clearSelectedDate: () => setSelectedDate(null),
  });

  const activePosts = isPairCalendarOpen ? pairPosts : posts;

  const streakCount = useMemo(() => {
    if (!currentUser || !pairState.partner) return 0;
    return getPairStreak(pairPosts, currentUser.userId, pairState.partner.user_id);
  }, [currentUser, pairPosts, pairState.partner]);

  const achievedMilestone = getAchievedPairStreakMilestone(streakCount);
  const nextMilestone = getNextPairStreakMilestone(streakCount);

  useEffect(() => {
    loadCalendarPosts();
    loadPairStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedDate || activePosts.length === 0) return;

    const latestPostDate = activePosts
      .map((post) => post.postDate)
      .filter(Boolean)
      .sort()
      .at(-1);

    if (latestPostDate) {
      setSelectedDate(latestPostDate);
    }
  }, [activePosts, selectedDate]);

  useEffect(() => {
    if (!currentUser || !pairState.partner || !achievedMilestone) return;

    const storageKey = `pair-streak-achievement-${currentUser.userId}-${pairState.code}-${achievedMilestone}`;
    if (localStorage.getItem(storageKey)) return;

    localStorage.setItem(storageKey, "shown");
    showPopup(
      `${achievedMilestone}日連続を達成しました`,
      `${pairState.partner.name || pairState.partner.user_id}さんとの2人カレンダーで特典を獲得しました。`
    );

    supabase
      .from("notifications")
      .insert({
        to_user_id: currentUser.userId,
        from_user_id: currentUser.userId,
        from_user_name: currentUser.userId,
        type: "pair",
        message: `2人カレンダーで${achievedMilestone}日連続を達成しました`,
      })
      .then(({ error }) => {
        if (error) {
          console.error("達成通知作成エラー:", error);
        }
      });
  }, [achievedMilestone, currentUser, pairState.code, pairState.partner]);

  function goPrevMonth() {
    setSelectedDate(null);
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setSelectedDate(null);
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function getDateKey(day: number) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  function getPostsByDate(dateKey: string) {
    return activePosts.filter((post) => post.postDate === dateKey);
  }

  function hasPairStar(day: number) {
    if (!isPairCalendarOpen || !currentUser || !pairState.partner) return false;

    return hasBothPostedOnDate(
      pairPosts,
      getDateKey(day),
      currentUser.userId,
      pairState.partner.user_id
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#faa831] text-[#3f2116]">
      <div className="relative mx-auto h-[100dvh] w-full max-w-md overflow-hidden px-[18px] pt-[28px] pb-[86px]">
        <header className="mb-[10px] flex h-[20px] items-start justify-between px-[3px]">
          <h1 className="text-[18px] font-black leading-none">カレンダー</h1>
          <div className="absolute right-[18px] top-[17px] flex items-center gap-2">
            {isPairCalendarOpen && <PairCalendarBackButton onClick={resetPairCalendarView} />}
            <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#fff8e6] text-[13px] font-black text-[#3f2116] shadow-[0_6px_14px_rgba(63,33,22,0.12)] ring-1 ring-white/70">
              <EnvelopeLineIcon />
            </span>
            <img
              src={currentUser?.iconUrl || "/images/user1-icon.jpg"}
              alt="ユーザー"
              className="h-[32px] w-[32px] rounded-full object-cover ring-2 ring-[#fff8e6]"
            />
          </div>
        </header>

        <section className="rounded-[8px] bg-[#fdf7f0] p-[10px] shadow-[0_12px_28px_rgba(63,33,22,0.14)] ring-1 ring-white/70">
          <div className="flex h-[30px] -translate-y-px items-center justify-between">
            <button onClick={goPrevMonth} className="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#fff8e6] text-[#3f2116] ring-1 ring-[#dfc79d]/75">
              <ChevronLineIcon direction="left" />
            </button>
            <h2 className="text-[13px] font-black tracking-[0.02em]">{year}年 {month + 1}月</h2>
            <button onClick={goNextMonth} className="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#fff8e6] text-[#3f2116] ring-1 ring-[#dfc79d]/75">
              <ChevronLineIcon direction="right" />
            </button>
          </div>
          <div className="mx-[2px] mt-[6px] grid grid-cols-7 overflow-hidden rounded-[7px] border border-[#f4e8da] bg-[#fdf7f0] text-center">
            {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
              <div key={d} className={`flex h-[25px] items-center justify-center border-b border-[#f4e8da] text-[8px] font-black leading-none ${d === "日" ? "text-red-600" : d === "土" ? "text-blue-600" : ""}`}>{d}</div>
            ))}
            {days.map((day, index) => {
              const column = index % 7;
              if (!day) return <div key={`empty-${index}`} className={`${column > 0 ? "border-l" : ""} h-[33px] border-t border-[#f4e8da] bg-[#fdf7f0]/72`} />;
              const dateKey = getDateKey(day);
              const dayPosts = getPostsByDate(dateKey);
              const selected = selectedDate === dateKey;
              const posted = dayPosts.length > 0;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  className={`relative flex h-[33px] flex-col items-center justify-start border-t border-[#f4e8da] pt-[3px] text-[8px] font-black leading-none ${column > 0 ? "border-l" : ""} ${selected ? "rounded-[6px] bg-[#0f6a47] text-[#fff8e6]" : "bg-[#fdf7f0]/72"}`}
                >
                  {hasPairStar(day) && <span className="absolute -right-0.5 -top-0.5 text-[9px] text-[#f4a72d]">★</span>}
                  <span>{day}</span>
                  {posted && (
                    dayPosts[0]?.finishedPhoto || dayPosts[0]?.cookingPhoto || dayPosts[0]?.prepPhoto ? (
                      <img src={dayPosts[0].finishedPhoto || dayPosts[0].cookingPhoto || dayPosts[0].prepPhoto} alt="" className="mt-[3px] h-[14px] w-[14px] rounded-full object-cover ring-1 ring-[#dfc79d]" />
                    ) : (
                      <span className="mt-[3px] h-[4px] w-[4px] rounded-full bg-[#f4a72d]" />
                    )
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-[8px] rounded-[8px] bg-[#fdf7f0] p-[10px] shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/70">
          <h2 className="text-[11px] font-black">今月のつながり</h2>
          {pairPartners.length > 0 ? (
            <button
              type="button"
              onClick={() => openPairCalendar(pairPartners[0])}
              className="mt-[7px] flex h-[45px] w-full flex-col items-center justify-center rounded-[8px] bg-[#fff8e6]/45 px-[22px] text-center"
            >
              <span className="flex items-start justify-center">
                <span className="flex flex-col items-center">
                  <img src={currentUser?.iconUrl || "/images/user1-icon.jpg"} alt="自分" className="h-[34px] w-[34px] rounded-full object-cover ring-2 ring-white" />
                  <span className="mt-[2px] max-w-[58px] truncate text-[9px] font-black leading-none">
                    {currentUser?.name || currentUser?.userId || "あなた"}
                  </span>
                </span>
                <span className="relative mx-[14px] mt-[13px] h-px w-[104px] border-t-2 border-dashed border-[#d8a565]">
                  <span className="absolute left-1/2 top-[-13px] -translate-x-1/2 text-[17px] text-[#f4a72d]">♡</span>
                </span>
                <span className="flex flex-col items-center">
                  <img src={pairPartners[0].partner.icon_url || "/images/user2-icon.jpg"} alt={pairPartners[0].partner.name || "ペア相手"} className="h-[34px] w-[34px] rounded-full object-cover ring-2 ring-white" />
                  <span className="mt-[2px] max-w-[58px] truncate text-[9px] font-black leading-none">
                    {pairPartners[0].partner.name || pairPartners[0].partner.user_id}
                  </span>
                </span>
              </span>
              <span className="mt-[1px] text-[7px] font-black leading-none text-[#3f2116]/70">
                {streakCount > 0 ? `${streakCount}日連続で記録しています` : "一緒に記録した日が増えています"}
              </span>
            </button>
          ) : (
            <div className="mt-[7px] rounded-[8px] border border-[#dfc79d]/65 bg-[#fff8e6]/75 p-2 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0f6a47]">−</div>
              <p className="mt-3 text-[12px] font-black">まだペアはありません</p>
              <p className="mt-1 text-[10px] font-bold text-[#3f2116]/60">同じコードを2人で入力すると、2人だけの連続投稿カレンダーを作れます。</p>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <input value={codeInput} onChange={(event) => setCodeInput(event.target.value)} placeholder="コード" className="min-w-0 rounded-[6px] border border-[#dfc79d] bg-[#fffaf2] px-3 py-2 text-[11px] font-bold outline-none" />
                <button onClick={submitPairCode} className="rounded-full bg-[#0f6a47] px-4 py-2 text-[11px] font-black text-[#fff8e6]">登録</button>
              </div>
            </div>
          )}
        </section>

        {selectedDate && (
          <CalendarDetail dateKey={selectedDate} posts={getPostsByDate(selectedDate)} />
        )}
      </div>
      <CalendarPopup popup={popup} onClose={() => setPopup(null)} />
    </main>
  );
}

function EnvelopeLineIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[15px] w-[15px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="6.5" width="16" height="12" rx="2.2" />
      <path d="m5.5 8.5 6.5 5 6.5-5" />
    </svg>
  );
}

function ChevronLineIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[16px] w-[16px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "left" ? <path d="m15 6-6 6 6 6" /> : <path d="m9 6 6 6-6 6" />}
    </svg>
  );
}
