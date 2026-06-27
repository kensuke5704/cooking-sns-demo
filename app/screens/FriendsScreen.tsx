"use client";

import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, type Friend } from "../lib/auth";
import { loadPostsData } from "../lib/posts";
import { sendPushNotification } from "../lib/sendPush";
import { supabase } from "../lib/supabase";
import type { Post } from "../types/post";
import EmptyState from "../components/common/EmptyState";
import HeaderAvatar from "../components/common/HeaderAvatar";
import MiniChekiTriplet from "../components/post/MiniChekiTriplet";

type FriendWithIcon = Friend & { iconUrl?: string };

function InitialAvatar({ name, iconUrl }: { name: string; iconUrl?: string }) {
  const initial = name.trim().slice(0, 1) || "家";

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
        draggable={false}
      />
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dcebc9] text-[15px] font-black text-[#2f6b4f]">
      {initial}
    </div>
  );
}

function BowlIllustration() {
  return (
    <img
      src="/design-targets/connections-hero-illustration-crop-alpha.png"
      alt=""
      className="h-[86px] w-[142px] object-contain"
      draggable={false}
      aria-hidden="true"
    />
  );
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendWithIcon[]>([]);
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
      .select("id, name, user_id, icon_url")
      .in("user_id", friendUserIds);

    if (profileError) {
      console.error("profiles取得エラー:", profileError);
      return;
    }

    setFriends(
      profiles?.filter((profile) => friendUserIds.includes(profile.user_id)).map((profile) => ({
        id: profile.id,
        name: profile.name,
        userId: profile.user_id,
        iconUrl: profile.icon_url ?? undefined,
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
  const postStatusByUserId = useMemo(() => {
    const statuses = new Map<string, string>();
    posts.forEach((post) => {
      if (!post.userId || statuses.has(post.userId)) return;
      statuses.set(post.userId, post.postDate === new Date().toISOString().slice(0, 10) ? "今日の投稿あり" : "最近の記録あり");
    });
    return statuses;
  }, [posts]);

  return (
    <main className="min-h-[100dvh] bg-[#fbb23a] px-[14px] pt-[22px] pb-[86px] text-[#4b2a1d]">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-[9px] flex h-[29px] items-start justify-between gap-3 px-1">
          <h1 className="-mt-[2px] text-[18px] font-black leading-none text-[#4b2a1d]">
            つながり
          </h1>
          <HeaderAvatar iconUrl={currentUser?.iconUrl} />
        </header>

      <section className="relative mb-2 h-[102px] overflow-hidden rounded-[8px] bg-[#fcf4ee] p-3 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <div className="relative z-10 ml-[10px] mt-[10px] max-w-[56%]">
          <h2 className="text-[17px] font-black leading-[1.18] text-[#3f2116]">
            家族の食卓が届く
          </h2>
          <p className="mt-2 text-[10px] font-bold leading-[1.58] text-[#3f2116]/68">
            友だちや家族を追加すると、
            <br />
            今日の料理がホームに並びます。
          </p>
        </div>
        <div className="absolute right-0 top-1.5 w-[154px]">
          <BowlIllustration />
        </div>
      </section>

      <section className="rounded-[8px] bg-[#fcf4ee] p-2 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <div className="grid translate-y-px grid-cols-[60px_178px_84px] items-center gap-2">
          <label className="pl-1 text-[10px] font-black text-[#3f2116]/70">
            家族ID
          </label>
        <input
          value={friendId}
          onChange={(event) => setFriendId(event.target.value)}
          placeholder="例：okaasan"
            className="min-w-0 rounded-[6px] border border-[#dfc79d] bg-[#fffaf2] px-3 py-1 text-[10px] font-bold text-[#3f2116] placeholder:text-[#3f2116]/42 outline-none"
        />
        <button
          type="button"
          onClick={handleAddFriend}
          className="w-[84px] rounded-full bg-[#0f6a47] px-0 py-1 text-[8px] font-black text-[#fff8e6] shadow-[0_10px_24px_rgba(15,106,71,0.16)] active:scale-[0.97]"
        >
          追加する
        </button>
        </div>
        {message && (
          <p className="mt-2 rounded-[6px] bg-[#fff8e6] px-3 py-2 text-[11px] font-black text-[#0f6a47]">
            {message}
          </p>
        )}
      </section>

      <section className="mt-2 h-[166px] overflow-hidden rounded-[8px] bg-[#fcf4ee] p-2.5 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <h2 className="text-[11px] font-black text-[#3f2116]">つながっている人</h2>
        {friends.length === 0 ? (
          <div className="mt-[7px]">
            <EmptyState title="まだつながりはありません" />
          </div>
        ) : (
          <div className="mt-1.5 overflow-hidden rounded-[8px]">
            {friends.slice(0, 3).map((friend) => (
              <div
                key={friend.id}
                className="flex min-h-[39px] items-center gap-2.5 border-b border-[#dfc79d]/48 px-1.5 py-0.5 last:border-b-0"
              >
                <InitialAvatar name={friend.name} iconUrl={friend.iconUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-black leading-[1.05] text-[#3f2116]">
                    {friend.name}
                  </p>
                  <p className="mt-0.5 truncate text-[7px] font-bold leading-none text-[#0f6a47]">
                    {postStatusByUserId.get(friend.userId) ?? friend.userId}
                  </p>
                </div>
                <span
                  className="mr-1 h-[7px] w-[7px] rotate-45 border-r border-t border-[#3f2116]/38"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-[11px] rounded-[8px] bg-[#fcf4ee] p-2.5 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-bold text-[#3f2116]">最近届いたごはん</h2>
          <button className="text-[9px] font-black leading-none text-[#0f6a47]">すべて見る 〉</button>
        </div>
        {latestPost ? (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <InitialAvatar name={latestPost.userName} iconUrl={latestPost.userIcon} />
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold leading-tight text-[#3f2116]">
                  {latestPost.userName}
                </p>
                <p className="truncate text-[8px] font-bold leading-tight text-[#3f2116]/52">
                  {formatRecentTime(latestPost.createdAt)}
                </p>
                <p className="truncate text-[9px] font-bold leading-tight text-[#3f2116]">
                  {latestPost.dishName || "今日の料理"}
                </p>
              </div>
            </div>
            <MiniChekiTriplet
              post={latestPost}
              className="mt-2 [&>div:nth-child(1)]:-rotate-[4deg] [&>div:nth-child(3)]:rotate-[5deg]"
            />
          </div>
        ) : (
          <div className="mt-2">
            <EmptyState title="投稿はありません" />
          </div>
        )}
      </section>
      </div>
    </main>
  );
}

function formatRecentTime(createdAt?: string) {
  if (!createdAt) return "たった今";

  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return "たった今";

  const minutes = Math.max(0, Math.round((Date.now() - created) / 60000));
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  return `${Math.floor(minutes / 60)}時間前`;
}
