"use client";

import { useEffect, useState } from "react";
import type { Post } from "../../types/post";
import StackedPhotos from "./StackedPhotos";
import { supabase } from "../../lib/supabase";
import { getCurrentUser } from "../../lib/auth";

export default function PostCard({
  post,
  onImageClick,
  onDelete,
}: {
  post: Post;
  onImageClick: (src: string) => void;
  onDelete?: (postId: string | number) => void;
}) {
  const [comments, setComments] = useState<
    {
      id: string | number;
      userId: string;
      userName: string;
      text: string;
    }[]
  >([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0); 
  const currentUser = getCurrentUser();
  const isMyPost = currentUser?.userId === post.userId;

  useEffect(() => {
    loadComments();
    loadLikes();
  }, [post.id]);

  async function loadComments() {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
  
    if (error) {
      console.error(error);
      return;
    }
  
    setComments(
      data?.map((c) => ({
        id: c.id,
        userId: c.user_id,
        userName: c.user_name,
        text: c.text,
      })) || []
    );
  }

  async function loadLikes() {
    const currentUser = getCurrentUser();
  
    const { data, error } = await supabase
      .from("likes")
      .select("*")
      .eq("post_id", post.id);
  
    if (error) {
      console.error(error);
      return;
    }
  
    setLikeCount(data?.length || 0);
  
    if (currentUser) {
      setLiked(data?.some((like) => like.user_id === currentUser.userId) || false);
    }
  }

  const toggleLike = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
  
    if (liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUser.userId);
  
      if (error) {
        console.error(error);
        return;
      }
  
      setLiked(false);
      setLikeCount((v) => Math.max(0, v - 1));
      return;
    }
  
    const { error } = await supabase.from("likes").insert({
      post_id: post.id,
      user_id: currentUser.userId,
    });
  
    if (error) {
      console.error(error);
      return;
    }
  
    setLiked(true);
    setLikeCount((v) => v + 1);
  };

  const addComment = async () => {
    const currentUser = getCurrentUser();
  
    if (!currentUser) return;
  
    if (!commentText.trim()) return;
  
    const { error } = await supabase.from("comments").insert({
      post_id: post.id,
      user_id: currentUser.userId,
      user_name: currentUser.name,
      text: commentText.trim(),
    });
  
    if (error) {
      console.error(error);
      alert("コメント保存失敗");
      return;
    }
  
    setCommentText("");
    await loadComments();
  };

  const deleteComment = async (commentId: string | number) => {
    const ok = confirm("このコメントを削除しますか？");
  
    if (!ok) return;
  
    const currentUser = getCurrentUser();
  
    if (!currentUser) return;
  
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", currentUser.userId);
  
    if (error) {
      console.error(error);
      alert("コメント削除に失敗しました");
      return;
    }
  
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  };
  
  return (
    <article className="overflow-hidden rounded-[36px] bg-white shadow-xl">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-3">
          <img
            src={post.userIcon}
            alt={post.userName}
            className="h-11 w-11 rounded-full border-2 border-[#f8b72a] object-cover"
          />

          <div>
            <p className="text-base font-black text-[#6b2f13]">
              {post.userName}
            </p>
            <p className="text-xs font-bold text-[#6b2f13]/50">たった今</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#fff4d7] px-3 py-1 text-xs font-black text-[#f39a00]">
            今日
          </span>

          {isMyPost && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white"
            >
              削除
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="rounded-[28px] bg-[#f8b72a] p-4 shadow-inner">
          <StackedPhotos post={post} onClick={onImageClick} />
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLike}
            className="flex h-10 w-10 items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-6 w-6 ${
                liked ? "text-[#f39a00]" : "text-[#6b2f13]"
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setShowComments(true)}
            className="flex h-10 w-10 items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6 text-[#6b2f13]"
            >
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
            </svg>
          </button>
        </div>

        <p className="text-sm font-black text-[#6b2f13]">
          {likeCount}人が「おいしそう」しました
        </p>

        <p className="mt-2 text-sm font-bold text-[#6b2f13]">
          <span className="font-black">{post.userName}</span>{" "}
          {post.dishName
            ? `${post.dishName}を作りました 🍳`
            : "今日の料理を記録しました 🍳"}
        </p>

        {post.memo && (
          <p className="mt-2 rounded-2xl bg-[#fff4d7] px-4 py-3 text-sm font-bold text-[#6b2f13]">
            {post.memo}
          </p>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="text-xs font-black text-[#6b2f13]/50"
          >
            {showComments
              ? "コメントを閉じる"
              : comments.length > 0
              ? `${comments.length}件のコメントを見る`
              : "コメントする"}
          </button>

          {showComments && (
            <>
              <div className="mt-3 space-y-2">
              {comments.map((comment) => {
                const canDeleteComment = currentUser?.userId === comment.userId;

                return (
                  <div
                    key={comment.id}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-[#fff8e6] px-4 py-2 text-sm font-bold text-[#6b2f13]"
                  >
                    <p className="min-w-0 flex-1">
                      <span className="font-black">{comment.userName}</span>{" "}
                      {comment.text}
                    </p>

                    {canDeleteComment && (
                      <button
                        type="button"
                        onClick={() => deleteComment(comment.id)}
                        className="shrink-0 rounded-full bg-red-500 px-2 py-1 text-[10px] font-black text-white"
                      >
                        削除
                      </button>
                    )}
                  </div>
                );
              })}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="コメントを追加"
                  className="min-w-0 flex-1 rounded-full border-2 border-[#f1d59a] px-4 py-2 text-sm font-bold outline-none"
                />

                <button
                  type="button"
                  onClick={addComment}
                  className="rounded-full bg-[#f39a00] px-4 text-sm font-black text-white"
                >
                  投稿
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}