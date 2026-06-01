"use client";

import { useState } from "react";

type CalendarPhotos = {
  prep?: string;
  cooking?: string;
  finished?: string;
  dishName?: string;
  memo?: string;
};

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

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const days = getMonthDays(year, month);

  const getDateKey = (day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const getPhotos = (dateKey: string): CalendarPhotos => {
    const saved = localStorage.getItem(`daily-cooking-photos-${dateKey}`);
    return saved ? JSON.parse(saved) : {};
  };

  const hasPost = (day: number) => {
    const photos = getPhotos(getDateKey(day));
    return photos.prep || photos.cooking || photos.finished;
  };

  return (
    <main className="min-h-screen bg-[#f8b72a] px-5 pt-6 pb-28 text-[#6b2f13]">
      <div className="mx-auto max-w-md">
        <section className="rounded-[36px] bg-white p-6 shadow-xl">
          <p className="text-xs font-black text-[#f39a00]">
            COOKING CALENDAR
          </p>

          <h1 className="mt-1 text-3xl font-black">
            {year}年 {month + 1}月
          </h1>

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

              const posted = hasPost(day);
              const dateKey = getDateKey(day);
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
                  {posted && <span className="mt-1 text-[9px]">記録</span>}
                </button>
              );
            })}
          </div>
        </section>

        {selectedDate && <CalendarDetail dateKey={selectedDate} />}
      </div>
    </main>
  );
}

function CalendarDetail({ dateKey }: { dateKey: string }) {
  const saved = localStorage.getItem(`daily-cooking-photos-${dateKey}`);
  const photos: CalendarPhotos = saved ? JSON.parse(saved) : {};

  const hasPhoto = photos.prep || photos.cooking || photos.finished;

  return (
    <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
      <p className="text-xs font-black text-[#f39a00]">SELECTED DAY</p>

      <h2 className="mt-1 text-2xl font-black">{dateKey}</h2>

      {!hasPhoto ? (
        <p className="mt-4 rounded-2xl bg-[#fff4d7] px-4 py-4 text-sm font-bold text-[#6b2f13]/70">
          この日の投稿はありません
        </p>
      ) : (
        <>
          {photos.dishName && (
            <p className="mt-4 text-lg font-black">{photos.dishName}</p>
          )}

          {photos.memo && (
            <p className="mt-2 rounded-2xl bg-[#fff4d7] px-4 py-3 text-sm font-bold">
              {photos.memo}
            </p>
          )}

          <div className="mt-5 grid grid-cols-3 gap-3">
            <CalendarPhoto label="準備" src={photos.prep} />
            <CalendarPhoto label="調理" src={photos.cooking} />
            <CalendarPhoto label="完成" src={photos.finished} />
          </div>
        </>
      )}
    </section>
  );
}

function CalendarPhoto({ label, src }: { label: string; src?: string }) {
  if (!src) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border-2 border-dashed border-[#f1d59a] bg-[#fff4d7] text-sm font-black text-[#6b2f13]/50">
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