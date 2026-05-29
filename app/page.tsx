"use client";

import { useState } from "react";

type Post = {
  id: number;
  userName: string;
  createdAt: string;
  prepPhoto?: string;
  cookingPhoto?: string;
  finishedPhoto?: string;
};

const posts: Post[] = [
  {
    id: 1,
    userName: "yuuna_8899",
    createdAt: new Date().toISOString(),
    cookingPhoto: "/images/cooking.jpg",
    finishedPhoto: "/images/finished.jpg",
  },
  {
    id: 2,
    userName: "miharu_0529",
    createdAt: new Date().toISOString(),
    cookingPhoto: "/images/finished_2.jpg",
    finishedPhoto: "/vercel.svg",
  },
];

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const visiblePosts = posts.filter((post) => {
    const created = new Date(post.createdAt).getTime();
    return Date.now() - created <= 24 * 60 * 60 * 1000;
  });

  return (
    <main className="min-h-screen bg-[#f7b18f] pb-28">
      <header className="relative bg-[#6b2f13] text-white px-5 pt-6 pb-5 rounded-b-[32px] shadow-md">
        <p className="text-sm opacity-90">今日の献立 ....</p>

        <button
          onClick={() => alert("準備中")}
          className="block w-full text-left mt-1 text-3xl font-black tracking-wider"
        >
          アスパラベーコン
        </button>

        <button
          onClick={() => alert("準備中")}
          className="absolute right-5 bottom-5 text-sm font-bold"
        >
          レシピを見る
        </button>
      </header>

      <section className="px-4 pt-6 space-y-6">
        {visiblePosts.map((post) => (
          <article
            key={post.id}
            className="bg-[#8a4728] rounded-[32px] overflow-hidden shadow-lg"
          >
            <div className="px-5 py-3 text-white text-lg font-bold">
              {post.userName}
            </div>

            <div className="bg-[#f7b18f] px-4 py-4 grid grid-cols-3 gap-3">
              <PhotoBox label="準備" src={post.prepPhoto} onClick={setSelectedImage} />
              <PhotoBox label="調理" src={post.cookingPhoto} onClick={setSelectedImage} />
              <PhotoBox label="完成" src={post.finishedPhoto} onClick={setSelectedImage} />
            </div>

            <div className="h-9 bg-[#8a4728]" />
          </article>
        ))}
      </section>

      <BottomNav />

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-4 w-full max-w-sm"
          >
            <img
              src={selectedImage}
              alt="拡大画像"
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}

function PhotoBox({
  src,
  label,
  onClick,
}: {
  src?: string;
  label: string;
  onClick: (src: string) => void;
}) {
  if (!src) {
    return (
      <div className="aspect-[3/4] rounded-xl border-2 border-white/70 bg-white/20 flex items-center justify-center text-white text-sm font-bold">
        {label}
      </div>
    );
  }

  return (
    <button
      onClick={() => onClick(src)}
      className="aspect-[3/4] rounded-xl overflow-hidden bg-white shadow"
    >
      <img
        src={src}
        alt={label}
        className="w-full h-full object-contain p-4"
      />
    </button>
  );
}

function BottomNav() {
  const items = [
    ["⌂", "ホーム"],
    ["👥", "友だち"],
    ["📷", "カメラ"],
    ["□", "カレンダー"],
    ["≡", "記事"],
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#ffe88a] px-3 pt-3 pb-5 flex justify-around rounded-t-[32px] shadow-[0_-4px_12px_rgba(0,0,0,0.12)]">
      {items.map(([icon, label]) => (
        <button
          key={label}
          onClick={() => {
            if (label !== "ホーム") alert("準備中");
          }}
          className="flex flex-col items-center text-[#f39a00] font-black"
        >
          <span className="text-3xl leading-none">{icon}</span>
          <span className="text-[11px] mt-1">{label}</span>
        </button>
      ))}
    </nav>
  );
}