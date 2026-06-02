import { useState } from "react";
import { loadPostsData } from "../../lib/posts";
import { supabase } from "../../lib/supabase";
import type { Post } from "../../types/post";

type CurrentUser = {
  userId: string;
} | null;

export function useCalendarPosts(
  currentUser: CurrentUser,
  showPopup: (title: string, message: string) => void
) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pairPosts, setPairPosts] = useState<Post[]>([]);

  async function loadCalendarPosts() {
    if (!currentUser) return;

    try {
      const loadedPosts = await loadPostsData(currentUser.userId);
      setPosts(loadedPosts.filter((post) => post.userId === currentUser.userId));
    } catch (error) {
      console.error("カレンダー投稿取得エラー:", error);
      showPopup("取得エラー", "カレンダーの投稿取得に失敗しました");
    }
  }

  async function loadPairPosts(partnerUserId: string) {
    if (!currentUser) return;

    const userIds = [currentUser.userId, partnerUserId];

    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .in("user_id", userIds)
      .order("post_date", { ascending: false });

    if (postsError) {
      console.error("ペア投稿取得エラー:", postsError);
      setPairPosts([]);
      showPopup("取得エラー", "2人カレンダーの投稿取得に失敗しました");
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, icon_url")
      .in("user_id", userIds);

    if (profilesError) {
      console.error("ペアプロフィール取得エラー:", profilesError);
      setPairPosts([]);
      showPopup("取得エラー", "プロフィール取得に失敗しました");
      return;
    }

    const profileMap = new Map(
      profilesData?.map((profile) => [profile.user_id, profile]) || []
    );

    const mappedPosts: Post[] =
      postsData?.map((post) => {
        const profile = profileMap.get(post.user_id);

        return {
          id: post.id,
          userId: post.user_id,
          userName: profile?.name || post.user_name || "ユーザー",
          userIcon: profile?.icon_url || post.user_icon || "/images/user1-icon.jpg",
          createdAt: post.created_at,
          postDate: post.post_date,
          prepPhoto: post.prep_photo,
          cookingPhoto: post.cooking_photo,
          finishedPhoto: post.finished_photo,
          dishName: post.dish_name,
          memo: post.memo,
        };
      }) || [];

    setPairPosts(mappedPosts);
  }

  function clearPairPosts() {
    setPairPosts([]);
  }

  return {
    posts,
    pairPosts,
    loadCalendarPosts,
    loadPairPosts,
    clearPairPosts,
  };
}
