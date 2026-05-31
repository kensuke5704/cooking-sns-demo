"use client";

import { useEffect, useState } from "react";
import CameraPost from "./camera";

type Post = {
  id: number;
  userName: string;
  userIcon: string;
  createdAt: string;
  prepPhoto?: string;
  cookingPhoto?: string;
  finishedPhoto?: string;
};

const APP_VERSION = "2026-05-31 14:59";

const posts: Post[] = [
  {
    id: 1,
    userName: "yuuna_8899",
    userIcon: "/images/user1-icon.jpg",
    createdAt: new Date().toISOString(),
    cookingPhoto: "/images/cooking.jpg",
    finishedPhoto: "/images/finished.jpg",
  },
  {
    id: 2,
    userName: "miharu_0529",
    userIcon: "/images/user2-icon.jpg",
    createdAt: new Date().toISOString(),
    cookingPhoto: "/images/cooking_2.jpg",
    finishedPhoto: "/images/finished_2.jpg",
  },
];

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [myPost, setMyPost] = useState<Post | null>(null);
  const [currentTab, setCurrentTab] = useState("ホーム");

  useEffect(() => {
    if (currentTab !== "ホーム") return;
  
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem(`daily-cooking-photos-${today}`);
  
    if (!saved) {
      setMyPost(null);
      return;
    }
  
    const photos = JSON.parse(saved);
  
    setMyPost({
      id: 999,
      userName: "あなた",
      userIcon: "/images/user1-icon.jpg",
      createdAt: new Date().toISOString(),
      prepPhoto: photos.prep,
      cookingPhoto: photos.cooking,
      finishedPhoto: photos.finished,
    });
  }, [currentTab]);

  const allPosts = myPost ? [myPost, ...posts] : posts;

  const visiblePosts = allPosts.filter((post) => {
    const created = new Date(post.createdAt).getTime();
    return Date.now() - created <= 24 * 60 * 60 * 1000;
  });

  if (currentTab === "カメラ") {
    return (
      <>
        <CameraPost />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </>
    );
  }

  if (currentTab === "友だち") {
    return (
      <main className="min-h-screen bg-[#f7b18f] pb-28">
        <EmptyPage title="友だち" />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </main>
    );
  }
  
  if (currentTab === "カレンダー") {
    return (
      <main className="min-h-screen bg-[#f7b18f] pb-28">
        <EmptyPage title="カレンダー" />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </main>
    );
  }
  
  if (currentTab === "記事") {
    return (
      <main className="min-h-screen bg-[#f7b18f] pb-28">
        <EmptyPage title="記事" />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7b18f] pb-28">
      <div className="bg-red-600 text-white text-center text-xs py-1">
        最終更新: {APP_VERSION}
      </div>
      <header className="sticky top-0 z-50 bg-[#6b2f13] text-white px-5 pt-6 pb-5 rounded-b-[32px] shadow-md">
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
            <div className="px-5 py-3 flex items-center gap-3 text-white">
              <img
                src={post.userIcon}
                alt={post.userName}
                className="w-10 h-10 rounded-full object-cover border-2 border-white"
              />
              <span className="text-lg font-bold">{post.userName}</span>
            </div>

            <div className="bg-[#f7b18f] px-4 py-5">
              <StackedPhotos post={post} onClick={setSelectedImage} />
            </div>

            <div className="h-9 bg-[#8a4728]" />
          </article>
        ))}
      </section>

      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-4 w-full max-w-sm"
          >
            <img
              src={selectedImage}
              alt="拡大画像"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}

function StackedPhotos({
  post,
  onClick,
}: {
  post: Post;
  onClick: (src: string) => void;
}) {
  const photos = [
    {
      label: "準備",
      src: post.prepPhoto,
      className: "left-2 top-8 rotate-[-8deg] z-10",
    },
    {
      label: "調理",
      src: post.cookingPhoto,
      className: "left-1/2 -translate-x-1/2 top-0 rotate-[2deg] z-20",
    },
    {
      label: "完成",
      src: post.finishedPhoto,
      className: "right-2 top-8 rotate-[8deg] z-30",
    },
  ];

  return (
    <div className="relative h-64 z-10">
      {photos.map((photo) => (
        <div
          key={photo.label}
          onClick={() => photo.src && onClick(photo.src)}
          className={`absolute w-[42%] aspect-[3/4] cursor-pointer ${photo.className}`}
        >
          <PhotoBox label={photo.label} src={photo.src} onClick={onClick} />
        </div>
      ))}
    </div>
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
      <div className="w-full h-full rounded-xl border-2 border-dashed border-white/70 bg-white/20 flex items-center justify-center text-white text-sm font-bold">
        {label}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(src)}
      onPointerUp={() => onClick(src)}
      className="w-full h-full bg-white p-2 pb-8 shadow-xl cursor-pointer touch-manipulation select-none"
    >
      <img
        src={src}
        alt={label}
        draggable={false}
        className="w-full h-full object-cover pointer-events-none select-none"
      />
    </div>
  );
}

function EmptyPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/40 border-2 border-dashed border-white/70 rounded-[32px] p-8 text-center">
        <h1 className="text-3xl font-black text-[#6b2f13]">{title}</h1>
        <p className="mt-3 text-sm font-bold text-[#6b2f13]/70">
          まだコンテンツはありません
        </p>
      </div>
    </div>
  );
}

function BottomNav({
  currentTab,
  setCurrentTab,
}: {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}) {
  const items = [
    ["/images/home-icon.png", "ホーム"],
    ["/images/friends-icon.png", "友だち"],
    ["/images/camera-icon.png", "カメラ"],
    ["/images/calendar-icon.png", "カレンダー"],
    ["/images/article-icon.png", "記事"],
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[999] bg-[#ffe88a] px-3 pt-3 pb-5 flex justify-around rounded-t-[32px] shadow-[0_-4px_12px_rgba(0,0,0,0.12)]">
      {items.map(([iconSrc, label]) => (
        <button
          key={label}
          onClick={() => setCurrentTab(label)}
          className="flex flex-col items-center font-black text-[#f39a00]"
        >
          <img src={iconSrc} alt={label} className="w-8 h-8 object-contain" />
          <span className="text-[11px] mt-1">{label}</span>
        </button>
      ))}
    </nav>
  );
}