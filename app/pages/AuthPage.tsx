"use client";

import { useEffect, useState } from "react";
import {
  getCurrentUser,
  logoutUser,
  registerUser,
  loginUser,
} from "../utils/auth";

export default function AuthPage({
  onAuthChange,
}: {
  onAuthChange: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] =
    useState<ReturnType<typeof getCurrentUser>>(null);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    setCurrentUser(getCurrentUser());
  }, []);

  if (!mounted) {
    return <main className="min-h-screen bg-[#f8b72a]" />;
  }

  if (currentUser) {
    return (
      <div className="min-h-screen bg-[#f8b72a] px-5 pt-6 text-[#6b2f13]">
        <div className="rounded-[32px] bg-white p-6 shadow-xl">
          <p className="text-sm font-black text-[#f39a00]">ログイン中</p>
          <h1 className="mt-1 text-3xl font-black">{currentUser.name}</h1>
          <p className="mt-2 text-sm font-bold">@{currentUser.userId}</p>

          <button
            onClick={() => {
              logoutUser();
              setCurrentUser(null);
              onAuthChange();
            }}
            className="mt-6 w-full rounded-full bg-[#6b2f13] py-3 font-black text-white"
          >
            ログアウト
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError("");

    if (!userId.trim()) {
      setError("IDを入力してください");
      return;
    }

    try {
      if (mode === "login") {
        const user = await loginUser(userId.trim());

        if (!user) {
          setError("ユーザーが見つかりません");
          return;
        }

        setCurrentUser(user);
        onAuthChange();
        return;
      }

      if (!name.trim()) {
        setError("ユーザー名を入力してください");
        return;
      }

      const user = await registerUser(name.trim(), userId.trim());
      setCurrentUser(user);
      onAuthChange();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "エラーが発生しました"
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#f8b72a] px-5 pt-20 text-[#6b2f13]">
      <div className="rounded-[36px] bg-white p-7 shadow-xl">
        <p className="text-sm font-black text-[#f39a00]">Cooking SNS Demo</p>

        <h1 className="mt-2 text-4xl font-black leading-tight">
          今日の料理を
          <br />
          友だちと共有
        </h1>

        <div className="mt-6 grid grid-cols-2 rounded-full bg-[#fff4d7] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`rounded-full py-2 text-sm font-black ${
              mode === "login"
                ? "bg-[#f39a00] text-white"
                : "text-[#6b2f13]"
            }`}
          >
            ログイン
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`rounded-full py-2 text-sm font-black ${
              mode === "register"
                ? "bg-[#f39a00] text-white"
                : "text-[#6b2f13]"
            }`}
          >
            新規登録
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {mode === "register" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ユーザー名"
              className="w-full rounded-2xl border-2 border-[#f1d59a] px-4 py-3 font-bold outline-none"
            />
          )}

          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="ID"
            className="w-full rounded-2xl border-2 border-[#f1d59a] px-4 py-3 font-bold outline-none"
          />
        </div>

        {error && (
          <p className="mt-4 text-sm font-black text-red-500">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full rounded-full bg-[#f39a00] py-4 text-lg font-black text-white"
        >
          {mode === "login" ? "ログイン" : "新規登録"}
        </button>
      </div>
    </main>
  );
}