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
import AppPopup, { type AppPopupState } from "../components/common/AppPopup";

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
  }, []);

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
    <main className="min-h-screen bg-[#f8b72a] px-5 pt-6 pb-28 text-[#6b2f13]">
      <div className="mx-auto max-w-md">
        <h1 className="mb-5 text-3xl font-black">プロフィール</h1>

        <section className="rounded-[32px] bg-white p-5 shadow-xl">
          <div className="flex items-center gap-4">
            <img
              src={iconUrl}
              alt="プロフィール画像"
              className="h-24 w-24 rounded-full border-4 border-[#f8b72a] object-cover"
            />

            <div>
              <p className="text-sm font-bold opacity-60">プロフィール画像</p>
              <label className="mt-2 inline-block rounded-full bg-[#f39a00] px-4 py-2 text-sm font-black text-white">
                画像を変更
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-black">ユーザー名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-2xl border-2 border-[#f1d59a] px-4 py-3 font-bold outline-none"
            />

            <button
              onClick={handleSaveName}
              className="mt-3 w-full rounded-full bg-[#6b2f13] py-3 font-black text-white"
            >
              ユーザー名を保存
            </button>
            <div className="mt-4 rounded-2xl bg-[#fff4d7] px-4 py-3">
              <p className="text-xs font-black opacity-60">
                あなたのID
              </p>

              <p className="mt-1 text-lg font-black">
                @{currentUser?.userId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                logoutUser();
                onProfileChange();
              }}
              className="mt-4 w-full rounded-full bg-red-500 py-3 font-black text-white"
            >
              ログアウト
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-[32px] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black">友だち追加</h2>

          <div className="mt-3 flex gap-2">
            <input
              value={friendId}
              onChange={(e) => setFriendId(e.target.value)}
              placeholder="友だちのIDを入力"
              className="min-w-0 flex-1 rounded-2xl border-2 border-[#f1d59a] px-4 py-3 font-bold outline-none"
            />

            <button
              onClick={handleAddFriend}
              className="rounded-2xl bg-[#f39a00] px-4 font-black text-white"
            >
              追加
            </button>
          </div>

          {message && (
            <p className="mt-3 text-sm font-black text-[#f39a00]">
              {message}
            </p>
          )}
        </section>

        <section className="mt-5 rounded-[32px] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black">友だち一覧</h2>

          {friends.length === 0 ? (
            <p className="mt-3 text-sm font-bold opacity-60">
              まだ友だちはいません
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between rounded-2xl bg-[#fff4d7] px-4 py-3"
                >
                  <div>
                    <p className="font-black">{friend.name}</p>
                    <p className="text-sm font-bold opacity-60">
                      @{friend.userId}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFriend(friend.userId)}
                    className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[32px] bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">通知</h2>

            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                isNotificationOn
                  ? "bg-green-100 text-green-700"
                  : "bg-[#fff4d7] text-[#6b2f13]/60"
              }`}
            >
              {isNotificationOn ? "ON" : "OFF"}
            </span>
          </div>

          <p className="mt-2 text-sm font-bold opacity-60">
            現在の通知設定：{isNotificationOn ? "通知を受け取る" : "通知を受け取らない"}
          </p>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={handleEnableNotifications}
              disabled={isNotificationOn}
              className={`w-full rounded-2xl px-4 py-3 font-black text-white ${
                isNotificationOn ? "bg-gray-300" : "bg-[#f39a00]"
              }`}
            >
              通知を有効化
            </button>

            <button
              type="button"
              onClick={handleDisableNotifications}
              disabled={!isNotificationOn}
              className={`w-full rounded-2xl px-4 py-3 font-black ${
                isNotificationOn
                  ? "bg-[#fff4d7] text-[#6b2f13]"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              通知を無効化
            </button>
          </div>
        </section>
      </div>

      <AppPopup popup={popup} onClose={() => setPopup(null)} />
    </main>
  );
}