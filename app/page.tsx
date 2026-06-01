"use client";

import { useEffect, useState } from "react";
import EmptyPage from "./components/EmptyPage";
import type { Post } from "./types/post";
import CameraPost from "./components/camera/CameraPost";
import BottomNav from "./components/navigation/BottomNav";
import PostCard from "./components/post/PostCard";
import RecipePage from "./screens/RecipeScreen";
import CalendarPage from "./screens/CalendarScreen";
import AuthPage from "./screens/AuthScreen";
import { getCurrentUser } from "./lib/auth";
import ProfilePage from "./screens/ProfileScreen";
import { deletePostData, loadPostsData } from "./lib/posts";

const APP_VERSION = "2026-05-31 fixed";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window === "undefined") return "ホーム";
  
    return localStorage.getItem("current-tab") || "ホーム";
  });
  const [authVersion, setAuthVersion] = useState(0);
  const [currentUser, setCurrentUser] =
    useState<ReturnType<typeof getCurrentUser>>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, [authVersion]);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    localStorage.setItem("current-tab", currentTab);
  }, [currentTab]);

  async function loadPosts() {
    const currentUser = getCurrentUser();

    if (!currentUser) return;

    try {
      const loadedPosts = await loadPostsData(currentUser.userId);
      setPosts(loadedPosts);
    } catch (error) {
      console.error("投稿取得エラー:", error);
    }
  }

  async function deletePost(postId: string | number) {
    const ok = confirm("この投稿を削除しますか？");
    if (!ok) return;
  
    const currentUser = getCurrentUser();
    const targetPost = posts.find((post) => post.id === postId);
  
    try {
      await deletePostData(postId, targetPost);
  
      resetTodayDraftIfNeeded(currentUser, targetPost);
  
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("投稿削除エラー:", error);
      alert("削除に失敗しました");
    }
  }
  
  function resetTodayDraftIfNeeded(
    currentUser: ReturnType<typeof getCurrentUser>,
    targetPost?: Post
  ) {
    if (!currentUser || !targetPost) return;
  
    const today = new Date().toISOString().slice(0, 10);
  
    const isOwnPost = targetPost.userId === currentUser.userId;
    const isTodayPost = targetPost.postDate === today;
  
    if (!isOwnPost || !isTodayPost) return;
  
    localStorage.removeItem(`daily-cooking-photos-${currentUser.userId}-${today}`);
  }

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
    return (
      <CameraPost
        onBack={() => {
          setCurrentTab("ホーム");
          loadPosts();
        }}
      />
    );
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

  const visiblePosts = posts.filter((post) => {
    const created = new Date(post.createdAt).getTime();
    return Date.now() - created <= 24 * 60 * 60 * 1000;
  });

  return (
    <main className="min-h-screen bg-[#f8b72a] pb-28 text-[#6b2f13]">
      <div className="px-5 pt-5">
        <p className="text-xs font-black opacity-70">
          最終更新: {APP_VERSION}
        </p>

        <div className="mt-4 w-full overflow-hidden rounded-[36px] bg-white shadow-xl">
          <div className="bg-[#f39a00] px-5 py-2 text-left">
            <p className="text-xs font-black text-white">TODAY&apos;S RECIPE</p>
          </div>

          <div className="p-5 text-center">
            <p className="text-sm font-black text-[#f39a00]">今日の献立</p>

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
              onDelete={deletePost}
            />
          ))}
        </div>
      </div>

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-4"
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