"use client";

import { useState } from "react";
import { getCurrentUser, logoutUser, registerUser } from "../utils/auth";

export default function AuthPage({ onAuthChange }: { onAuthChange: () => void }) {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");

  const currentUser = getCurrentUser();

  const handleRegister = () => {
    if (!name || !userId) {
      alert("名前とユーザーIDを入力してください");
      return;
    }

    registerUser(name, userId);
    onAuthChange();
  };

  const handleLogout = () => {
    logoutUser();
    onAuthChange();
  };

  if (currentUser) {
    return (
      <div className="px-5 pt-6">
        <div className="bg-[#6b2f13] text-white rounded-[32px] p-6 shadow-md">
          <p className="text-sm opacity-90">ログイン中</p>
          <h1 className="text-3xl font-black mt-1">{currentUser.name}</h1>
          <p className="mt-2 text-sm font-bold">@{currentUser.userId}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-6 bg-white/50 text-[#6b2f13] font-black py-4 rounded-2xl"
        >
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <div className="bg-[#6b2f13] text-white rounded-[32px] p-6 shadow-md">
        <p className="text-sm opacity-90">はじめる</p>
        <h1 className="text-3xl font-black mt-1">会員登録</h1>
      </div>

      <div className="mt-6 bg-white/50 rounded-[32px] p-5 space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="名前"
          className="w-full rounded-2xl px-4 py-3 font-bold text-[#6b2f13]"
        />

        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="ユーザーID"
          className="w-full rounded-2xl px-4 py-3 font-bold text-[#6b2f13]"
        />

        <button
          onClick={handleRegister}
          className="w-full bg-[#ffcf33] text-black font-black py-4 rounded-2xl"
        >
          登録する
        </button>
      </div>
    </div>
  );
}