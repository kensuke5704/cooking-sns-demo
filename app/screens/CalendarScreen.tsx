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

  function showPopup(title: string, message: string) {
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
    <ScreenShell
      label={isPairCalendarOpen ? "PAIR CALENDAR" : "CALENDAR"}
      title={isPairCalendarOpen ? "2人カレンダー" : "カレンダー"}
      subtitle={isPairCalendarOpen ? "2人とも投稿した日と連続日数を確認できます。" : "投稿した日を月ごとに確認できます。"}
      action={
        isPairCalendarOpen && pairState.partner ? (
          <PairCalendarBackButton onClick={resetPairCalendarView} />
        ) : undefined
      }
    >
        <CalendarHeader
          year={year}
          month={month}
          isPairCalendarOpen={isPairCalendarOpen}
          pairState={pairState}
          streakCount={streakCount}
          achievedMilestone={achievedMilestone}
          nextMilestone={nextMilestone}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
        />

        <CalendarGrid
          days={days}
          getDateKey={getDateKey}
          getPostsByDate={getPostsByDate}
          hasPairStar={hasPairStar}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {selectedDate && (
          <CalendarDetail dateKey={selectedDate} posts={getPostsByDate(selectedDate)} />
        )}

        {!isPairCalendarOpen && (
          <PairCodeSection
            pairState={pairState}
            pairPartners={pairPartners}
            codeInput={codeInput}
            onCodeInputChange={setCodeInput}
            onSubmitCode={submitPairCode}
            onOpenPairCalendar={openPairCalendar}
            onDeletePair={deletePair}
            onCancelPendingCode={cancelPendingCode}
          />
        )}

      <CalendarPopup popup={popup} onClose={() => setPopup(null)} />
    </ScreenShell>
  );
}
