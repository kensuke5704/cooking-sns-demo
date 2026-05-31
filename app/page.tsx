"use client";

import { useEffect, useState } from "react";
import CameraPost from "./camera";
import BottomNav from "./components/BottomNav";
import EmptyPage from "./components/EmptyPage";
import PostCard from "./components/PostCard";
import RecipePage from "./pages/RecipePage";
import CalendarPage from "./pages/CalendarPage";
import AuthPage from "./pages/AuthPage";
import FriendsPage from "./pages/FriendsPage";
import type { Post } from "./types/post";
import { getCurrentUser } from "./utils/auth";
import ProfilePage from "./pages/ProfilePage";

const APP_VERSION = "2026-05-31 fixed";

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
  const [authVersion, setAuthVersion] = useState(0);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, [authVersion]);

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
      userName: currentUser?.name || "あなた",
      userIcon: (currentUser as any)?.userIcon || "/images/user1-icon.jpg",
      createdAt: new Date().toISOString(),
      prepPhoto: photos.prep,
      cookingPhoto: photos.cooking,
      finishedPhoto: photos.finished,
      dishName: photos.dishName,
      memo: photos.memo,
    });
  }, [currentTab]);

  if (!currentUser) {
    return (
      <AuthPage
        onAuthChange={() => {
          setAuthVersion((v) => v + 1);
        }}
      />
    );
  }

  if (currentTab === "カメラ") {
    return <CameraPost onBack={() => setCurrentTab("ホーム")} />;
  }

  if (currentTab === "レシピ") {
    return (
      <>
        <RecipePage />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </>
    );
  }

  if (currentTab === "カレンダー") {
    return (
      <>
        <CalendarPage />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </>
    );
  }

  if (currentTab === "記事") {
    return (
      <>
        <EmptyPage title="記事" />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </>
    );
  }

  if (currentTab === "プロフィール") {
    return (
      <>
        <ProfilePage
          onProfileChange={() => {
            setAuthVersion((v) => v + 1);
          }}
        />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </>
    );
  }

  const allPosts = myPost ? [myPost, ...posts] : posts;

  const visiblePosts = allPosts.filter((post) => {
    const created = new Date(post.createdAt).getTime();
    return Date.now() - created <= 24 * 60 * 60 * 1000;
  });

  return (
    <main className="min-h-screen bg-[#f8b72a] pb-28 text-[#6b2f13]">
      <div className="px-5 pt-5">
        <p className="text-xs font-black opacity-70">最終更新: {APP_VERSION}</p>

        <div
          className="mt-4 w-full overflow-hidden rounded-[36px] bg-white shadow-xl"
        >
          <div className="bg-[#f39a00] px-5 py-2 text-left">
            <p className="text-xs font-black text-white">
              TODAY'S RECIPE
            </p>
          </div>

          <div className="p-5 text-center">
            <p className="text-sm font-black text-[#f39a00]">
              今日の献立
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#6b2f13]">
              アスパラベーコン
            </h2>

            <p className="mt-3 text-sm font-bold text-[#6b2f13]/60">
              ベーコンの旨味とアスパラの食感を楽しめる定番レシピ
            </p>

            <button
              type="button"
              onClick={() => setCurrentTab("レシピ")}
              className="mt-4 rounded-full bg-[#f39a00] px-6 py-3 text-sm font-black text-white shadow"
            >
              レシピを見る →
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onImageClick={(src) => setSelectedImage(src)}
            />
          ))}
        </div>
      </div>

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
              alt=""
              className="w-full rounded-xl object-cover"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="mt-4 w-full rounded-full bg-[#f39a00] py-3 font-black text-white"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </main>
  );
}