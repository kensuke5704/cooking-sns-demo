"use client";

import { useEffect, useMemo, useState } from "react";
import ScreenShell from "../components/common/ScreenShell";
import CalendarDetail from "../components/calendar/CalendarDetail";
import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarPopup from "../components/calendar/CalendarPopup";
import PairCalendarBackButton from "../components/calendar/PairCalendarBackButton";
import PairCodeSection from "../components/calendar/PairCodeSection";
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
    <main className="min-h-[100dvh] bg-[#f4a72d] text-[#3f2116]">
      <div className="relative mx-auto h-[100dvh] w-full max-w-md overflow-hidden">
        <img
          src="/design-targets/calendar-reference-shell.png"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-fill"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={goPrevMonth}
          className="absolute left-[7%] top-[8.7%] h-8 w-8 opacity-0"
          aria-label="前の月"
        />
        <button
          type="button"
          onClick={goNextMonth}
          className="absolute right-[7%] top-[8.7%] h-8 w-8 opacity-0"
          aria-label="次の月"
        />

        <div className="absolute left-[5.5%] right-[5.5%] top-[19.5%] grid h-[226px] grid-cols-7 grid-rows-6">
          {days.map((day, index) => {
            if (!day) return <span key={`empty-${index}`} />;

            const dateKey = getDateKey(day);

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className="h-full w-full opacity-0"
                aria-label={`${day}日`}
              />
            );
          })}
        </div>

        {selectedDate && (
          <div className="absolute left-[7%] right-[7%] top-[73%] rounded-[8px] bg-[#fff8e6]/95 p-2 shadow-[0_8px_18px_rgba(63,33,22,0.12)]">
            <p className="text-[11px] font-black text-[#3f2116]">
              {selectedDate.slice(5).replace("-", "月")}日の食卓
            </p>
            <p className="mt-1 text-[10px] font-bold text-[#3f2116]/60">
              {getPostsByDate(selectedDate).length}件の投稿
            </p>
          </div>
        )}

        {!isPairCalendarOpen && (
          <button
            type="button"
            onClick={submitPairCode}
            className="absolute right-[7%] top-[58.3%] h-[28px] w-[24%] opacity-0"
            aria-label="ペアコードを登録"
          />
        )}
      </div>
      <CalendarPopup popup={popup} onClose={() => setPopup(null)} />
    </main>
  );
}
