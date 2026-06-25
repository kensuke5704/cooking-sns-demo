"use client";

import { useEffect, useState } from "react";
import type { Post } from "./types/post";
import CameraPost from "./components/camera/CameraPost";
import PostCard from "./components/post/PostCard";
import RecipePage from "./screens/RecipeScreen";
import CalendarPage from "./screens/CalendarScreen";
import AuthPage from "./screens/AuthScreen";
import { getCurrentUser } from "./lib/auth";
import ProfilePage from "./screens/ProfileScreen";
import NotificationScreen from "./screens/NotificationScreen";
import { supabase } from "./lib/supabase";
import { deletePostData, loadPostsData } from "./lib/posts";
import LayoutWithNav from "./components/LayoutWithNav";
import NotificationButton from "./components/NotificationButton";
import ImageModal from "./components/ImageModal";
import BottomNav from "./components/navigation/BottomNav";
import AppPopup, { type AppPopupState } from "./components/common/AppPopup";
import PullToRefresh from "./components/common/PullToRefresh";
import ScreenShell from "./components/common/ScreenShell";
import EmptyState from "./components/common/EmptyState";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
  const [popup, setPopup] = useState<AppPopupState | null>(null);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [highlightedPostId, setHighlightedPostId] = useState<string | number | null>(null);

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

  useEffect(() => {
    localStorage.setItem("current-tab", currentTab);
  }, [currentTab]);


  useEffect(() => {
    if (currentTab !== "ホーム" || highlightedPostId === null) return;

    const timer = window.setTimeout(() => {
      document
        .getElementById(`post-${highlightedPostId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [currentTab, highlightedPostId, posts]);

  async function loadUnreadCount() {
    const currentUser = getCurrentUser();

    if (!currentUser) return;

    const cutoff = new Date(Date.now() - ONE_DAY_MS).toISOString();

    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("to_user_id", currentUser.userId)
      .lt("created_at", cutoff);

    if (deleteError) {
      console.error(deleteError);
    }

    const { error: deletePostNotificationError } = await supabase
      .from("notifications")
      .delete()
      .eq("to_user_id", currentUser.userId)
      .eq("type", "post");

    if (deletePostNotificationError) {
      console.error(deletePostNotificationError);
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("to_user_id", currentUser.userId)
      .eq("read", false)
      .neq("type", "post")
      .gte("created_at", cutoff);

    if (error) {
      console.error(error);
      return;
    }

    setUnreadCount(count || 0);
  }

  async function markNotificationsAsRead() {
    const currentUser = getCurrentUser();

    if (!currentUser) return;

    const cutoff = new Date(Date.now() - ONE_DAY_MS).toISOString();

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("to_user_id", currentUser.userId)
      .eq("read", false)
      .neq("type", "post")
      .gte("created_at", cutoff);

    if (error) {
      console.error(error);
      return;
    }

    setUnreadCount(0);
  }

  async function loadPosts() {
    const currentUser = getCurrentUser();

    if (!currentUser) return [];

    try {
      const loadedPosts = await loadPostsData(currentUser.userId);
      setPosts(loadedPosts);
      return loadedPosts;
    } catch (error) {
      console.error("投稿取得エラー:", error);
      return [];
    }
  }

  async function refreshHome() {
    await Promise.all([loadPosts(), loadUnreadCount()]);
  }

  async function refreshCurrentScreen(refresh: () => void) {
    refresh();
    await loadUnreadCount();
  }

  async function openPostFromNotification(postId: string | number) {
    const normalizedPostId = String(postId);

    const { data, error } = await supabase
      .from("posts")
      .select("id, created_at")
      .eq("id", postId)
      .maybeSingle();

    if (error) {
      console.error("通知先投稿確認エラー:", error);
      setPopup({
        title: "投稿を確認できません",
        message: "時間をおいてもう一度試してください。",
      });
      return;
    }

    if (!data) {
      setPopup({
        title: "削除された投稿です",
        message: "",
      });
      return;
    }

    const createdAt = new Date(data.created_at).getTime();
    const isExpired = Date.now() - createdAt > ONE_DAY_MS;

    if (isExpired) {
      setPopup({
        title: "削除された投稿です",
        message: "",
      });
      return;
    }

    const loadedPosts = await loadPosts();
    const targetPost = loadedPosts.find(
      (post) => String(post.id) === normalizedPostId
    );

    if (!targetPost) {
      setPopup({
        title: "削除された投稿です",
        message: "",
      });
      return;
    }

    setHighlightedPostId(postId);
    setCurrentTab("ホーム");

    window.setTimeout(() => {
      document
        .getElementById(`post-${normalizedPostId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);

    window.setTimeout(() => {
      setHighlightedPostId(null);
    }, 3500);
  }

  async function deletePost(postId: string | number) {
    setPopup({
      title: "投稿を削除しますか？",
      message: "この操作は取り消せません。",
      confirmLabel: "削除する",
      cancelLabel: "やめる",
      danger: true,
      onConfirm: async () => {
        const currentUser = getCurrentUser();
        const targetPost = posts.find((post) => post.id === postId);

        try {
          await deletePostData(postId, targetPost);

          resetTodayDraftIfNeeded(currentUser, targetPost);

          setPosts((prev) => prev.filter((post) => post.id !== postId));
        } catch (error) {
          console.error("投稿削除エラー:", error);
          setPopup({
            title: "削除に失敗しました",
            message: "時間をおいてもう一度試してください。",
          });
        }
      },
    });
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

  const popupElement = <AppPopup popup={popup} onClose={() => setPopup(null)} />;

  if (currentTab === "カメラ") {
    return (
      <>
        <CameraPost
          onBack={() => {
            setCurrentTab("ホーム");
            loadPosts();
          }}
        />
        {popupElement}
      </>
    );
  }

  if (currentTab === "レシピ") {
    return (
      <>
        <LayoutWithNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          unreadCount={unreadCount}
          onRefresh={() => loadUnreadCount()}
        >
          <RecipePage />
        </LayoutWithNav>
        {popupElement}
      </>
    );
  }

  if (currentTab === "カレンダー") {
    return (
      <>
        <LayoutWithNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          unreadCount={unreadCount}
          onRefresh={() =>
            refreshCurrentScreen(() => setCalendarRefreshKey((v) => v + 1))
          }
        >
          <CalendarPage key={calendarRefreshKey} />
        </LayoutWithNav>
        {popupElement}
      </>
    );
  }

  if (currentTab === "記事") {
    return (
      <>
        <LayoutWithNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          unreadCount={unreadCount}
          onRefresh={() => loadUnreadCount()}
        >
          <RecipePage />
        </LayoutWithNav>
        {popupElement}
      </>
    );
  }

  if (currentTab === "通知") {
    return (
      <>
        <LayoutWithNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          unreadCount={unreadCount}
          onRefresh={() =>
            refreshCurrentScreen(() => setNotificationRefreshKey((v) => v + 1))
          }
        >
          <NotificationScreen
            key={notificationRefreshKey}
            onReadChange={loadUnreadCount}
            onOpenPost={openPostFromNotification}
          />
        </LayoutWithNav>
        {popupElement}
      </>
    );
  }

  if (currentTab === "プロフィール") {
    return (
      <>
        <LayoutWithNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          unreadCount={unreadCount}
          onRefresh={() =>
            refreshCurrentScreen(() => setProfileRefreshKey((v) => v + 1))
          }
        >
          <ProfilePage
            key={profileRefreshKey}
            onProfileChange={() => {
              setAuthVersion((v) => v + 1);
            }}
          />
        </LayoutWithNav>
        {popupElement}
      </>
    );
  }

  const visiblePosts = posts.filter((post) => {
    const created = new Date(post.createdAt).getTime();
    return Date.now() - created <= ONE_DAY_MS;
  });

  return (
    <>
      <PullToRefresh onRefresh={refreshHome}>
        <ScreenShell>
          <section className="home-rise-in">
            <div className="flex items-center justify-between">
              <div className="text-[26px] font-black text-[#3f2116]">
                ごはんなにかな
              </div>

              <div className="flex items-center gap-2">
                <NotificationButton
                  unreadCount={unreadCount}
                  onClick={() => {
                    setCurrentTab("通知");
                    markNotificationsAsRead();
                  }}
                />
                <img
                  src={currentUser.iconUrl || "/images/user1-icon.jpg"}
                  alt={currentUser.name}
                  className="h-12 w-12 rounded-full bg-[#fff8e6] object-cover ring-2 ring-[#fff8e6]"
                />
              </div>
            </div>

            <div className="mt-5 rounded-[28px] bg-[#fff8e6] p-6 shadow-[0_18px_40px_rgba(63,33,22,0.13)] ring-1 ring-white/60">
              <div className="grid grid-cols-[1fr_118px] gap-4">
                <div className="min-w-0">
                  <h1 className="text-[28px] font-black leading-[1.12] text-[#3f2116]">
                    今日のごはん、
                    <br />
                    届いてるよ
                  </h1>
                  <p className="mt-3 text-[14px] font-bold leading-relaxed text-[#3f2116]/68">
                    準備、調理、完成まで。家族の料理がそっと残ります。
                  </p>
                </div>

                <div className="relative min-h-[116px]" aria-hidden="true">
                  <div className="absolute right-2 top-2 h-20 w-24 rounded-[26px] bg-[#f4a72d]/28" />
                  <div className="absolute right-1 top-8 h-16 w-20 rounded-b-[28px] rounded-t-[18px] bg-[#f4a72d] ring-2 ring-[#d8942a]/25" />
                  <div className="absolute right-5 top-14 h-5 w-10 rounded-full bg-[#fff8e6]/70" />
                  <div className="absolute right-0 top-10 h-9 w-3 rounded-r-full border-2 border-[#d8942a]/45" />
                  <div className="absolute right-20 top-9 h-9 w-3 rounded-l-full border-2 border-[#d8942a]/45" />
                  <div className="absolute right-7 top-0 h-5 w-12 rounded-full border-2 border-[#d8942a]/45" />
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentTab("カメラ")}
                  className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#2f6b4f] px-5 py-3 text-[16px] font-black text-[#fff8e6] shadow-[0_12px_24px_rgba(47,107,79,0.2)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                >
                  撮る
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab("カレンダー")}
                  className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#fff8e6] px-5 py-3 text-[15px] font-black text-[#3f2116] shadow-[inset_0_0_0_1px_rgba(122,67,40,0.16)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                >
                  カレンダー
                </button>
              </div>
            </div>
          </section>

          <section className="mt-7 home-rise-in [animation-delay:120ms]">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-[24px] font-black leading-tight text-[#3f2116]">
                家族の食卓
              </h2>

              <button
                type="button"
                onClick={() => setCurrentTab("カレンダー")}
                className="rounded-full bg-[#2f6b4f] px-4 py-2 text-[13px] font-black text-[#fff8e6] shadow-[0_12px_24px_rgba(47,107,79,0.2)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
              >
                すべて見る
              </button>
            </div>

            {visiblePosts.length === 0 ? (
              <div className="rounded-[32px] bg-[#fffaf2]/88 p-5 shadow-[0_18px_44px_rgba(75,42,29,0.12)] ring-1 ring-white/60">
                <EmptyState
                  title="投稿はありません"
                  actionLabel="投稿する"
                  onAction={() => setCurrentTab("カメラ")}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {visiblePosts.map((post) => (
                  <div key={post.id} id={`post-${post.id}`}>
                    <PostCard
                      post={post}
                      onImageClick={(src) => setSelectedImage(src)}
                      onDelete={deletePost}
                      highlight={String(highlightedPostId) === String(post.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </ScreenShell>
      </PullToRefresh>

      {selectedImage && (
        <ImageModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {popupElement}

      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
      />
    </>
  );
}
