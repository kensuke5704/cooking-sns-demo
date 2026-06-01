"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../lib/auth";
import { loadPostsData } from "../lib/posts";
import type { Post } from "../types/post";

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  return [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [calendarDate, setCalendarDate] = useState(new Date());

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const days = getMonthDays(year, month);

  const goPrevMonth = () => {
    setSelectedDate(null);
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setSelectedDate(null);
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  useEffect(() => {
    async function loadCalendarPosts() {
      const currentUser = getCurrentUser();

      if (!currentUser) return;

      try {
        const loadedPosts = await loadPostsData(currentUser.userId);

        const myPosts = loadedPosts.filter(
          (post) => post.userId === currentUser.userId
        );

        setPosts(myPosts);
      } catch (error) {
        console.error("カレンダー投稿取得エラー:", error);
      }
    }

    loadCalendarPosts();
  }, []);

  const getDateKey = (day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const getPostsByDate = (dateKey: string) => {
    return posts.filter((post) => post.postDate === dateKey);
  };

  const hasPost = (day: number) => {
    return getPostsByDate(getDateKey(day)).length > 0;
  };

  return (
    <main className="min-h-screen bg-[#f8b72a] px-5 pt-6 pb-28 text-[#6b2f13]">
      <div className="mx-auto max-w-md">
        <section className="rounded-[36px] bg-white p-6 shadow-xl">
          <p className="text-xs font-black text-[#f39a00]">
            COOKING CALENDAR
          </p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrevMonth}
              className="rounded-full bg-[#fff4d7] px-4 py-2 text-sm font-black"
            >
              ←
            </button>

            <h1 className="text-3xl font-black">
              {year}年 {month + 1}月
            </h1>

            <button
              type="button"
              onClick={goNextMonth}
              className="rounded-full bg-[#fff4d7] px-4 py-2 text-sm font-black"
            >
              →
            </button>
          </div>

          <p className="mt-3 text-sm font-bold text-[#6b2f13]/60">
            投稿した日は色付きで表示されます。
          </p>
        </section>

        <section className="mt-5 rounded-[36px] bg-white p-4 shadow-xl">
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

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-sm font-black transition ${
                    posted
                      ? "bg-[#6b2f13] text-white"
                      : "bg-[#fff4d7] text-[#6b2f13]"
                  } ${selected ? "ring-4 ring-[#f39a00]/40" : ""}`}
                >
                  <span>{day}</span>
                  {posted && (
                    <span className="mt-1 text-[9px]">
                      {dayPosts.length}件
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {selectedDate && (
          <CalendarDetail dateKey={selectedDate} posts={getPostsByDate(selectedDate)} />
        )}
      </div>
    </main>
  );
}

function CalendarDetail({
  dateKey,
  posts,
}: {
  dateKey: string;
  posts: Post[];
}) {
  return (
    <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
      <p className="text-xs font-black text-[#f39a00]">SELECTED DAY</p>

      <h2 className="mt-1 text-2xl font-black">{dateKey}</h2>

      {posts.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-[#fff4d7] px-4 py-4 text-sm font-bold text-[#6b2f13]/70">
          この日の投稿はありません
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {posts.map((post) => (
            <CalendarPost key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

function CalendarPost({ post }: { post: Post }) {
  return (
    <div className="rounded-[28px] bg-[#fff4d7] p-4">
      <div className="flex items-center gap-3">
        <img
          src={post.userIcon || "/images/user1-icon.jpg"}
          alt={post.userName}
          className="h-10 w-10 rounded-full object-cover"
        />

        <div>
          <p className="text-sm font-black">{post.userName}</p>
          {post.dishName && (
            <p className="text-xs font-bold text-[#6b2f13]/70">
              {post.dishName}
            </p>
          )}
        </div>
      </div>

      {post.memo && (
        <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold">
          {post.memo}
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <CalendarPhoto label="準備" src={post.prepPhoto} />
        <CalendarPhoto label="調理" src={post.cookingPhoto} />
        <CalendarPhoto label="完成" src={post.finishedPhoto} />
      </div>
    </div>
  );
}

function CalendarPhoto({ label, src }: { label: string; src?: string }) {
  if (!src) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border-2 border-dashed border-[#f1d59a] bg-white/60 text-sm font-black text-[#6b2f13]/40">
        {label}
      </div>
    );
  }

  return (
    <div className="bg-white p-2 pb-6 shadow-xl">
      <img src={src} alt={label} className="aspect-[3/4] w-full object-cover" />
      <p className="mt-1 text-center text-[11px] font-black text-[#6b2f13]">
        {label}
      </p>
    </div>
  );
}