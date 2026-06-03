import type { Post } from "../types/post";

export function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  return [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
}

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function hasBothPostedOnDate(
  posts: Post[],
  dateKey: string,
  myUserId: string,
  partnerUserId: string
) {
  const postedUserIds = new Set(
    posts
      .filter((post) => post.postDate === dateKey)
      .map((post) => post.userId)
  );

  return postedUserIds.has(myUserId) && postedUserIds.has(partnerUserId);
}

export function getPairStreak(
  posts: Post[],
  myUserId: string,
  partnerUserId: string
) {
  const myDates = new Set(
    posts
      .filter((post) => post.userId === myUserId)
      .map((post) => post.postDate)
  );

  const partnerDates = new Set(
    posts
      .filter((post) => post.userId === partnerUserId)
      .map((post) => post.postDate)
  );

  const today = new Date();
  const todayKey = toLocalDateKey(today);
  const shouldStartFromToday =
    myDates.has(todayKey) && partnerDates.has(todayKey);

  const baseDate = new Date(today);
  if (!shouldStartFromToday) {
    baseDate.setDate(today.getDate() - 1);
  }

  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - i);

    const dateKey = toLocalDateKey(date);

    if (myDates.has(dateKey) && partnerDates.has(dateKey)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export const PAIR_STREAK_MILESTONES = [50, 100, 365] as const;

export function getAchievedPairStreakMilestone(streakCount: number) {
  return [...PAIR_STREAK_MILESTONES]
    .reverse()
    .find((milestone) => streakCount >= milestone) ?? null;
}

export function getNextPairStreakMilestone(streakCount: number) {
  return PAIR_STREAK_MILESTONES.find((milestone) => streakCount < milestone) ?? null;
}
