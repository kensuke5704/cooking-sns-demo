"use client";

import { useEffect, useState } from "react";
import CameraPost from "./camera";
import BottomNav from "./components/BottomNav";
import EmptyPage from "./components/EmptyPage";
import PostCard from "./components/PostCard";
import RecipePage from "./pages/RecipePage";
import CalendarPage from "./pages/CalendarPage";
import AuthPage from "./pages/AuthPage";
import type { Post } from "./types/post";
import { getCurrentUser } from "./utils/auth";
import ProfilePage from "./pages/ProfilePage";
import { supabase } from "./utils/supabase";

const APP_VERSION = "2026-05-31 fixed";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentTab, setCurrentTab] = useState("ホーム");
  const [authVersion, setAuthVersion] = useState(0);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, [authVersion]);

  useEffect(() => {
    loadPosts();
  }, []);
  
  async function loadPosts() {
    const currentUser = getCurrentUser();
  
    if (!currentUser) return;
  
    const { data: friendsData, error: friendsError } = await supabase
      .from("friends")
      .select("friend_user_id")
      .eq("owner_user_id", currentUser.userId);
  
    if (friendsError) {
      console.error("友だち取得エラー:", friendsError);
      return;
    }
  
    const friendUserIds =
      friendsData?.map((friend) => friend.friend_user_id) || [];
  
    const visibleUserIds = [currentUser.userId, ...friendUserIds];
  
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .in("user_id", visibleUserIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("投稿取得エラー:", error);
      return;
    }

    const postUserIds = [...new Set(data?.map((post) => post.user_id) || [])];

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, name, icon_url")
      .in("user_id", postUserIds);

    if (profileError) {
      console.error("プロフィール取得エラー:", profileError);
      return;
    }

    const profileMap = new Map(
      profiles?.map((profile) => [profile.user_id, profile]) || []
    );

    const mappedPosts: Post[] =
      data?.map((post) => {
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

    setPosts(mappedPosts);
  }

  function getStoragePathFromUrl(url?: string | null) {
    if (!url) return null;
  
    const marker = "/storage/v1/object/public/post-images/";
    const index = url.indexOf(marker);
  
    if (index === -1) return null;
  
    return url.slice(index + marker.length);
  }

  async function deletePost(postId: string | number) {
    const ok = confirm("この投稿を削除しますか？");
    if (!ok) return;
  
    const currentUser = getCurrentUser();
    const targetPost = posts.find((post) => post.id === postId);
  
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
        console.error("画像削除エラー:", storageError);
        alert("画像削除に失敗しました");
        return;
      }
    }
  
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);
  
    if (error) {
      console.error("投稿削除エラー:", error);
      alert(error.message || "削除に失敗しました");
      return;
    }
  
    const today = new Date().toISOString().slice(0, 10);
  
    if (
      currentUser &&
      targetPost?.userId === currentUser.userId &&
      targetPost?.postDate === today
    ) {
      localStorage.removeItem(
        `daily-cooking-photos-${currentUser.userId}-${today}`
      );
    }
  
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }

  if (!currentUser) {
    return (
      <AuthPage
        onAuthChange={() => {
          setAuthVersion((v) => v + 1);
        }}
      />
    );
  }

  if (currentTab === "カメラ") {
    return (
      <CameraPost
        onBack={() => {
          setCurrentTab("ホーム");
          loadPosts();
        }}
      />
    );
  }

  if (currentTab === "レシピ") {
    return (
      <>
        <RecipePage />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </>
    );
  }

  if (currentTab === "カレンダー") {
    return (
      <>
        <CalendarPage />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </>
    );
  }

  if (currentTab === "記事") {
    return (
      <>
        <EmptyPage title="記事" />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </>
    );
  }

  if (currentTab === "プロフィール") {
    return (
      <>
        <ProfilePage
          onProfileChange={() => {
            setAuthVersion((v) => v + 1);
          }}
        />
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </>
    );
  }

  const allPosts = posts;

  const visiblePosts = allPosts.filter((post) => {
    const created = new Date(post.createdAt).getTime();
    return Date.now() - created <= 24 * 60 * 60 * 1000;
  });

  return (
    <main className="min-h-screen bg-[#f8b72a] pb-28 text-[#6b2f13]">
      <div className="px-5 pt-5">
        <p className="text-xs font-black opacity-70">最終更新: {APP_VERSION}</p>

        <div
          className="mt-4 w-full overflow-hidden rounded-[36px] bg-white shadow-xl"
        >
          <div className="bg-[#f39a00] px-5 py-2 text-left">
            <p className="text-xs font-black text-white">
              TODAY'S RECIPE
            </p>
          </div>

          <div className="p-5 text-center">
            <p className="text-sm font-black text-[#f39a00]">
              今日の献立
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#6b2f13]">
              アスパラベーコン
            </h2>

            <p className="mt-3 text-sm font-bold text-[#6b2f13]/60">
              ベーコンの旨味とアスパラの食感を楽しめる定番レシピ
            </p>

            <button
              type="button"
              onClick={() => setCurrentTab("レシピ")}
              className="mt-4 rounded-full bg-[#f39a00] px-6 py-3 text-sm font-black text-white shadow"
            >
              レシピを見る →
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onImageClick={(src) => setSelectedImage(src)}
              onDelete={deletePost}
            />
          ))}
        </div>
      </div>

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-4 w-full max-w-sm"
          >
            <img
              src={selectedImage}
              alt=""
              className="w-full rounded-xl object-cover"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="mt-4 w-full rounded-full bg-[#f39a00] py-3 font-black text-white"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </main>
  );
}