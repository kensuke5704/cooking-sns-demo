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
      profiles?.filter((profile) => friendUserIds.includes(profile.user_id)).map((profile) => ({
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
    <main className="min-h-[100dvh] bg-[#f4a72d] text-[#3f2116]">
      <div className="relative mx-auto h-[100dvh] w-full max-w-md overflow-hidden">
        <img
          src="/design-targets/mypage-reference-shell.png"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-fill"
          aria-hidden="true"
        />

        <div className="absolute left-[7%] right-[7%] top-[7.8%] h-[17.5%] rounded-[8px] bg-[#fffaf2]" />
        <label className="absolute left-[9.5%] top-[8.9%] h-[78px] w-[78px]">
          <img
            src={iconUrl}
            alt="プロフィール画像"
            className="h-[78px] w-[78px] rounded-full object-cover"
          />
          <input type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
        </label>
        <h2 className="absolute left-[37%] top-[8.9%] max-w-[48%] truncate text-[20px] font-black leading-tight text-[#3f2116]">
          {name || currentUser?.name || "ユーザー"}
        </h2>
        <p className="absolute left-[37%] top-[14%] max-w-[48%] truncate text-[11px] font-black text-[#3f2116]/52">
          @{currentUser?.userId}
        </p>
        <button
          type="button"
          onClick={isNotificationOn ? handleDisableNotifications : handleEnableNotifications}
          className="absolute left-[70%] top-[19.2%] h-[27px] w-[20%] rounded-full opacity-0"
          aria-label="通知設定"
        />
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="absolute left-[9.5%] top-[25.3%] h-[32px] w-[60%] rounded-[6px] border border-[#dfc79d] bg-[#fffaf2] px-3 text-[11px] font-bold text-[#3f2116] outline-none"
        />
        <button
          type="button"
          onClick={handleSaveName}
          className="absolute right-[8.5%] top-[25.3%] h-[32px] w-[19%] rounded-full bg-[#0f6a47] text-[11px] font-black text-[#fff8e6]"
        >
          保存
        </button>

        <div className="absolute left-[7%] right-[7%] top-[36.2%] h-[20.2%] rounded-[8px] bg-[#fffaf2]" />
        <div className="absolute left-[7%] top-[39%] flex gap-5">
          {friends.slice(0, 2).map((friend) => (
            <div key={friend.id} className="w-[54px] text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#dcebc9] text-[18px] font-black text-[#2f6b4f]">
                {friend.name.slice(0, 1)}
              </div>
              <p className="mt-1 truncate text-[9px] font-black text-[#3f2116]">
                {friend.name}
              </p>
            </div>
          ))}
        </div>
        <input
          value={friendId}
          onChange={(event) => setFriendId(event.target.value)}
          placeholder="家族ID"
          className="absolute left-[50%] top-[41.2%] h-[28px] w-[18%] rounded-[6px] border border-[#dfc79d] bg-[#fffaf2] px-2 text-[10px] font-bold outline-none"
        />
        <button
          type="button"
          onClick={handleAddFriend}
          className="absolute left-[70%] top-[41.2%] h-[28px] w-[22%] rounded-full bg-[#fffaf2] text-[10px] font-black text-[#0f6a47] ring-1 ring-[#dfc79d]"
        >
          追加
        </button>
        {friends.slice(0, 3).map((friend, index) => (
          <button
            key={friend.id}
            type="button"
            onClick={() => handleDeleteFriend(friend.userId)}
            className="absolute right-[8%] h-[22px] w-[40px] rounded-full bg-white/90 text-[9px] font-black text-red-500"
            style={{ top: `${48.2 + index * 5.2}%` }}
          >
            削除
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            logoutUser();
            onProfileChange();
          }}
          className="absolute left-[6%] top-[60.7%] h-[31px] w-[87%] opacity-0"
          aria-label="ログアウト"
        />

        <div className="absolute left-[7%] right-[7%] top-[72.3%] h-[18%] rounded-[8px] bg-[#fffaf2]" />
        {recentPosts[0] ? (
          <div className="absolute left-[7%] right-[7%] top-[74.8%]">
            <h3 className="truncate text-[11px] font-black text-[#3f2116]">
              {recentPosts[0].dishName || "今日の料理"}
            </h3>
            <MiniChekiTriplet post={recentPosts[0]} className="mt-2" />
          </div>
        ) : (
          <div className="absolute left-[8%] right-[8%] top-[76%]">
            <EmptyState title="投稿はありません" />
          </div>
        )}

        {message && (
          <p className="absolute left-[7%] right-[7%] top-[32%] rounded-[6px] bg-[#fff8e6] px-2 py-1 text-[10px] font-black text-[#0f6a47]">
            {message}
          </p>
        )}
      </div>
      <AppPopup popup={popup} onClose={() => setPopup(null)} />
    </main>
  );
}

function ProfileMenuRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#dfc79d]/55 px-4 py-3 text-[13px] font-black text-[#3f2116]">
      {label}
      <span className="text-[#7a4328]/55">›</span>
    </div>
  );
}
