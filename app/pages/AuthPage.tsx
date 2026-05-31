"use client";

import { useEffect, useState } from "react";
import {
  getCurrentUser,
  registerUser,
  logoutUser,
} from "../utils/auth";

export default function AuthPage({ onAuthChange }: { onAuthChange: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentUser(getCurrentUser());
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#f8b72a] text-[#6b2f13]" />
    );
  }

  if (currentUser) {
    return (
      <div className="px-5 pt-6">
        <div className="bg-[#6b2f13] text-white rounded-[32px] p-6 shadow-xl">
          <p className="text-sm opacity-90">ログイン中</p>
          <h1 className="text-3xl font-black mt-1">{currentUser.name}</h1>
          <p className="mt-2 text-sm font-bold">@{currentUser.userId}</p>

          <button
            onClick={() => {
              logoutUser();
              setCurrentUser(null);
              onAuthChange();
            }}
            className="mt-6 w-full rounded-full bg-white text-[#6b2f13] py-3 font-black"
          >
            ログアウト
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8b72a] px-5 pt-20 text-[#6b2f13]">
      <div className="rounded-[36px] bg-white p-7 shadow-xl">
        <p className="text-sm font-black text-[#f39a00]">Cooking SNS Demo</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">
          今日の料理を
          <br />
          友だちと共有
        </h1>

        <button
          onClick={() => {
            registerUser("user", "user1");
            setCurrentUser(getCurrentUser());
            onAuthChange();
          }}
          className="mt-8 w-full rounded-full bg-[#f39a00] py-4 text-lg font-black text-white"
        >
          はじめる
        </button>
      </div>
    </main>
  );
}