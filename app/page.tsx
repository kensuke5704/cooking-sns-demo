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
import NotificationButton from "./components/NotificationButton";
import ImageModal from "./components/ImageModal";
import BottomNav from "./components/navigation/BottomNav";
import AppPopup, { type AppPopupState } from "./components/common/AppPopup";
import PullToRefresh from "./components/common/PullToRefresh";
import ScreenShell from "./components/common/ScreenShell";
import EmptyState from "./components/common/EmptyState";
import DesignFrame, { DesignNavOverlay } from "./components/common/DesignFrame";

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
        <DesignFrame image="/design-targets/camera.png">
          <div className="absolute inset-0 z-20 overflow-y-auto opacity-0">
            <CameraPost
              onBack={() => {
                setCurrentTab("ホーム");
                loadPosts();
              }}
            />
          </div>
          <DesignNavOverlay setCurrentTab={setCurrentTab} />
        </DesignFrame>
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
        <DesignFrame image="/design-targets/connections.png">
          <div className="absolute inset-0 z-20 overflow-y-auto opacity-0">
            <LayoutWithNav
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              unreadCount={unreadCount}
              onRefresh={() => refreshCurrentScreen(() => setProfileRefreshKey((v) => v + 1))}
            >
              <FriendsPage key={profileRefreshKey} />
            </LayoutWithNav>
          </div>
          <DesignNavOverlay setCurrentTab={setCurrentTab} />
        </DesignFrame>
        {popupElement}
      </>
    );
  }

  if (currentTab === "カレンダー") {
    return (
      <>
        <DesignFrame image="/design-targets/calendar.png">
          <div className="absolute inset-0 z-20 overflow-y-auto opacity-0">
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
          </div>
          <DesignNavOverlay setCurrentTab={setCurrentTab} />
        </DesignFrame>
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
        <DesignFrame image="/design-targets/mypage.png">
          <div className="absolute inset-0 z-20 overflow-y-auto opacity-0">
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
          </div>
          <DesignNavOverlay setCurrentTab={setCurrentTab} />
        </DesignFrame>
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
        <DesignFrame image="/design-targets/home.png">
          <button
            type="button"
            onClick={() => {
              setCurrentTab("通知");
              markNotificationsAsRead();
            }}
            className="absolute right-[16%] top-[3.7%] h-[6%] w-[12%] opacity-0"
            aria-label="通知"
          />
          <button
            type="button"
            onClick={() => setCurrentTab("カメラ")}
            className="absolute left-[7%] top-[20%] h-[5.7%] w-[28%] opacity-0"
            aria-label="撮る"
          />
          <button
            type="button"
            onClick={() => setCurrentTab("カレンダー")}
            className="absolute left-[40%] top-[20%] h-[5.7%] w-[28%] opacity-0"
            aria-label="カレンダー"
          />
          <button
            type="button"
            onClick={() => setCurrentTab("カレンダー")}
            className="absolute right-[7%] top-[30.5%] h-[4.5%] w-[24%] opacity-0"
            aria-label="すべて見る"
          />

          <div className="absolute left-[3.1%] right-[3.1%] top-[32.4%]">
            {visiblePosts.length === 0 ? (
              <button
                type="button"
                onClick={() => setCurrentTab("カメラ")}
                className="flex h-[210px] w-full items-center justify-center rounded-[10px] bg-[#fffaf2] text-[13px] font-black text-[#3f2116] shadow-[0_10px_22px_rgba(63,33,22,0.12)]"
              >
                投稿する
              </button>
            ) : (
              <div className="flex flex-col gap-[5px]">
                {visiblePosts.slice(0, 2).map((post, index) => (
                  <HomeFeedCard
                    key={post.id}
                    post={post}
                    index={index}
                    onOpen={() => setActivePost(post)}
                    highlight={String(highlightedPostId) === String(post.id)}
                  />
                ))}
              </div>
            )}
          </div>
          <DesignNavOverlay setCurrentTab={setCurrentTab} />
        </DesignFrame>
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
  const photos = [
    {
      label: "準備",
      src: post.prepPhoto,
      className:
        index === 0
          ? "left-[7.4%] top-[36.8%] h-[23.4%] w-[21.1%] -rotate-[7deg]"
          : "left-[7.4%] top-[36.8%] h-[23.4%] w-[21.1%] -rotate-[3deg]",
    },
    {
      label: "調理",
      src: post.cookingPhoto,
      className:
        index === 0
          ? "left-[35.1%] top-[34.2%] h-[24.2%] w-[21.4%] rotate-[1deg]"
          : "left-[35.1%] top-[34.2%] h-[24.2%] w-[21.4%] -rotate-[4deg]",
    },
    {
      label: "完成",
      src: post.finishedPhoto,
      className:
        index === 0
          ? "right-[13.5%] top-[30.2%] h-[26.6%] w-[23.2%] rotate-[6deg]"
          : "right-[13.5%] top-[30.2%] h-[26.6%] w-[23.2%] rotate-[5deg]",
    },
  ];
  const title = post.dishName || "今日の料理を記録しました";
  const timeLabel = index === 0 ? "たった今" : "15分前";
  const referenceText =
    index === 0
      ? {
          userName: "お母さん",
          time: "たった今",
          title: "夏野菜のチキンプレート",
          memo: "みんなが好きな味にできたよ",
        }
      : {
          userName: "そうた",
          time: "15分前",
          title: "ハンバーグと野菜のプレート",
          memo: "ハンバーグ、上手に焼けたよ",
        };
  const shouldRenderHeaderText =
    post.userName !== referenceText.userName || timeLabel !== referenceText.time;
  const shouldRenderTitle = title !== referenceText.title;
  const shouldRenderMemo = (post.memo || "家族に残したい食卓の記録です") !== referenceText.memo;

  return (
    <article
      className={`relative h-[210px] ${highlight ? "rounded-[10px] ring-4 ring-[#2f6b4f]/35" : ""}`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-40 block rounded-[10px]"
        aria-label={`${title}を開く`}
      />

      <div className="absolute left-[5%] top-[5.5%] z-20 h-[26px] w-[26px] overflow-hidden rounded-full">
        {post.userIcon ? (
          <img
            src={post.userIcon}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[13px] font-black text-[#2f6b4f]">
            {(post.userName || "家").slice(0, 1)}
          </div>
        )}
      </div>

      {shouldRenderHeaderText && (
        <div className="absolute left-[14.6%] top-[5.2%] z-20 h-[26px] w-[36%] bg-[#fbf6ef]">
          <p className="truncate text-[12px] font-black leading-tight text-[#3f2116]">
            {post.userName}
          </p>
          <p className="mt-0.5 text-[9px] font-bold leading-none text-[#3f2116]/48">
            {timeLabel}
          </p>
        </div>
      )}

      {shouldRenderTitle && (
        <h3 className="absolute left-[3.8%] top-[23.3%] z-20 w-[60%] truncate bg-[#fbf6ef] pr-1 text-[13px] font-black leading-tight text-[#3f2116]">
          {title}
        </h3>
      )}

      {photos.map((photo) => (
        <div
          key={photo.label}
          className={`absolute z-30 overflow-hidden rounded-[2px] ${photo.className}`}
        >
              {photo.src ? (
                <img
                  src={photo.src}
                  alt={photo.label}
                  draggable={false}
              className="h-full w-full object-cover"
                />
              ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f4a72d]/12 text-[10px] font-black text-[#2f6b4f]">
                  {photo.label}
                </div>
              )}
        </div>
      ))}

      {shouldRenderMemo && (
        <p className="absolute bottom-[12.6%] left-[3.8%] z-20 line-clamp-1 w-[62%] bg-[#fbf6ef] pr-1 text-[10px] font-bold leading-tight text-[#3f2116]/58">
          {post.memo || "家族に残したい食卓の記録です"}
        </p>
      )}
    </article>
  );
}
