"use client";

import { useEffect, useState } from "react";
import CameraPost from "./camera";
import BottomNav from "./components/BottomNav";
import EmptyPage from "./components/EmptyPage";
import PostCard from "./components/PostCard";
import RecipePage from "./pages/RecipePage";
import CalendarPage from "./pages/CalendarPage";
import type { Post } from "./types/post";

const APP_VERSION = "2026-05-31 15:30";

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

    if (!photos.prep && !photos.cooking && !photos.finished) {
      setMyPost(null);
      return;
    }

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

  if (currentTab === "友だち" || currentTab === "記事") {
    return (
      <main className="min-h-screen bg-[#f7b18f] pb-28">
        <EmptyPage title={currentTab} />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </main>
    );
  }

  if (currentTab === "レシピ") {
    return (
      <main className="min-h-screen bg-[#f7b18f] pb-28">
        <RecipePage />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </main>
    );
  }

  if (currentTab === "カレンダー") {
    return (
      <main className="min-h-screen bg-[#f7b18f] pb-28">
        <CalendarPage />
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
        <p className="text-sm opacity-90">今日の献立</p>

        <button
          onClick={() => setCurrentTab("レシピ")}
          className="block w-full text-left mt-1 text-3xl font-black tracking-wider"
        >
          アスパラベーコン
        </button>
      </header>

      <section className="px-4 pt-6 space-y-6">
        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onImageClick={setSelectedImage}
          />
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