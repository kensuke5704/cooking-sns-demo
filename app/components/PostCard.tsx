"use client";

import { useEffect, useState } from "react";
import type { Post } from "../types/post";
import StackedPhotos from "./StackedPhotos";

export default function PostCard({
  post,
  onImageClick,
}: {
  post: Post;
  onImageClick: (src: string) => void;
}) {
  const baseLikeCount = post.id === 999 ? 0 : 12 + post.id * 7;

  const likeKey = `post-like-${post.id}`;
  const commentsKey = `post-comments-${post.id}`;

  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    setLiked(localStorage.getItem(likeKey) === "true");

    const savedComments = localStorage.getItem(commentsKey);
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, [likeKey, commentsKey]);

  const likeCount = liked ? baseLikeCount + 1 : baseLikeCount;

  const toggleLike = () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    localStorage.setItem(likeKey, String(nextLiked));
  };

  const addComment = () => {
    if (!commentText.trim()) return;

    const nextComments = [...comments, commentText.trim()];
    setComments(nextComments);
    localStorage.setItem(commentsKey, JSON.stringify(nextComments));
    setCommentText("");
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

        <span className="rounded-full bg-[#fff4d7] px-3 py-1 text-xs font-black text-[#f39a00]">
          今日
        </span>
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
              strokeWidth="2"
              className={`h-6 w-6 ${
                liked ? "text-[#f39a00]" : "text-[#6b2f13]"
              }`}
            >
              <path d="M12 21s-7-4.35-9.5-8C.5 10 .9 6.5 4 4.5c2.4-1.5 5-.6 6.5 1.4C12 3.9 14.6 3 17 4.5c3.1 2 3.5 5.5 1.5 8.5C19 16.65 12 21 12 21z" />
            </svg>
          </button>

          <button
            type="button"
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
                {comments.map((comment, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-[#fff8e6] px-4 py-2 text-sm font-bold text-[#6b2f13]"
                  >
                    <span className="font-black">あなた</span> {comment}
                  </div>
                ))}
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