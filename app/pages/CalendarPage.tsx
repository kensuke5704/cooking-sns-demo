"use client";

import { useState } from "react";

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

  const getPhotos = (dateKey: string) => {
    const saved = localStorage.getItem(`daily-cooking-photos-${dateKey}`);
    return saved ? JSON.parse(saved) : {};
  };

  const hasPost = (day: number) => {
    const photos = getPhotos(getDateKey(day));
    return photos.prep || photos.cooking || photos.finished;
  };

  return (
    <div className="px-5 pt-6">
      <div className="bg-[#6b2f13] text-white rounded-[32px] p-6 shadow-md">
        <p className="text-sm opacity-90">料理カレンダー</p>
        <h1 className="text-3xl font-black mt-1">
          {year}年 {month + 1}月
        </h1>
      </div>

      <div className="grid grid-cols-7 gap-2 mt-6 text-center">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <div key={d} className="text-sm font-black text-[#6b2f13]">
            {d}
          </div>
        ))}

        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;

          const posted = hasPost(day);
          const dateKey = getDateKey(day);

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              className={`aspect-square rounded-2xl font-black text-sm flex flex-col items-center justify-center ${
                posted
                  ? "bg-[#6b2f13] text-white"
                  : "bg-white/40 text-[#6b2f13]"
              }`}
            >
              <span>{day}</span>
              {posted && <span className="text-[10px] mt-1">投稿</span>}
            </button>
          );
        })}
      </div>

      {selectedDate && <CalendarDetail dateKey={selectedDate} />}
    </div>
  );
}

function CalendarDetail({ dateKey }: { dateKey: string }) {
  const saved = localStorage.getItem(`daily-cooking-photos-${dateKey}`);
  const photos = saved ? JSON.parse(saved) : {};

  return (
    <div className="mt-6 bg-white/50 rounded-[32px] p-5">
      <h2 className="text-xl font-black text-[#6b2f13]">{dateKey} の記録</h2>

      {!photos.prep && !photos.cooking && !photos.finished ? (
        <p className="mt-3 text-sm font-bold text-[#6b2f13]/70">
          この日の投稿はありません
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 mt-4">
          <CalendarPhoto label="準備" src={photos.prep} />
          <CalendarPhoto label="調理" src={photos.cooking} />
          <CalendarPhoto label="完成" src={photos.finished} />
        </div>
      )}
    </div>
  );
}

function CalendarPhoto({ label, src }: { label: string; src?: string }) {
  if (!src) {
    return (
      <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/70 bg-white/20 flex items-center justify-center text-[#6b2f13] text-sm font-black">
        {label}
      </div>
    );
  }

  return (
    <div className="aspect-[3/4] bg-white p-2 pb-7 shadow-xl">
      <img src={src} alt={label} className="w-full h-full object-cover" />
      <p className="text-[11px] font-black text-[#6b2f13] mt-1 text-center">
        {label}
      </p>
    </div>
  );
}