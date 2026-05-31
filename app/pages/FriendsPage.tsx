"use client";

import { useState } from "react";
import {
  addFriend,
  getCurrentUser,
  getFriends,
  searchUserByUserId,
  type AppUser,
} from "../utils/auth";

export default function FriendsPage() {
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<AppUser | null>(null);
  const [friends, setFriends] = useState(getFriends());

  const currentUser = getCurrentUser();

  const handleSearch = () => {
    if (!searchId) {
      alert("ユーザーIDを入力してください");
      return;
    }

    const result = searchUserByUserId(searchId);

    if (!result) {
      alert("ユーザーが見つかりませんでした");
      setSearchResult(null);
      return;
    }

    if (currentUser?.userId === result.userId) {
      alert("自分自身は追加できません");
      setSearchResult(null);
      return;
    }

    setSearchResult(result);
  };

  const handleAddFriend = () => {
    if (!searchResult) return;

    const nextFriends = addFriend(searchResult.name, searchResult.userId);
    setFriends(nextFriends);
    setSearchResult(null);
    setSearchId("");
  };

  if (!currentUser) {
    return (
      <div className="px-5 pt-6">
        <div className="bg-white/50 rounded-[32px] p-6 text-center">
          <h1 className="text-2xl font-black text-[#6b2f13]">
            会員登録が必要です
          </h1>
          <p className="mt-3 text-sm font-bold text-[#6b2f13]/70">
            友だち機能を使うには、まず会員登録してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <div className="bg-[#6b2f13] text-white rounded-[32px] p-6 shadow-md">
        <p className="text-sm opacity-90">IDでつながる</p>
        <h1 className="text-3xl font-black mt-1">友だち</h1>
      </div>

      <section className="mt-6 bg-white/50 rounded-[32px] p-5">
        <h2 className="text-xl font-black text-[#6b2f13]">
          ユーザーID検索
        </h2>

        <div className="mt-4 flex gap-2">
          <input
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="例：kensuke5704"
            className="flex-1 rounded-2xl px-4 py-3 font-bold text-[#6b2f13]"
          />

          <button
            onClick={handleSearch}
            className="bg-[#ffcf33] text-black font-black px-4 rounded-2xl"
          >
            検索
          </button>
        </div>

        {searchResult && (
          <div className="mt-5 bg-white/70 rounded-2xl p-4">
            <p className="font-black text-[#6b2f13]">{searchResult.name}</p>
            <p className="text-sm font-bold text-[#6b2f13]/60">
              @{searchResult.userId}
            </p>

            <button
              onClick={handleAddFriend}
              className="w-full mt-4 bg-[#6b2f13] text-white font-black py-3 rounded-2xl"
            >
              友だち追加
            </button>
          </div>
        )}
      </section>

      <section className="mt-6 bg-white/50 rounded-[32px] p-5">
        <h2 className="text-xl font-black text-[#6b2f13]">友だち一覧</h2>

        {friends.length === 0 ? (
          <p className="mt-3 text-sm font-bold text-[#6b2f13]/70">
            まだ友だちはいません
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white/70 rounded-2xl px-4 py-3"
              >
                <p className="font-black text-[#6b2f13]">{friend.name}</p>
                <p className="text-sm font-bold text-[#6b2f13]/60">
                  @{friend.userId}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}