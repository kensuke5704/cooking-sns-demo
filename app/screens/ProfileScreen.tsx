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
import ScreenShell from "../components/common/ScreenShell";
import EmptyState from "../components/common/EmptyState";
import MiniChekiTriplet from "../components/post/MiniChekiTriplet";
import type { Post } from "../types/post";

export default function ProfilePage({
  onProfileChange,
}: {
  onProfileChange: () => void;
}) {
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("/images/user1-icon.jpg");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendId, setFriendId] = useState("");
  const [message, setMessage] = useState("");
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [isNotificationOn, setIsNotificationOn] = useState(false);
  const [popup, setPopup] = useState<AppPopupState | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
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
      .select("id, name, user_id")
      .in("user_id", friendUserIds);
  
    if (profileError) {
      console.error("profiles取得エラー:", profileError);
      return;
    }
  
    const mappedFriends =
      profiles?.map((profile) => ({
        id: profile.id,
        name: profile.name,
        userId: profile.user_id,
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
    <ScreenShell>
      <div className="mb-7 flex items-center justify-between">
        <h1 className="text-[36px] font-black leading-none text-[#3f2116]">
          マイページ
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#fffaf2] text-[24px] shadow-[0_12px_26px_rgba(63,33,22,0.12)]">
            ♡
            <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-[#0f7d62]" />
          </div>
          <img
            src={iconUrl}
            alt="プロフィール画像"
            className="h-14 w-14 rounded-full bg-[#fff8e6] object-cover ring-2 ring-[#fff8e6]"
          />
        </div>
      </div>

      <section className="rounded-[30px] bg-[#fffaf2]/94 p-6 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <div className="flex items-center gap-5">
          <img
            src={iconUrl}
            alt="プロフィール画像"
            className="h-28 w-28 shrink-0 rounded-full object-cover ring-4 ring-[#fff8e6]"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[30px] font-black leading-tight text-[#3f2116]">
              {name || currentUser?.name || "ユーザー"}
            </h2>
            <p className="mt-1 truncate text-[18px] font-black text-[#3f2116]/45">
              @{currentUser?.userId}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <label className="rounded-full bg-[#0f6a47] px-5 py-3 text-sm font-black text-[#fff8e6] shadow-[0_12px_24px_rgba(15,106,71,0.2)]">
                プロフィール編集
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={isNotificationOn ? handleDisableNotifications : handleEnableNotifications}
                className="rounded-full bg-[#fffaf2] px-5 py-3 text-sm font-black text-[#3f2116] ring-1 ring-[#dfc79d]"
              >
                通知設定
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 rounded-[18px] border border-[#dfc79d] bg-[#fffaf2] px-4 py-3 font-bold text-[#3f2116] outline-none"
          />
          <button
            type="button"
            onClick={handleSaveName}
            className="rounded-full bg-[#0f6a47] px-5 py-3 font-black text-[#fff8e6]"
          >
            保存
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-[30px] bg-[#fffaf2]/94 p-5 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <h2 className="text-[24px] font-black text-[#3f2116]">つながり</h2>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {friends.slice(0, 2).map((friend) => (
              <div key={friend.id} className="text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#dcebc9] text-[28px] font-black text-[#2f6b4f] ring-2 ring-[#fff8e6]">
                  {friend.name.slice(0, 1)}
                </div>
                <p className="mt-2 max-w-20 truncate text-sm font-black text-[#3f2116]">
                  {friend.name}
                </p>
              </div>
            ))}
            {friends.length === 0 && <EmptyState title="つながりはありません" />}
          </div>
          <div className="shrink-0">
            <div className="mb-3 flex gap-2">
              <input
                value={friendId}
                onChange={(e) => setFriendId(e.target.value)}
                placeholder="家族ID"
                className="w-28 rounded-[16px] border border-[#dfc79d] bg-[#fffaf2] px-3 py-2 text-sm font-bold outline-none"
              />
              <button
                type="button"
                onClick={handleAddFriend}
                className="rounded-full bg-[#fffaf2] px-4 py-2 text-sm font-black text-[#0f6a47] shadow-sm ring-1 ring-[#dfc79d]"
              >
                ＋ 家族を追加
              </button>
            </div>
          </div>
        </div>
        {message && (
          <p className="mt-4 rounded-[20px] bg-[#fff8e6] px-4 py-3 text-sm font-black text-[#0f6a47]">
            {message}
          </p>
        )}
      </section>

      <section className="mt-5 overflow-hidden rounded-[30px] bg-[#fffaf2]/94 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <ProfileMenuRow label="投稿の保存" />
        <ProfileMenuRow label="プッシュ通知" />
        <button
          type="button"
          onClick={() => {
            logoutUser();
            onProfileChange();
          }}
          className="flex w-full items-center justify-between px-6 py-5 text-left text-[20px] font-black text-[#3f2116]"
        >
          ログアウト
          <span className="text-[#7a4328]/55">›</span>
        </button>
      </section>

      <section className="mt-5 rounded-[30px] bg-[#fffaf2]/94 p-5 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[23px] font-black text-[#3f2116]">最近の記録</h2>
          <span className="text-sm font-black text-[#7a4328]/62">すべて見る ›</span>
        </div>

        {recentPosts[0] ? (
          <div className="mt-5">
            <h3 className="break-words text-[20px] font-black text-[#3f2116]">
              {recentPosts[0].dishName || "今日の料理"}
            </h3>
            <p className="mt-1 text-sm font-bold text-[#3f2116]/55">たった今</p>
            <MiniChekiTriplet post={recentPosts[0]} className="mt-4" />
            <div className="mt-5 flex items-center gap-7 text-[16px] font-black text-[#3f2116]">
              <span>♡ いいね</span>
              <span>○ コメント</span>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState title="最近の記録はありません" />
          </div>
        )}
      </section>

      <AppPopup popup={popup} onClose={() => setPopup(null)} />
    </ScreenShell>
  );
}

function ProfileMenuRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#dfc79d]/55 px-6 py-5 text-[20px] font-black text-[#3f2116]">
      {label}
      <span className="text-[#7a4328]/55">›</span>
    </div>
  );
}
