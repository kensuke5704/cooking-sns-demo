"use client";

import { useEffect, useState } from "react";
import {
  addFriend,
  getCurrentUser,
  getFriends,
  searchUserByUserId,
  updateCurrentUser,
  type Friend,
} from "../utils/auth";

export default function ProfilePage({
  onProfileChange,
}: {
  onProfileChange: () => void;
}) {
  const [name, setName] = useState("");
  const [userIcon, setUserIcon] = useState("/images/user1-icon.jpg");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendId, setFriendId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setName(user.name);
      setUserIcon((user as any).userIcon || "/images/user1-icon.jpg");
    }

    setFriends(getFriends());
  }, []);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result as string;
      setUserIcon(imageData);
      updateCurrentUser({ userIcon: imageData } as any);
      onProfileChange();
    };

    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    if (!name.trim()) return;

    updateCurrentUser({ name });
    onProfileChange();
    setMessage("ユーザー名を保存しました");
  };

  const handleAddFriend = () => {
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

    const user = searchUserByUserId(friendId);

    if (!user) {
      setMessage("ユーザーが見つかりませんでした");
      return;
    }

    const nextFriends = addFriend(user.name, user.userId);
    setFriends(nextFriends);
    setFriendId("");
    setMessage("友だちを追加しました");
  };

  return (
    <main className="min-h-screen bg-[#f8b72a] px-5 pt-6 pb-28 text-[#6b2f13]">
      <div className="mx-auto max-w-md">
        <h1 className="mb-5 text-3xl font-black">プロフィール</h1>

        <section className="rounded-[32px] bg-white p-5 shadow-xl">
          <div className="flex items-center gap-4">
            <img
              src={userIcon}
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

                  <span className="text-xl">👤</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}