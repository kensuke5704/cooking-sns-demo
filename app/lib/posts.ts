import type { Post } from "../types/post";
import { supabase } from "./supabase";

export async function loadPostsData(userId: string): Promise<Post[]> {
  const { data: friendsData, error: friendsError } = await supabase
    .from("friends")
    .select("friend_user_id")
    .eq("owner_user_id", userId);

  if (friendsError) {
    throw friendsError;
  }

  const friendUserIds =
    friendsData?.map((friend) => friend.friend_user_id) || [];

  const visibleUserIds = [userId, ...friendUserIds];

  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .in("user_id", visibleUserIds)
    .order("created_at", { ascending: false });

  if (postsError) {
    throw postsError;
  }

  const postUserIds = [
    ...new Set(postsData?.map((post) => post.user_id) || []),
  ];

  if (postUserIds.length === 0) {
    return [];
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, name, icon_url")
    .in("user_id", postUserIds);

  if (profilesError) {
    throw profilesError;
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
        userName: profile?.name || post.user_name,
        userIcon: profile?.icon_url || "/images/user1-icon.jpg",
        createdAt: post.created_at,
        postDate: post.post_date,
        prepPhoto: post.prep_photo,
        cookingPhoto: post.cooking_photo,
        finishedPhoto: post.finished_photo,
        dishName: post.dish_name,
        memo: post.memo,
      };
    }) || [];

  return mappedPosts;
}

export function getStoragePathFromUrl(url?: string | null) {
  if (!url) return null;

  const marker = "/storage/v1/object/public/post-images/";
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return url.slice(index + marker.length);
}

export async function deletePostData(postId: string | number, targetPost?: Post) {
  const imagePaths = [
    getStoragePathFromUrl(targetPost?.prepPhoto),
    getStoragePathFromUrl(targetPost?.cookingPhoto),
    getStoragePathFromUrl(targetPost?.finishedPhoto),
  ].filter((path): path is string => Boolean(path));

  if (imagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("post-images")
      .remove(imagePaths);

    if (storageError) {
      throw storageError;
    }
  }

  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    throw error;
  }
}