"use client";

import { useEffect, useState } from "react";
import type { Post } from "./types/post";
import CameraPost from "./components/camera/CameraPost";
import PostCard from "./components/post/PostCard";
import RecipePage from "./screens/RecipeScreen";
import CalendarPage from "./screens/CalendarScreen";
import FriendsPage from "./screens/FriendsScreen";
import AuthPage from "./screens/AuthScreen";
import { getCurrentUser } from "./lib/auth";
import ProfilePage from "./screens/ProfileScreen";
import NotificationScreen from "./screens/NotificationScreen";
import { supabase } from "./lib/supabase";
import { deletePostData, loadPostsData } from "./lib/posts";
import LayoutWithNav from "./components/LayoutWithNav";
import ImageModal from "./components/ImageModal";
import AppPopup, { type AppPopupState } from "./components/common/AppPopup";
import { BellGlyph } from "./components/common/HeaderAvatar";
import PullToRefresh from "./components/common/PullToRefresh";
import EmptyState from "./components/common/EmptyState";
import {
  CalendarLineIcon,
  CameraLineIcon,
  CommentLineIcon,
  HeartLineIcon,
} from "./components/common/LineIcons";

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
  const [activePost, setActivePost] = useState<Post | null>(null);
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
          setCurrentTab={setCurrentTab}
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

  if (currentTab === "つながり") {
    return (
      <>
        <FriendsPage key={profileRefreshKey} />
        <TransparentBottomNav setCurrentTab={setCurrentTab} />
        {popupElement}
      </>
    );
  }

  if (currentTab === "カレンダー") {
    return (
      <>
        <CalendarPage key={calendarRefreshKey} />
        <TransparentBottomNav setCurrentTab={setCurrentTab} />
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
        <ProfilePage
          key={profileRefreshKey}
          onProfileChange={() => {
            setAuthVersion((v) => v + 1);
          }}
        />
        <TransparentBottomNav setCurrentTab={setCurrentTab} />
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
        <main className="min-h-[100dvh] bg-[#fcc25f] text-[#3f2116]">
          <div className="relative mx-auto h-[100dvh] w-full max-w-md overflow-hidden">
            <header className="absolute inset-x-0 top-0 h-[50px]">
              <div className="absolute left-[5.5%] top-[17px] text-[12px] font-black leading-none text-[#3f2116]">
                ごはん なにかな
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrentTab("通知");
                  markNotificationsAsRead();
                }}
                className="absolute right-[13.7%] top-[9px] flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#fff8e6] text-[#3f2116] shadow-[0_6px_14px_rgba(63,33,22,0.12)] ring-1 ring-white/70"
                aria-label="通知"
              >
                <BellGlyph className="h-[17px] w-[17px]" />
              </button>
                {unreadCount > 0 && (
                <span className="absolute right-[12%] top-[10%] z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              <img
                src={currentUser.iconUrl || "/images/user1-icon.jpg"}
                alt={currentUser.name}
                className="absolute right-[3.8%] top-[14%] h-[34px] w-[34px] rounded-full bg-[#fff8e6] p-[2px] object-cover shadow-[0_6px_14px_rgba(63,33,22,0.12)] ring-1 ring-white/80"
              />
            </header>

            <section className="absolute left-[3.1%] right-[3.1%] top-[7.2%] h-[140px] overflow-hidden rounded-[10px]">
              <div className="absolute inset-0 rounded-[10px] bg-[#fffaf2] shadow-[0_12px_26px_rgba(63,33,22,0.13)] ring-1 ring-white/70" />
              <div className="absolute left-[5.2%] top-[14%]">
                <h1 className="text-[18px] font-black leading-[1.18] text-[#3f2116]">
                  今日のごはん、
                  <br />
                  届いてるよ
                </h1>
                <p className="mt-2 text-[9px] font-bold leading-[1.75] text-[#3f2116]/62">
                  準備、調理、完成まで。
                  <br />
                  家族の料理がそっと残ります。
                </p>
              </div>
              <img
                src="/design-targets/home-hero-illustration-crop-alpha.png"
                alt=""
                aria-hidden="true"
                className="absolute right-[4.2%] top-[7.5%] h-[108px] w-[174px] object-contain mix-blend-multiply"
                draggable={false}
              />
              <button
                type="button"
                onClick={() => setCurrentTab("カメラ")}
                className="absolute bottom-[5%] left-[4.5%] flex h-[30px] w-[114px] items-center justify-center gap-[6px] rounded-full bg-[#0f6a47] text-[9px] font-black leading-none text-[#fff8e6] shadow-[0_9px_18px_rgba(15,106,71,0.18)]"
                aria-label="撮る"
              >
                <CameraLineIcon className="h-[14px] w-[14px]" />
                <span>撮る</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab("カレンダー")}
                className="absolute bottom-[5%] left-[39.8%] flex h-[30px] w-[105px] items-center justify-center gap-[5px] rounded-full bg-[#fff8e6] text-[8px] font-black leading-none text-[#3f2116] ring-1 ring-[#dfc79d]/70"
                aria-label="カレンダー"
              >
                <CalendarLineIcon className="h-[13px] w-[13px]" />
                <span>カレンダー</span>
              </button>
            </section>

            <section className="absolute left-[3.1%] right-[3.1%] top-[26.6%] home-rise-in [animation-delay:120ms]">
              <div className="mb-2 flex translate-y-[8px] items-center justify-between px-1">
              <h2 className="text-[14px] font-black leading-tight text-[#3f2116]">
                家族の食卓
              </h2>

              <button
                type="button"
                onClick={() => setCurrentTab("カレンダー")}
                className="rounded-full bg-[#2f6b4f] px-3 py-1.5 text-[8px] font-black leading-none text-[#fff8e6] shadow-[0_8px_18px_rgba(47,107,79,0.18)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
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
              <div className="space-y-[5px]">
                {visiblePosts.map((post, index) => (
                  <div key={post.id} id={`post-${post.id}`}>
                    <HomeFeedCard
                      post={post}
                      index={index}
                      onOpen={() => setActivePost(post)}
                      highlight={String(highlightedPostId) === String(post.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
          </div>
        </main>
      </PullToRefresh>

      {activePost && (
        <div className="fixed inset-0 z-[90] bg-[#3f2116]/34 px-4 py-5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActivePost(null)}
            className="absolute inset-0 cursor-default"
            aria-label="投稿詳細を閉じる"
          />
          <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+18px)] max-h-[86dvh] overflow-y-auto rounded-[34px] bg-[#fbb23a] p-3 shadow-[0_28px_80px_rgba(63,33,22,0.28)]">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-sm font-black text-[#3f2116]">投稿の操作</p>
              <button
                type="button"
                onClick={() => setActivePost(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff8e6] text-lg font-black text-[#3f2116]"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
            <PostCard
              post={activePost}
              onImageClick={(src) => setSelectedImage(src)}
              onDelete={(postId) => {
                setActivePost(null);
                deletePost(postId);
              }}
            />
          </div>
        </div>
      )}

      {selectedImage && (
        <ImageModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {popupElement}

      <TransparentBottomNav
        setCurrentTab={setCurrentTab}
      />
    </>
  );
}

function HomeFeedCard({
  post,
  index,
  onOpen,
  highlight = false,
}: {
  post: Post;
  index: number;
  onOpen: () => void;
  highlight?: boolean;
}) {
  return (
    <DynamicHomeFeedCard
      post={post}
      index={index}
      onOpen={onOpen}
      highlight={highlight}
    />
  );
}

function TransparentBottomNav({
  setCurrentTab,
}: {
  setCurrentTab: (tab: string) => void;
}) {
  const tabs = [
    { label: "ホーム", text: "ホーム" },
    { label: "つながり", text: "つながり" },
    { label: "カメラ", text: "撮る" },
    { label: "カレンダー", text: "カレンダー" },
    { label: "プロフィール", text: "マイページ" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[69px] max-w-md px-3 pb-[calc(env(safe-area-inset-bottom)+6px)]">
      <div className="absolute inset-x-3 bottom-[env(safe-area-inset-bottom)] h-[47px] rounded-t-[18px] rounded-b-[20px] bg-[#fff8e6]/96 shadow-[0_10px_24px_rgba(63,33,22,0.16)] ring-1 ring-white/70" />
      <div className="absolute inset-x-3 bottom-[env(safe-area-inset-bottom)] grid h-[47px] grid-cols-5">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setCurrentTab(tab.label)}
            className={`relative flex h-full w-full flex-col items-center justify-center rounded-[14px] text-[7px] font-black leading-[0.9] ${tab.label === "ホーム" ? "text-[#0f6a47]" : "text-[#9d7140]"} ${tab.label === "カメラ" ? "-mt-3" : ""}`}
            aria-label={tab.label}
          >
            <span className={`mb-1 flex items-center justify-center ${tab.label === "カメラ" ? "h-12 w-12 rounded-full bg-[#0f6a47] shadow-[0_10px_22px_rgba(15,106,71,0.26)] ring-4 ring-[#fff8e6]" : "h-5 w-5 opacity-65"}`}>
              <HomeNavGlyph label={tab.label} className={tab.label === "カメラ" ? "h-[24px] w-[24px]" : "h-[21px] w-[21px]"} />
            </span>
            <span className="-translate-y-[8px]">{tab.text}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function HomeNavGlyph({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  if (label === "カメラ") return <CameraLineIcon className={className} />;
  if (label === "カレンダー") return <CalendarLineIcon className={className} />;

  if (label === "ホーム") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M4.2 10.7 12 4.1l7.8 6.6v8.1a1.9 1.9 0 0 1-1.9 1.9h-3.4v-6.1h-5v6.1H6.1a1.9 1.9 0 0 1-1.9-1.9v-8.1Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (label === "つながり") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <path d="M8.5 11.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" stroke="currentColor" strokeWidth="2" />
        <path d="M15.9 10.9a2.7 2.7 0 1 0 0-5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3.6 20.1c.6-3.7 2.3-5.5 4.9-5.5s4.3 1.8 4.9 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M13.9 15.4c2.8.2 4.7 1.7 5.4 4.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <circle cx="12" cy="8" r="3.7" stroke="currentColor" strokeWidth="2" />
      <path d="M5.2 20.2c.8-4.1 3.1-6.1 6.8-6.1s6 2 6.8 6.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DynamicHomeFeedCard({
  post,
  index,
  onOpen,
  highlight = false,
}: {
  post: Post;
  index: number;
  onOpen: () => void;
  highlight?: boolean;
}) {
  const variant = index % 3;
  const photos = [
    {
      label: "準備",
      src: post.prepPhoto,
      className:
        variant === 1
          ? "left-[5.4%] top-[31.2%] h-[40%] w-[30.8%] -rotate-[4deg]"
          : "left-[5.2%] top-[31.8%] h-[40%] w-[30.8%] -rotate-[7deg]",
    },
    {
      label: "調理",
      src: post.cookingPhoto,
      className:
        variant === 1
          ? "left-[31.8%] top-[30.2%] h-[41%] w-[31.8%] -rotate-[3deg]"
          : "left-[31.6%] top-[30.9%] h-[41%] w-[31.8%] rotate-[1deg]",
    },
    {
      label: "完成",
      src: post.finishedPhoto,
      className:
        variant === 2
          ? "right-[7.4%] top-[33.4%] h-[44%] w-[35.5%] rotate-[5deg]"
          : "right-[7.2%] top-[34.1%] h-[44%] w-[35.5%] rotate-[6deg]",
    },
  ];
  const title = post.dishName || "今日の料理を記録しました";
  const memo = post.memo || "家族に残したい食卓の記録です";
  const likeLabel =
    post.likeCount && post.likeCount > 0 ? `${post.likeCount} いいね` : "いいね";
  const commentLabel =
    post.commentCount && post.commentCount > 0
      ? `${post.commentCount} コメント`
      : "コメント";

  return (
    <article
      className={`relative h-[210px] overflow-hidden rounded-[10px] bg-[#fffaf2] px-3 py-3 shadow-[0_12px_26px_rgba(63,33,22,0.13)] ring-1 ring-white/70 ${
        highlight ? "ring-4 ring-[#2f6b4f]/35" : ""
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-40 block rounded-[10px]"
        aria-label={`${title}を開く`}
      />
      <span className="absolute right-[4.8%] top-[4.7%] z-20 text-[14px] font-black leading-none text-[#3f2116]">
        ...
      </span>
      <span
        aria-hidden="true"
        className={`absolute z-20 h-[9px] w-[42px] rounded-[2px] opacity-75 ${
          variant === 1
            ? "right-[5.8%] top-[30.1%] rotate-[6deg] bg-[#9abf9a]"
            : "right-[4.6%] top-[28.7%] rotate-[12deg] bg-[#d7a16f]"
        }`}
      />
      <span
        aria-hidden="true"
        className={`absolute z-10 text-[34px] font-black leading-none text-[#86a55a]/50 ${
          variant === 1
            ? "right-[2.8%] bottom-[21.8%] rotate-[14deg]"
            : "left-[0.6%] top-[45.4%] -rotate-[18deg]"
        }`}
      >
        〽
      </span>

      <div className="absolute left-[16%] top-[5.1%] z-20 h-[30px] w-[39%]">
        <p className="truncate text-[12px] font-black leading-tight text-[#3f2116]">
          {post.userName}
        </p>
        <p className="mt-0.5 text-[9px] font-bold leading-none text-[#3f2116]/48">
          {formatRelativeTime(post.createdAt)}
        </p>
      </div>

      <div className="absolute left-[4.1%] top-[4.2%] z-20 h-[36px] w-[36px] overflow-hidden rounded-full">
          {post.userIcon ? (
            <img
              src={post.userIcon}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#dcebc9] text-[13px] font-black text-[#2f6b4f]">
              {(post.userName || "家").slice(0, 1)}
            </div>
          )}
      </div>

      <h3 className="absolute left-[3.9%] top-[20.8%] z-20 w-[61%] truncate pr-1 text-[12px] font-black leading-tight text-[#3f2116]">
        {title}
      </h3>

      {photos.map((photo) => (
        <div
          key={photo.label}
          className={`absolute z-30 rounded-[5px] bg-white p-[5px] pb-[15px] shadow-[0_8px_12px_rgba(63,33,22,0.12)] ${photo.className}`}
        >
          <div className="h-full w-full overflow-hidden rounded-[2px] bg-[#f4a72d]/12">
            {photo.src ? (
              <img
                src={photo.src}
                alt={photo.label}
                draggable={false}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-[#2f6b4f]">
                {photo.label}
              </div>
            )}
          </div>
          <p className="absolute inset-x-0 bottom-1.5 text-center text-[10px] font-black leading-none text-[#3f2116]">
            {photo.label}
          </p>
        </div>
      ))}

      <div className="absolute bottom-[5.8%] left-[3.9%] z-20 w-[72%] pr-1">
        <p className="line-clamp-1 text-[10px] font-bold leading-tight text-[#3f2116]/62">
          {memo}
        </p>
        <div className="mt-2 flex items-center gap-2 text-[10px] font-black leading-none text-[#7d5632]">
          <span className={`flex items-center gap-1 ${post.liked ? "text-[#d85a3a]" : ""}`}>
            <HeartLineIcon className="h-[13px] w-[13px]" />
            {likeLabel}
          </span>
          <span className="flex items-center gap-1">
            <CommentLineIcon className="h-[13px] w-[13px]" />
            {commentLabel}
          </span>
        </div>
      </div>
    </article>
  );
}

function formatRelativeTime(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (60 * 1000)));

  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間前`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}日前`;
}
