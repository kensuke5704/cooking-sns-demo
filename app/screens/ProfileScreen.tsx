"use client";

import { useEffect, useState } from "react";
import {
  getCurrentUser,
  updateCurrentUser,
  logoutUser,
  type Friend,
} from "../lib/auth";
import { supabase } from "../lib/supabase";
import { resizeImageFile } from "../lib/image";
import { sendPushNotification } from "../lib/sendPush";
import { loadPostsData } from "../lib/posts";
import AppPopup, { type AppPopupState } from "../components/common/AppPopup";
import HeaderAvatar from "../components/common/HeaderAvatar";
import ScreenShell from "../components/common/ScreenShell";
import EmptyState from "../components/common/EmptyState";
import MiniChekiTriplet from "../components/post/MiniChekiTriplet";
import { CommentLineIcon, HeartLineIcon } from "../components/common/LineIcons";
import type { Post } from "../types/post";

type FriendWithIcon = Friend & { iconUrl?: string };

export default function ProfilePage({
  onProfileChange,
}: {
  onProfileChange: () => void;
}) {
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("/images/user1-icon.jpg");
  const [friends, setFriends] = useState<FriendWithIcon[]>([]);
  const [friendId, setFriendId] = useState("");
  const [message, setMessage] = useState("");
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [isNotificationOn, setIsNotificationOn] = useState(false);
  const [popup, setPopup] = useState<AppPopupState | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isNameEditorOpen, setIsNameEditorOpen] = useState(false);
  const [isFriendEditorOpen, setIsFriendEditorOpen] = useState(false);
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  
    checkNotificationStatus();
  }, []);
  const currentUser = getCurrentUser();

  async function checkNotificationStatus() {
    if (!("serviceWorker" in navigator)) {
      setIsNotificationOn(false);
      return;
    }
  
    const registration = await navigator.serviceWorker.getRegistration();
  
    if (!registration) {
      setIsNotificationOn(false);
      return;
    }
  
    const subscription = await registration.pushManager.getSubscription();
  
    setIsNotificationOn(!!subscription);
  }

  async function loadFriends() {
    const currentUser = getCurrentUser();
  
    if (!currentUser) return;
  
    const { data: friendRows, error: friendError } = await supabase
      .from("friends")
      .select("id, friend_user_id")
      .eq("owner_user_id", currentUser.userId);
  
    if (friendError) {
      console.error("friends取得エラー:", friendError);
      return;
    }
  
    const friendUserIds =
      friendRows?.map((friend) => friend.friend_user_id) || [];
  
    if (friendUserIds.length === 0) {
      setFriends([]);
      return;
    }
  
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, user_id, icon_url")
      .in("user_id", friendUserIds);
  
    if (profileError) {
      console.error("profiles取得エラー:", profileError);
      return;
    }
  
    const mappedFriends =
      profiles?.filter((profile) => friendUserIds.includes(profile.user_id)).map((profile) => ({
        id: profile.id,
        name: profile.name,
        userId: profile.user_id,
        iconUrl: profile.icon_url ?? undefined,
      })) || [];
  
    setFriends(mappedFriends);
  }

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setName(user.name);
      setIconUrl(user.iconUrl || "/images/user1-icon.jpg");
    }

    loadFriends();
    loadRecentPosts();
  }, []);

  async function loadRecentPosts() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
      setRecentPosts(await loadPostsData(currentUser.userId));
    } catch (error) {
      console.error("投稿取得エラー:", error);
    }
  }

  function getAvatarStoragePathFromUrl(url?: string | null) {
    if (!url) return null;
  
    const marker = "/storage/v1/object/public/avatars/";
    const index = url.indexOf(marker);
  
    if (index === -1) return null;
  
    return url.slice(index + marker.length);
  }

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressedBase64 = await resizeImageFile(
      file,
      500,
      0.6
    );
    
    const response = await fetch(compressedBase64);
    const compressedBlob = await response.blob();
  
    const currentUser = getCurrentUser();
    if (!currentUser) return;
  
    const filePath = `${currentUser.userId}/avatar.jpg`;
  
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(
        filePath,
        compressedBlob,
        {
          contentType: "image/jpeg",
          upsert: true,
        }
      );
  
    if (uploadError) {
      console.error(uploadError);
      setMessage("画像アップロードに失敗しました");
      return;
    }
  
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ icon_url: publicUrl })
      .eq("user_id", currentUser.userId);

      if (profileUpdateError) {
        console.error("プロフィール画像URL更新エラー:", profileUpdateError);
        setMessage("プロフィール画像URLの保存に失敗しました");
        return;
      }

      setIconUrl(publicUrl);
      await updateCurrentUser({ iconUrl: publicUrl });
  
    onProfileChange();
    setMessage("プロフィール画像を更新しました");
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
  
    const currentUser = getCurrentUser();
  
    if (!currentUser) return;
  
    updateCurrentUser({ name });
  
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("user_id", currentUser.userId);
  
    if (error) {
      console.error(error);
      setMessage("保存に失敗しました");
      return;
    }
  
    onProfileChange();
    setMessage("ユーザー名を保存しました");
  };

  const handleAddFriend = async () => {
    setMessage("");
  
    const currentUser = getCurrentUser();
  
    if (!currentUser) return;
  
    if (!friendId.trim()) {
      setMessage("友だちIDを入力してください");
      return;
    }
  
    if (friendId === currentUser.userId) {
      setMessage("自分自身は追加できません");
      return;
    }
  
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", friendId)
      .single();
  
    if (profileError || !profile) {
      setMessage("ユーザーが見つかりませんでした");
      return;
    }
  
    const { error } = await supabase.from("friends").insert([
      {
        owner_user_id: currentUser.userId,
        friend_user_id: profile.user_id,
      },
      {
        owner_user_id: profile.user_id,
        friend_user_id: currentUser.userId,
      },
    ]);
  
      if (error) {
        console.error(error);
      
        if (error.code === "23505") {
          setMessage("このユーザーはすでに友だちです");
          return;
        }
      
        setMessage("追加に失敗しました");
        return;
      }
  
      setFriendId("");
      setMessage("友だちを追加しました");

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          to_user_id: profile.user_id,
          from_user_id: currentUser.userId,
          from_user_name: currentUser.name,
          type: "friend",
          message: `${currentUser.userId}さんがあなたを友だち追加しました`,
        });

      if (notificationError) {
        console.error("通知作成エラー:", notificationError);
        setMessage(`通知作成エラー: ${notificationError.message}`);
        return;
      }

      await sendPushNotification({
        toUserId: profile.user_id,
        title: "友達追加",
        body: `${currentUser.name}さんがあなたを友だち追加しました`,
      });

      await loadFriends();
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
  
    return outputArray;
  }

  const handleEnableNotifications = async () => {
    const currentUser = getCurrentUser();
  
    if (!currentUser) return;
  
    if (!("Notification" in window)) {
      setPopup({ title: "通知に対応していません", message: "この端末では通知機能を利用できません。" });
      return;
    }
  
    if (!("serviceWorker" in navigator)) {
      setPopup({ title: "通知に対応していません", message: "この端末ではService Workerを利用できません。" });
      return;
    }
  
    const permission = await Notification.requestPermission();
  
    setNotificationPermission(permission);
  
    if (permission !== "granted") {
      setPopup({ title: "通知が許可されませんでした", message: "ブラウザの通知許可を確認してください。" });
      return;
    }
  
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
  
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  
      if (!publicKey) {
        setPopup({ title: "通知設定が不足しています", message: "VAPID公開鍵が設定されていません。" });
        return;
      }
  
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
  
      const subscriptionJson = subscription.toJSON();
  
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: currentUser.userId,
            endpoint: subscription.endpoint,
            p256dh: subscriptionJson.keys?.p256dh,
            auth: subscriptionJson.keys?.auth,
          },
          {
            onConflict: "endpoint",
          }
        );
  
      if (error) {
        console.error("Push購読保存エラー:", error);
        setPopup({ title: "通知設定の保存に失敗しました", message: "時間をおいてもう一度試してください。" });
        return;
      }
  
      setIsNotificationOn(true);
      setMessage("通知を有効化しました");
    } catch (error) {
      console.error(error);
      setPopup({ title: "Push通知の登録に失敗しました", message: "通知設定またはブラウザ設定を確認してください。" });
    }
  };

  const handleDisableNotifications = async () => {
    const currentUser = getCurrentUser();
  
    if (!currentUser) return;
  
    if (!("serviceWorker" in navigator)) {
      setPopup({ title: "通知に対応していません", message: "この端末ではService Workerを利用できません。" });
      return;
    }
  
    try {
      const registration = await navigator.serviceWorker.getRegistration();
  
      if (!registration) {
        setPopup({ title: "通知登録が見つかりません", message: "すでに通知が無効になっている可能性があります。" });
        return;
      }
  
      const subscription = await registration.pushManager.getSubscription();
  
      if (!subscription) {
        setPopup({ title: "通知登録が見つかりません", message: "すでに通知が無効になっている可能性があります。" });
        return;
      }
  
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", subscription.endpoint);
  
        if (error) {
          console.error("Push購読保存エラー:", error);
          setPopup({ title: "通知設定の保存に失敗しました", message: error.message });
          return;
        }
  
      await subscription.unsubscribe();
  
      setIsNotificationOn(false);
      setMessage("通知を無効化しました");
    } catch (error) {
      console.error(error);
      setPopup({ title: "通知の無効化に失敗しました", message: "時間をおいてもう一度試してください。" });
    }
  };

  const handleDeleteFriend = async (friendUserId: string) => {
    setPopup({
      title: "友だちを削除しますか？",
      message: "この友だちを一覧から削除します。",
      confirmLabel: "削除する",
      cancelLabel: "やめる",
      onConfirm: async () => {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const { data: deletedRows1, error: deleteError1 } = await supabase
          .from("friends")
          .delete()
          .eq("owner_user_id", currentUser.userId)
          .eq("friend_user_id", friendUserId)
          .select();

        if (deleteError1) {
          console.error("友だち削除エラー1:", deleteError1);
          setMessage("友だち削除に失敗しました");
          return;
        }

        const { data: deletedRows2, error: deleteError2 } = await supabase
          .from("friends")
          .delete()
          .eq("owner_user_id", friendUserId)
          .eq("friend_user_id", currentUser.userId)
          .select();

        console.log("削除対象1:", currentUser.userId, friendUserId, deletedRows1);
        console.log("削除対象2:", friendUserId, currentUser.userId, deletedRows2);

        if (deleteError2) {
          console.error("友だち削除エラー2:", deleteError2);
          setMessage("友だち削除に失敗しました");
          return;
        }

        setFriends((prev) =>
          prev.filter((friend) => friend.userId !== friendUserId)
        );

        setMessage("友だちを削除しました");
        await loadFriends();
      },
    });
  };
  return (
    <ScreenShell
      label="MY PAGE"
      title="マイページ"
      action={<HeaderAvatar iconUrl={iconUrl} />}
    >
      <section className="h-[110px] rounded-[8px] bg-[#fffaf2]/94 p-3 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <div className="flex items-center gap-5">
          <label className="relative shrink-0">
            <img
              src={iconUrl}
              alt="プロフィール画像"
              className="h-[64px] w-[64px] rounded-full bg-[#dcebc9] object-cover ring-4 ring-[#fff8e6]"
            />
            <input type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
          </label>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[19px] font-black leading-tight text-[#3f2116]">
              {name || currentUser?.name || "ユーザー"}
            </h2>
            <p className="mt-0.5 truncate text-[11px] font-black text-[#3f2116]/52">
              @{currentUser?.userId}
            </p>
            <div className="mt-2 flex min-w-0 items-center gap-[7px]">
              <button
                type="button"
                onClick={() => setIsNameEditorOpen((value) => !value)}
                className="inline-flex h-[25px] w-[128px] items-center justify-center gap-1 whitespace-nowrap rounded-[13px] bg-[#0f6a47] px-1.5 text-[7px] font-black text-[#fff8e6]"
              >
                <PencilIcon className="h-[10px] w-[10px]" />
                プロフィール編集
              </button>
              <button
                type="button"
                onClick={isNotificationOn ? handleDisableNotifications : handleEnableNotifications}
                className="inline-flex h-[25px] w-[101px] items-center justify-center gap-1 whitespace-nowrap rounded-[13px] bg-[#fff8e6] px-2 text-[7px] font-black text-[#3f2116] ring-1 ring-[#dfc79d]"
              >
                <BellIcon className="h-[10px] w-[10px]" />
                通知設定
              </button>
            </div>
          </div>
        </div>

        {isNameEditorOpen && (
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="表示名"
              className="min-w-0 rounded-[6px] border border-[#dfc79d] bg-[#fffaf2] px-3 py-2 text-[var(--text-primary-button)] font-bold outline-none"
            />
            <button
              type="button"
              onClick={handleSaveName}
              className="rounded-full bg-[#0f6a47] px-4 py-2 text-[var(--text-primary-button)] font-black text-[#fff8e6]"
            >
              保存
            </button>
          </div>
        )}
      </section>

      <section className="relative mt-2 h-[112px] overflow-hidden rounded-[8px] bg-[#fffaf2]/94 p-3 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <div className="flex items-center justify-between">
          <h2 className="text-[var(--text-card-heading)] font-black text-[#3f2116]">つながり</h2>
          <button
            type="button"
            onClick={() => setIsFriendEditorOpen((value) => !value)}
            className="absolute right-3 top-[48px] z-20 w-[108px] whitespace-nowrap rounded-[13px] bg-[#fff8e6] px-2 py-1.5 text-[7px] font-black text-[#0f6a47] shadow-[0_7px_15px_rgba(63,33,22,0.09)] ring-1 ring-[#dfc79d]"
          >
            ＋ 家族を追加
          </button>
        </div>

        {isFriendEditorOpen && (
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <input
              value={friendId}
              onChange={(event) => setFriendId(event.target.value)}
              placeholder="家族ID"
              className="min-w-0 rounded-[6px] border border-[#dfc79d] bg-[#fffaf2] px-3 py-2 text-[var(--text-primary-button)] font-bold outline-none"
            />
            <button
              type="button"
              onClick={handleAddFriend}
              className="rounded-full bg-[#0f6a47] px-4 py-2 text-[var(--text-primary-button)] font-black text-[#fff8e6]"
            >
              追加
            </button>
          </div>
        )}

        {friends.length === 0 ? (
          <div className="mt-2">
            <EmptyState title="まだ家族はいません" />
          </div>
        ) : (
          <div className="relative mt-1 h-[66px]">
            <div className="absolute left-[82px] top-[25px] w-[92px] border-t-2 border-dotted border-[#9a5f3f]/50" />
            <span className="absolute left-[124px] top-[18px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#fff8e6] text-[#9a5f3f]">
              <HomeBadgeIcon className="h-[10px] w-[10px]" />
            </span>
            {friends.slice(0, 2).map((friend, index) => (
              <div
                key={friend.id}
                className="absolute top-0 z-10 w-[62px] text-center"
                style={{ left: index === 0 ? 4 : 154 }}
              >
                {friend.iconUrl ? (
                  <img
                    src={friend.iconUrl}
                    alt={`${friend.name}のプロフィール画像`}
                    draggable={false}
                    className="mx-auto h-[48px] w-[48px] shrink-0 rounded-full bg-[#dcebc9] object-cover ring-4 ring-[#fff8e6]"
                  />
                ) : (
                  <div className="mx-auto flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[#dcebc9] text-[16px] font-black text-[#2f6b4f] ring-4 ring-[#fff8e6]">
                    {friend.name.slice(0, 1)}
                  </div>
                )}
                <p className="mt-1 truncate text-[10px] font-black leading-none text-[#3f2116]">
                  {friend.name}
                </p>
                <button
                  type="button"
                  onClick={() => handleDeleteFriend(friend.userId)}
                  className="absolute -right-1 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-red-500 opacity-0 shadow-sm focus:opacity-100"
                  aria-label={`${friend.name}を削除`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-3 h-[100px] overflow-hidden rounded-[8px] bg-[#fffaf2]/94 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <button
          type="button"
          onClick={() => setIsNameEditorOpen((value) => !value)}
          className="flex h-[33px] w-full items-center justify-between border-b border-[#dfc79d]/55 px-4 text-[var(--text-menu-label)] font-black leading-none text-[#3f2116]"
        >
          <span className="flex items-center gap-3">
            <BookmarkIcon className="h-[15px] w-[15px]" />
            投稿者の保存
          </span>
          <ChevronIcon className="h-[13px] w-[13px] text-[#9d7140]" />
        </button>
        <button
          type="button"
          onClick={isNotificationOn ? handleDisableNotifications : handleEnableNotifications}
          className="flex h-[33px] w-full items-center justify-between border-b border-[#dfc79d]/55 px-4 text-[var(--text-menu-label)] font-black leading-none text-[#3f2116]"
        >
          <span className="flex items-center gap-3">
            <BellIcon className="h-[15px] w-[15px]" />
            プッシュ通知
          </span>
          <ChevronIcon className="h-[13px] w-[13px] text-[#9d7140]" />
        </button>
        <button
          type="button"
          onClick={() => {
            logoutUser();
            onProfileChange();
          }}
          className="flex h-[34px] w-full items-center justify-between px-4 text-[var(--text-menu-label)] font-black leading-none text-[#3f2116]"
        >
          <span className="flex items-center gap-3">
            <LogoutIcon className="h-[15px] w-[15px]" />
            ログアウト
          </span>
          <ChevronIcon className="h-[13px] w-[13px] text-[#9d7140]" />
        </button>
      </section>

      <section className="mt-2 rounded-[8px] bg-[#fffaf2]/94 p-3 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <div className="flex items-center justify-between">
          <h2 className="text-[var(--text-card-heading)] font-black text-[#3f2116]">最近の記録</h2>
          <button className="inline-flex items-center gap-1 text-[9.5px] font-black leading-none text-[#0f6a47]">
            すべて見る
            <ChevronIcon className="h-[10px] w-[10px]" />
          </button>
        </div>
        {recentPosts[0] ? (
          <div className="mt-1">
            <h3 className="truncate text-[11px] font-black text-[#3f2116]">
              {recentPosts[0].dishName || "今日の料理"}
            </h3>
            <p className="text-[8.5px] font-black leading-none text-[#3f2116]/52">
              {formatRecentTime(recentPosts[0].createdAt)}
            </p>
            <MiniChekiTriplet
              post={recentPosts[0]}
              className="mt-1.5 gap-1.5 px-1 [&>div]:p-1 [&>div]:pb-4 [&>div]:rounded-[3px] [&>div_img]:rounded-[2px] [&>div_p]:mt-1 [&>div_p]:text-[9px]"
            />
            <div className="mt-1.5 flex items-center gap-5 text-[10px] font-black leading-none text-[#3f2116]">
              <span className="flex items-center gap-1">
                <HeartLineIcon className="h-[13px] w-[13px]" />
                {recentPosts[0].likeCount && recentPosts[0].likeCount > 0
                  ? `${recentPosts[0].likeCount}いいね`
                  : "いいね"}
              </span>
              <span className="flex items-center gap-1">
                <CommentLineIcon className="h-[13px] w-[13px]" />
                {recentPosts[0].commentCount && recentPosts[0].commentCount > 0
                  ? `${recentPosts[0].commentCount}コメント`
                  : "コメント"}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <EmptyState title="投稿はありません" />
          </div>
        )}
      </section>

        {message && (
        <p className="mt-2 rounded-[6px] bg-[#fff8e6] px-3 py-2 text-[11px] font-black text-[#0f6a47]">
            {message}
          </p>
        )}
      <AppPopup popup={popup} onClose={() => setPopup(null)} />
    </ScreenShell>
  );
}

function formatRecentTime(createdAt?: string) {
  if (!createdAt) return "たった今";

  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return "たった今";

  const minutes = Math.max(0, Math.round((Date.now() - created) / 60000));
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}時間前`;

  return `${Math.round(hours / 24)}日前`;
}

function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.05" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.05" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BookmarkIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 4.5h11v15l-5.5-3-5.5 3v-15Z" />
    </svg>
  );
}

function HomeBadgeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M4.2 11.1 12 4.7l7.8 6.4-1.35 1.55-.95-.78V19a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-7.13l-.95.78-1.35-1.55Zm5.05 6.9h5.5v-5.25h-5.5V18Z" />
    </svg>
  );
}

function LogoutIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 5H6.8A2.3 2.3 0 0 0 4.5 7.3v9.4A2.3 2.3 0 0 0 6.8 19h2.7" />
      <path d="M13.5 8.2 17.3 12l-3.8 3.8" />
      <path d="M17.1 12H9.5" />
    </svg>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
