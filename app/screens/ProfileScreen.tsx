"use client";

import { useEffect, useState } from "react";
import {
  getCurrentUser,
  updateCurrentUser,
  logoutUser,
  type Friend,
} from "../lib/auth";
import { supabase } from "../lib/supabase";

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
  const currentUser = getCurrentUser();

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

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const currentUser = getCurrentUser();
    if (!currentUser) return;
  
    const fileExt = file.name.split(".").pop();
    const filePath = `${currentUser.userId}/avatar-${Date.now()}.${fileExt}`;
  
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
      });
  
    if (uploadError) {
      console.error(uploadError);
      setMessage("画像アップロードに失敗しました");
      return;
    }
  
    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
  
    const publicUrl = data.publicUrl;
  
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
  
    await loadFriends();
  };

  const handleDeleteFriend = async (friendUserId: string) => {
    const ok = confirm("この友だちを削除しますか？");
  
    if (!ok) return;
  
    const currentUser = getCurrentUser();
    if (!currentUser) return;
  
    const { error } = await supabase
      .from("friends")
      .delete()
      .or(
        `and(owner_user_id.eq.${currentUser.userId},friend_user_id.eq.${friendUserId}),and(owner_user_id.eq.${friendUserId},friend_user_id.eq.${currentUser.userId})`
      );
  
    if (error) {
      console.error(error);
      setMessage("友だち削除に失敗しました");
      return;
    }
  
    setMessage("友だちを削除しました");
    await loadFriends();
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
      </div>
    </main>
  );
}