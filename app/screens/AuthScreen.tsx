"use client";

import { useEffect, useState } from "react";
import {
  getCurrentUser,
  logoutUser,
  registerUser,
  loginUser,
} from "../lib/auth";

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
    return <main className="min-h-screen bg-[#f4a72d]" />;
  }

  if (currentUser) {
    return (
      <div className="min-h-screen px-5 pt-6 text-[#3f2116]">
        <div className="rounded-[30px] bg-[#fffaf2]/94 p-6 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
          <p className="text-sm font-black text-[#0f6a47]">ログイン中</p>
          <h1 className="mt-1 text-3xl font-black">{currentUser.name}</h1>
          <p className="mt-2 text-sm font-bold">@{currentUser.userId}</p>

          <button
            onClick={() => {
              logoutUser();
              setCurrentUser(null);
              onAuthChange();
            }}
            className="mt-6 w-full rounded-full bg-[#0f6a47] py-3 font-black text-[#fff8e6] shadow-[0_12px_26px_rgba(15,106,71,0.24)] transition active:scale-[0.98]"
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
    <main className="min-h-screen px-5 pt-14 text-[#3f2116]">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <p className="text-[11px] font-black text-white/85">ごはんなにかな</p>
          <h1 className="mt-2 text-[40px] font-black leading-[1.08]">
            今日の料理を
            <br />
            友だちと共有
          </h1>
        </header>

        <div className="rounded-[30px] bg-[#fffaf2]/94 p-6 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65">

        <div className="grid grid-cols-2 rounded-full border border-[#dfc79d]/70 bg-[#fff8e6]/80 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`rounded-full py-2.5 text-sm font-black transition active:scale-[0.98] ${
              mode === "login"
                ? "bg-[#0f6a47] text-white"
                : "text-[#3f2116]"
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
            className={`rounded-full py-2.5 text-sm font-black transition active:scale-[0.98] ${
              mode === "register"
                ? "bg-[#0f6a47] text-white"
                : "text-[#3f2116]"
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
              className="w-full rounded-[18px] border border-[#dfc79d] bg-[#fffaf2] px-4 py-3 font-bold outline-none transition focus:border-[#0f6a47]"
            />
          )}

          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="ID"
            className="w-full rounded-[18px] border border-[#dfc79d] bg-[#fffaf2] px-4 py-3 font-bold outline-none transition focus:border-[#0f6a47]"
          />
        </div>

        {error && (
          <p className="mt-4 text-sm font-black text-red-500">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full rounded-full bg-[#0f6a47] py-4 text-base font-black text-[#fff8e6] shadow-[0_12px_26px_rgba(15,106,71,0.28)] transition active:scale-[0.98]"
        >
          {mode === "login" ? "ログイン" : "新規登録"}
        </button>
        </div>
      </div>
    </main>
  );
}
