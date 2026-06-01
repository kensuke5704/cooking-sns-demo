import type { Post } from "../types/post";
import { supabase } from "./supabase";

type FriendRow = {
  friend_user_id: string;
};

type PostRow = {
  id: string;
  user_id: string;
  user_name: string;
  created_at: string;
  post_date: string;
  prep_photo: string;
  cooking_photo: string;
  finished_photo: string;
  dish_name: string;
  memo: string;
};

type ProfileRow = {
  user_id: string;
  name: string | null;
  icon_url: string | null;
};

export async function loadPostsData(userId: string): Promise<Post[]> {
  const { data: friendsData, error: friendsError } = await supabase
    .from("friends")
    .select("friend_user_id")
    .eq("owner_user_id", userId)
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
    .order("created_at", { ascending: false })

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
    .in("user_id", postUserIds)

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

export async function publishPostData({
  userId,
  userName,
  dishName,
  memo,
  photos,
  draftId,
}: {
  userId: string;
  userName: string;
  dishName: string;
  memo: string;
  photos: {
    prep?: string;
    cooking?: string;
    finished?: string;
  };
  draftId: string;
}) {
  const safeDraftId = draftId.replace(/[^a-zA-Z0-9_-]/g, "");

  const { ensureImageUrl } = await import("./storage");
  
  const prepPhotoUrl = photos.prep
    ? await ensureImageUrl(
        photos.prep,
        `${userId}/${safeDraftId}-prep.jpg`
      )
    : null;
  
  const cookingPhotoUrl = photos.cooking
    ? await ensureImageUrl(
        photos.cooking,
        `${userId}/${safeDraftId}-cooking.jpg`
      )
    : null;
  
  const finishedPhotoUrl = photos.finished
    ? await ensureImageUrl(
        photos.finished,
        `${userId}/${safeDraftId}-finished.jpg`
      )
    : null;
    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Tokyo",
    });

  const { data: existingPost } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .eq("draft_id", draftId)
    .maybeSingle();

  const nextPostData = {
    user_id: userId,
    user_name: userName,
    post_date: today,
    draft_id: draftId,
    prep_photo: prepPhotoUrl ?? existingPost?.prep_photo ?? null,
    cooking_photo: cookingPhotoUrl ?? existingPost?.cooking_photo ?? null,
    finished_photo: finishedPhotoUrl ?? existingPost?.finished_photo ?? null,
    dish_name: dishName || existingPost?.dish_name || null,
    memo: memo || existingPost?.memo || null,
  };

  const { data, error } = await supabase
    .from("posts")
    .upsert(nextPostData, {
      onConflict: "user_id,draft_id",
    })
    .select()
    .single();

    if (error) {
      throw error;
    }
    
    if (!existingPost && data) {
      const { data: friendsData, error: friendsError } = await supabase
        .from("friends")
        .select("friend_user_id")
        .eq("owner_user_id", userId);
    
      if (friendsError) {
        console.error("投稿通知用の友だち取得エラー:", friendsError);
      } else {
        const notifications =
          friendsData?.map((friend) => ({
            post_id: data.id,
            from_user_id: userId,
            from_user_name: userName,
            to_user_id: friend.friend_user_id,
            type: "post",
            message: `${userName}さんが新しい料理を投稿しました`,
            read: false,
          })) || [];
    
        if (notifications.length > 0) {
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert(notifications);
    
          if (notificationError) {
            console.error("投稿通知作成エラー:", notificationError);
          }
        }
      }
    }
    
    return {
      data,
      existingPost,
      finishedPhotoUrl,
    };
}