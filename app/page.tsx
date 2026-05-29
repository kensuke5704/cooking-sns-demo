"use client";

import { useState } from "react";

type Post = {
  id: number;
  userName: string;
  menuName: string;
  createdAt: string;
  prepPhoto?: string;
  cookingPhoto?: string;
  finishedPhoto?: string;
};

const posts: Post[] = [
  {
    id: 1,
    userName: "yuuna_8899",
    menuName: "アスパラベーコン",
    createdAt: new Date().toISOString(),
    prepPhoto: "/window.svg",
    cookingPhoto: "/globe.svg",
  },
  {
    id: 2,
    userName: "miharu_0529",
    menuName: "アスパラベーコン",
    createdAt: new Date().toISOString(),
    cookingPhoto: "/file.svg",
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
    <main className="min-h-screen bg-[#ffc7aa] pb-24">
      <header className="sticky top-0 z-10 bg-[#6b2d12] text-white px-4 py-4 shadow">
        <p className="text-sm opacity-80">今日の献立 ....</p>

        <button
          onClick={() => alert("準備中")}
          className="w-full text-center text-3xl font-bold tracking-widest mt-1"
        >
          アスパラベーコン
        </button>

        <button
          onClick={() => alert("準備中")}
          className="absolute right-4 bottom-3 text-sm"
        >
          レシピを見る ＞
        </button>
      </header>

      <section className="px-4 py-6 space-y-6">
        {visiblePosts.map((post) => (
          <article
            key={post.id}
            className="bg-[#8a4a2a] rounded-3xl overflow-hidden shadow"
          >
            <div className="px-5 py-3 text-white font-bold">
              {post.userName}
            </div>

            <div className="bg-[#ffc7aa] p-4 grid grid-cols-3 gap-3">
              <PhotoBox label="準備" src={post.prepPhoto} onClick={setSelectedImage} />
              <PhotoBox label="調理" src={post.cookingPhoto} onClick={setSelectedImage} />
              <PhotoBox label="完成" src={post.finishedPhoto} onClick={setSelectedImage} />
            </div>

            <div className="h-10 bg-[#8a4a2a]" />
          </article>
        ))}
      </section>

      <BottomNav />

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
        >
          <div className="bg-white p-4 rounded-xl max-w-md w-full">
            <img
              src={selectedImage}
              alt="拡大画像"
              className="w-full rounded-lg object-cover"
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
      <div className="aspect-square border-2 border-dashed border-white/70 bg-white/20 flex items-center justify-center text-white/80 text-sm">
        {label}
      </div>
    );
  }

  return (
    <button onClick={() => onClick(src)} className="aspect-square">
      <img
        src={src}
        alt={label}
        className="w-full h-full object-contain bg-white rounded-md shadow p-4"
      />
    </button>
  );
}

function BottomNav() {
  const items = [
    ["🏠", "ホーム"],
    ["👥", "友だち"],
    ["📷", "カメラ"],
    ["📅", "カレンダー"],
    ["📄", "記事"],
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#ffe89a] px-3 py-2 flex justify-around rounded-t-3xl">
      {items.map(([icon, label]) => (
        <button
          key={label}
          onClick={() => {
            if (label !== "ホーム") alert("準備中");
          }}
          className="flex flex-col items-center text-[#ff9800] font-bold"
        >
          <span className="text-3xl">{icon}</span>
          <span className="text-xs">{label}</span>
        </button>
      ))}
    </nav>
  );
}