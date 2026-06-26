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
import PullToRefresh from "./components/common/PullToRefresh";
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
        <LayoutWithNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          unreadCount={unreadCount}
          onRefresh={() => refreshCurrentScreen(() => setProfileRefreshKey((v) => v + 1))}
        >
          <FriendsPage key={profileRefreshKey} />
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
          onRefresh={() => refreshCurrentScreen(() => setCalendarRefreshKey((v) => v + 1))}
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
          onRefresh={() => refreshCurrentScreen(() => setProfileRefreshKey((v) => v + 1))}
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
        <main className="min-h-[100dvh] bg-[#f4a72d] text-[#3f2116]">
          <div className="relative mx-auto h-[100dvh] w-full max-w-md overflow-hidden">
            <header className="absolute inset-x-0 top-0 h-[50px]">
              <img
                src="/design-targets/home-header-shell.png"
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-fill"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => {
                  setCurrentTab("通知");
                  markNotificationsAsRead();
                }}
                className="absolute right-[14%] top-[18%] h-[31px] w-[31px] opacity-0"
                aria-label="通知"
              />
                {unreadCount > 0 && (
                <span className="absolute right-[12%] top-[10%] z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              <img
                src={currentUser.iconUrl || "/images/user1-icon.jpg"}
                alt={currentUser.name}
                className="absolute right-[3.8%] top-[18%] h-[29px] w-[29px] rounded-full object-cover"
              />
            </header>

            <section className="absolute left-[3.1%] right-[3.1%] top-[7.2%] h-[140px] overflow-hidden rounded-[10px]">
              <img
                src="/design-targets/home-hero-shell.png"
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-fill"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setCurrentTab("カメラ")}
                className="absolute bottom-[10%] left-[4.5%] h-[25%] w-[32%] opacity-0"
                aria-label="撮る"
              />
              <button
                type="button"
                onClick={() => setCurrentTab("カレンダー")}
                className="absolute bottom-[10%] left-[40%] h-[25%] w-[33%] opacity-0"
                aria-label="カレンダー"
              />
            </section>

            <section className="absolute left-[3.1%] right-[3.1%] top-[26.6%] home-rise-in [animation-delay:120ms]">
              <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-[16px] font-black leading-tight text-[#3f2116]">
                家族の食卓
              </h2>

              <button
                type="button"
                onClick={() => setCurrentTab("カレンダー")}
                className="rounded-full bg-[#2f6b4f] px-3 py-1.5 text-[9px] font-black text-[#fff8e6] shadow-[0_8px_18px_rgba(47,107,79,0.18)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
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
          <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+18px)] max-h-[86dvh] overflow-y-auto rounded-[34px] bg-[#f4a72d] p-3 shadow-[0_28px_80px_rgba(63,33,22,0.28)]">
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

      <HomeBottomNavOverlay
        unreadCount={unreadCount}
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
          ? "left-[5.5%] top-[39%] h-[77px] w-[83px] -rotate-[4deg]"
          : "left-[5.5%] top-[38%] h-[77px] w-[83px] -rotate-[7deg]",
    },
    {
      label: "調理",
      src: post.cookingPhoto,
      className:
        variant === 1
          ? "left-[34%] top-[35%] h-[79px] w-[86px] -rotate-[3deg]"
          : "left-[34%] top-[34%] h-[79px] w-[86px] rotate-[1deg]",
    },
    {
      label: "完成",
      src: post.finishedPhoto,
      className:
        variant === 2
          ? "right-[8%] top-[29%] h-[86px] w-[92px] rotate-[4deg]"
          : "right-[7%] top-[30%] h-[86px] w-[92px] rotate-[6deg]",
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

      <div className="relative z-20 flex items-center gap-2">
        <div className="h-[28px] w-[28px] shrink-0 overflow-hidden rounded-full">
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
        <div className="min-w-0">
          <p className="truncate text-[12px] font-black leading-tight text-[#3f2116]">
            {post.userName}
          </p>
          <p className="mt-0.5 text-[9px] font-bold leading-none text-[#3f2116]/48">
            {formatRelativeTime(post.createdAt)}
          </p>
        </div>
      </div>

      <h3 className="relative z-20 mt-3 max-w-[68%] truncate text-[13px] font-black leading-tight text-[#3f2116]">
        {title}
      </h3>

      {photos.map((photo) => (
        <div
          key={photo.label}
          className={`absolute z-30 rounded-[5px] bg-white p-[5px] pb-[15px] shadow-[0_9px_16px_rgba(63,33,22,0.16)] ${photo.className}`}
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
        </div>
      ))}

      <div className="absolute inset-x-3 bottom-3 z-20">
        <p className="line-clamp-1 max-w-[68%] text-[10px] font-bold leading-tight text-[#3f2116]/62">
          {memo}
        </p>
        <div className="mt-2 flex items-center gap-2 text-[10px] font-black leading-none text-[#7d5632]">
          <span className={post.liked ? "text-[#d85a3a]" : ""}>
            {post.liked ? "●" : "♡"} {likeLabel}
          </span>
          <span>○ {commentLabel}</span>
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

function HomeBottomNavOverlay({
  unreadCount,
  setCurrentTab,
}: {
  unreadCount: number;
  setCurrentTab: (tab: string) => void;
}) {
  const tabs = ["ホーム", "つながり", "カメラ", "カレンダー", "プロフィール"];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[69px] max-w-md">
      <img
        src="/design-targets/home-bottom-nav-shell.png"
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-fill"
        aria-hidden="true"
      />
      {unreadCount > 0 && (
        <span className="absolute left-[14.5%] top-[15%] flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      <div className="absolute inset-0 grid grid-cols-5">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setCurrentTab(tab)}
            className="h-full w-full opacity-0"
            aria-label={tab}
          />
        ))}
      </div>
    </nav>
  );
}
