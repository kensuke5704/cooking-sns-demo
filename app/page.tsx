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
import NotificationScreen from "./screens/NotificationScreen";
import { supabase } from "./lib/supabase";
import { deletePostData, loadPostsData } from "./lib/posts";
import { getTodayRecipe } from "./lib/todayRecipe";

const APP_VERSION = "2026-05-31 fixed";
const todayRecipe = getTodayRecipe();

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window === "undefined") return "ホーム";
  
    return localStorage.getItem("current-tab") || "ホーム";
  });
  const [authVersion, setAuthVersion] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] =
    useState<ReturnType<typeof getCurrentUser>>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, [authVersion]);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [authVersion]);

  useEffect(() => {
    const currentUser = getCurrentUser();
  
    if (!currentUser) return;
  
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [authVersion]);
  
  async function loadUnreadCount() {
    const currentUser = getCurrentUser();
  
    if (!currentUser) return;
  
    const { count, error } = await supabase
      .from("notifications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("to_user_id", currentUser.userId)
      .eq("read", false);
  
    if (error) {
      console.error(error);
      return;
    }
  
    setUnreadCount(count || 0);
  }

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
  
    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Tokyo",
    });
  
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
        <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
        />
      </>
    );
  }

  if (currentTab === "カレンダー") {
    return (
      <>
        <CalendarPage />
        <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
        />
      </>
    );
  }

  if (currentTab === "記事") {
    return (
      <>
        <EmptyPage title="記事" />
        <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
        />
      </>
    );
  }

  if (currentTab === "通知") {
    return (
      <>
        <NotificationScreen
          onReadChange={loadUnreadCount}
        />
        <BottomNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          unreadCount={unreadCount}
        />
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
        <BottomNav currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
        />
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
        <div className="flex items-center justify-between">
          <p className="text-xs font-black opacity-70">
            最終更新: {APP_VERSION}
          </p>

          <button
            type="button"
            onClick={() => setCurrentTab("通知")}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow"
            aria-label="通知"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 7.5C4 6.12 5.12 5 6.5 5h11C18.88 5 20 6.12 20 7.5v9C20 17.88 18.88 19 17.5 19h-11C5.12 19 4 17.88 4 16.5v-9Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M5.5 7.5 12 12.5l6.5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="mt-4 w-full overflow-hidden rounded-[36px] bg-white shadow-xl">
          <div className="bg-[#f39a00] px-5 py-2 text-left">
            <p className="text-xs font-black text-white">TODAY&apos;S RECIPE</p>
          </div>

          <div className="p-5 text-center">
            <p className="text-sm font-black text-[#f39a00]">今日の献立</p>

            <h2 className="mt-2 text-3xl font-black text-[#6b2f13]">
              {todayRecipe.title}
            </h2>

            <p className="mt-3 text-sm font-bold text-[#6b2f13]/60">
              {todayRecipe.description}
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

      <BottomNav
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      unreadCount={unreadCount}
      />
    </main>
  );
}