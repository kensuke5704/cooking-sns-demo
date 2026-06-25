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
import ReferenceScreen from "../components/common/ReferenceScreen";

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
    <ReferenceScreen image="/design-targets/connections.png">
      <input
        value={friendId}
        onChange={(event) => setFriendId(event.target.value)}
        className="absolute left-[25%] top-[29%] h-[5.5%] w-[43%] opacity-0"
        aria-label="家族ID"
      />
      <button
        type="button"
        onClick={handleAddFriend}
        className="absolute right-[6%] top-[29%] h-[5.5%] w-[24%] opacity-0"
        aria-label="追加する"
      />
    </ReferenceScreen>
  );
}
