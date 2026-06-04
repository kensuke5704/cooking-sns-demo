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
  const [targetPostId, setTargetPostId] = useState<string | number | null>(null);

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
    if (currentTab !== "ホーム" || targetPostId === null) return;

    const timer = window.setTimeout(() => {
      const target = document.getElementById(`post-${targetPostId}`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });

      window.setTimeout(() => {
        setTargetPostId(null);
      }, 1800);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [currentTab, targetPostId, posts]);

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

    const { error: postDeleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("to_user_id", currentUser.userId)
      .eq("type", "post");

    if (postDeleteError) {
      console.error(postDeleteError);
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

  async function openPostFromNotification(postId: string | number) {
    setTargetPostId(postId);
    setCurrentTab("ホーム");
    await loadPosts();
    await loadUnreadCount();
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
          onOpenPost={openPostFromNotification}
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
          <section className="mt-5">
            <div className="mb-4 px-1">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
                TODAY'S POSTS
              </p>
              <h2 className="mt-1 text-[20px] font-black leading-tight tracking-[-0.03em] text-[#6b2f13]">
                今日の投稿
              </h2>
            </div>

            {visiblePosts.length === 0 ? (
              <div className="rounded-[28px] bg-white/80 p-5 shadow-[0_12px_32px_rgba(107,47,19,0.1)]">
                <EmptyState
                  title="投稿はありません"
                  actionLabel="投稿する"
                  onAction={() => setCurrentTab("カメラ")}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {visiblePosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onImageClick={(src) => setSelectedImage(src)}
                    onDelete={deletePost}
                    isHighlighted={String(targetPostId) === String(post.id)}
                  />
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

      <AppPopup popup={popup} onClose={() => setPopup(null)} />

      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
      />
    </>
  );
}
