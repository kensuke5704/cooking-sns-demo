"use client";

import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, type Friend } from "../lib/auth";
import { loadPostsData } from "../lib/posts";
import { sendPushNotification } from "../lib/sendPush";
import { supabase } from "../lib/supabase";
import type { Post } from "../types/post";
import EmptyState from "../components/common/EmptyState";
import ScreenShell from "../components/common/ScreenShell";
import MiniChekiTriplet from "../components/post/MiniChekiTriplet";

function InitialAvatar({ name }: { name: string }) {
  const initial = name.trim().slice(0, 1) || "家";

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#dcebc9] text-[24px] font-black text-[#2f6b4f] ring-2 ring-[#fff8e6]">
      {initial}
    </div>
  );
}

function BowlIllustration() {
  return (
    <div className="relative h-28" aria-hidden="true">
      <div className="absolute right-4 top-5 h-16 w-24 rounded-b-[42px] rounded-t-[18px] bg-[#f4a72d] shadow-[inset_0_-8px_0_rgba(122,67,40,0.12)]" />
      <div className="absolute right-6 top-3 h-9 w-20 rounded-[100%] bg-[#fff1ce] ring-2 ring-[#7a4328]/15" />
      <div className="absolute right-11 top-2 h-5 w-5 rounded-full bg-[#2f6b4f]" />
      <div className="absolute right-17 top-3 h-4 w-4 rounded-full bg-[#f2c7a7]" />
      <div className="absolute right-1 top-12 h-14 w-20 rounded-b-[36px] rounded-t-[16px] bg-[#e2a32f]" />
      <div className="absolute right-24 top-14 h-px w-16 border-t-2 border-dashed border-[#7a4328]/38" />
      <div className="absolute right-36 top-10 h-9 w-12 rounded-b-[24px] rounded-t-[12px] bg-[#fff1ce] ring-2 ring-[#7a4328]/15" />
    </div>
  );
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendId, setFriendId] = useState("");
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadFriends();
    loadRecentPosts();
  }, []);

  async function loadFriends() {
    const user = getCurrentUser();
    if (!user) return;

    const { data: friendRows, error: friendError } = await supabase
      .from("friends")
      .select("id, friend_user_id")
      .eq("owner_user_id", user.userId);

    if (friendError) {
      console.error("friends取得エラー:", friendError);
      return;
    }

    const friendUserIds = friendRows?.map((friend) => friend.friend_user_id) || [];
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

    setFriends(
      profiles?.map((profile) => ({
        id: profile.id,
        name: profile.name,
        userId: profile.user_id,
      })) || []
    );
  }

  async function loadRecentPosts() {
    const user = getCurrentUser();
    if (!user) return;

    try {
      setPosts(await loadPostsData(user.userId));
    } catch (error) {
      console.error("投稿取得エラー:", error);
    }
  }

  async function handleAddFriend() {
    setMessage("");

    if (!currentUser) return;
    if (!friendId.trim()) {
      setMessage("家族IDを入力してください");
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
      setMessage(error.code === "23505" ? "このユーザーはすでにつながっています" : "追加に失敗しました");
      return;
    }

    setFriendId("");
    setMessage("家族を追加しました");

    const { error: notificationError } = await supabase.from("notifications").insert({
      to_user_id: profile.user_id,
      from_user_id: currentUser.userId,
      from_user_name: currentUser.name,
      type: "friend",
      message: `${currentUser.userId}さんがあなたを友だち追加しました`,
    });

    if (notificationError) {
      console.error("通知作成エラー:", notificationError);
    }

    await sendPushNotification({
      toUserId: profile.user_id,
      title: "家族追加",
      body: `${currentUser.name}さんがあなたを追加しました`,
    });

    await Promise.all([loadFriends(), loadRecentPosts()]);
  }

  const latestPost = useMemo(
    () => posts.find((post) => post.userId !== currentUser?.userId) || posts[0],
    [currentUser?.userId, posts]
  );

  return (
    <ScreenShell>
      <section className="home-rise-in">
        <div className="mb-7 flex items-center justify-between">
          <h1 className="text-[36px] font-black leading-none text-[#3f2116]">
            つながり
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#fffaf2] text-[#3f2116] shadow-[0_12px_26px_rgba(63,33,22,0.12)]">
              <span className="text-[24px]">♪</span>
              <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-[#0f7d62]" />
            </div>
            <img
              src={currentUser?.iconUrl || "/images/user1-icon.jpg"}
              alt={currentUser?.name || "ユーザー"}
              className="h-14 w-14 rounded-full bg-[#fff8e6] object-cover ring-2 ring-[#fff8e6]"
            />
          </div>
        </div>

        <div className="rounded-[30px] bg-[#fffaf2]/94 p-6 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
          <div className="grid grid-cols-[1fr_132px] items-center gap-3">
            <div className="min-w-0">
              <h2 className="text-[28px] font-black leading-[1.22] text-[#3f2116]">
                家族の食卓が届く
              </h2>
              <p className="mt-4 text-[15px] font-bold leading-relaxed text-[#3f2116]/72">
                友だちや家族を追加すると、今日の料理がホームに並びます。
              </p>
            </div>
            <BowlIllustration />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-[28px] bg-[#fffaf2]/94 p-4 shadow-[0_18px_44px_rgba(63,33,22,0.12)] ring-1 ring-white/65">
          <label className="shrink-0 text-[15px] font-black text-[#3f2116]">
            家族ID
          </label>
          <input
            value={friendId}
            onChange={(event) => setFriendId(event.target.value)}
            placeholder="家族IDを入力"
            className="min-w-0 flex-1 rounded-[18px] border border-[#dfc79d] bg-[#fffaf2] px-4 py-3 text-[15px] font-bold text-[#3f2116] outline-none"
          />
          <button
            type="button"
            onClick={handleAddFriend}
            className="shrink-0 rounded-full bg-[#0f6a47] px-5 py-3 text-[15px] font-black text-[#fff8e6] shadow-[0_12px_24px_rgba(15,106,71,0.22)]"
          >
            追加する
          </button>
        </div>

        {message && (
          <p className="mt-3 rounded-[22px] bg-[#fffaf2]/88 px-4 py-3 text-sm font-black text-[#0f6a47]">
            {message}
          </p>
        )}
      </section>

      <section className="mt-5 rounded-[30px] bg-[#fffaf2]/94 p-5 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <h2 className="text-[22px] font-black text-[#3f2116]">つながっている人</h2>
        {friends.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="まだつながりはありません" />
          </div>
        ) : (
          <div className="mt-4 divide-y divide-[#dfc79d]/65">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-4 py-4">
                <InitialAvatar name={friend.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[18px] font-black text-[#3f2116]">
                    {friend.name}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#0f6a47]">
                    今日の投稿を確認できます
                  </p>
                </div>
                <span className="text-[28px] font-light text-[#7a4328]/55">›</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-5 rounded-[30px] bg-[#fffaf2]/94 p-5 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[21px] font-black text-[#3f2116]">最近届いたごはん</h2>
          <span className="text-sm font-black text-[#0f6a47]">すべて見る ›</span>
        </div>

        {latestPost ? (
          <div className="mt-5">
            <div className="flex items-center gap-3">
              <InitialAvatar name={latestPost.userName} />
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-[#3f2116]">
                  {latestPost.userName}
                </p>
                <p className="text-sm font-bold text-[#3f2116]/58">たった今</p>
              </div>
            </div>
            <h3 className="mt-4 break-words text-[20px] font-black leading-snug text-[#3f2116]">
              {latestPost.dishName || "今日の料理"}
            </h3>
            <MiniChekiTriplet post={latestPost} className="mt-4" />
            <div className="mt-5 flex justify-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0f6a47]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#d8cdb8]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#d8cdb8]" />
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState title="届いたごはんはありません" />
          </div>
        )}
      </section>
    </ScreenShell>
  );
}
