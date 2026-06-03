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
import SectionCard from "./components/common/SectionCard";

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

  async function markNotificationsAsRead() {
    const currentUser = getCurrentUser();

    if (!currentUser) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("to_user_id", currentUser.userId)
      .eq("read", false);

    if (error) {
      console.error(error);
      return;
    }

    setUnreadCount(0);
  }

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

  async function refreshHome() {
    await Promise.all([loadPosts(), loadUnreadCount()]);
  }

  async function refreshCurrentScreen(refresh: () => void) {
    refresh();
    await loadUnreadCount();
  }

  async function deletePost(postId: string | number) {
    setPopup({
      title: "投稿を削除しますか？",
      message: "この操作は取り消せません。",
      confirmLabel: "削除する",
      cancelLabel: "やめる",
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
      <LayoutWithNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
        onRefresh={() => loadUnreadCount()}
      >
        <RecipePage />
      </LayoutWithNav>
    );
  }

  if (currentTab === "カレンダー") {
    return (
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
    );
  }

  if (currentTab === "記事") {
    return (
      <LayoutWithNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
        onRefresh={() => loadUnreadCount()}
      >
        <RecipePage />
      </LayoutWithNav>
    );
  }

  if (currentTab === "通知") {
    return (
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
        />
      </LayoutWithNav>
    );
  }

  if (currentTab === "プロフィール") {
    return (
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
    );
  }

  const visiblePosts = posts.filter((post) => {
    const created = new Date(post.createdAt).getTime();
    return Date.now() - created <= ONE_DAY_MS;
  });

  return (
    <>
      <PullToRefresh onRefresh={refreshHome}>
        <ScreenShell
          label="HOME"
          title="ホーム"
          subtitle="友だちの投稿をまとめて確認できます。"
          action={
            <NotificationButton
              unreadCount={unreadCount}
              onClick={() => {
                setCurrentTab("通知");
                markNotificationsAsRead();
              }}
            />
          }
        >
          <SectionCard
            className="mt-5"
            label="TODAY'S POSTS"
            title="今日の投稿"
            description="投稿から24時間以内の料理が表示されます。"
          >
            {visiblePosts.length === 0 ? (
              <div className="rounded-2xl bg-[#fff4d7] px-4 py-6 text-center">
                <p className="text-sm font-black text-[#6b2f13]">
                  まだ今日の投稿はありません
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentTab("カメラ")}
                  className="mt-4 rounded-full bg-[#f39a00] px-5 py-3 text-sm font-black text-white shadow"
                >
                  最初に投稿する
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {visiblePosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onImageClick={(src) => setSelectedImage(src)}
                    onDelete={deletePost}
                  />
                ))}
              </div>
            )}
          </SectionCard>

        </ScreenShell>
      </PullToRefresh>

      {selectedImage && (
        <ImageModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <AppPopup popup={popup} onClose={() => setPopup(null)} />

      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
      />
    </>
  );
}
