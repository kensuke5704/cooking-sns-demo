"use client";

import { useEffect, useMemo, useState } from "react";
import type { Post } from "../../types/post";
import StackedPhotos from "./StackedPhotos";
import { supabase } from "../../lib/supabase";
import { getCurrentUser } from "../../lib/auth";
import { sendPushNotification } from "../../lib/sendPush";

type CommentItem = {
  id: string | number;
  userId: string;
  userName: string;
  text: string;
  parentCommentId?: string | number | null;
};

export default function PostCard({
  post,
  onImageClick,
  onDelete,
  highlight = false,
}: {
  post: Post;
  onImageClick: (src: string) => void;
  onDelete?: (postId: string | number) => void;
  highlight?: boolean;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | number | null>(
    null
  );
  const [isDeletingCommentId, setIsDeletingCommentId] = useState<string | number | null>(
    null
  );
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const currentUser = getCurrentUser();
  const isMyPost = currentUser?.userId === post.userId;

  function showToast(message: string) {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage("");
    }, 2500);
  }

  const createdDate = new Date(post.createdAt);
  const now = new Date();

  const diffMs = now.getTime() - createdDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let createdTimeText = "";

  if (diffMinutes < 1) {
    createdTimeText = "たった今";
  } else if (diffMinutes < 60) {
    createdTimeText = `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    createdTimeText = `${diffHours}時間前`;
  } else if (diffDays === 1) {
    createdTimeText = "昨日";
  } else {
    createdTimeText = createdDate.toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    });
  }

  const commentMap = useMemo(() => {
    return new Map(comments.map((comment) => [String(comment.id), comment]));
  }, [comments]);

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
        parentCommentId: c.parent_comment_id ?? null,
      })) || []
    );
  }

  async function loadLikes() {
    const currentUser = getCurrentUser();

    const countQuery = supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", post.id);

    const ownLikeQuery = currentUser
      ? supabase
          .from("likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", currentUser.userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const [countResult, ownLikeResult] = await Promise.all([
      countQuery,
      ownLikeQuery,
    ]);

    if (countResult.error) {
      console.error(countResult.error);
      return;
    }

    if (ownLikeResult.error) {
      console.error(ownLikeResult.error);
    }

    setLikeCount(countResult.count || 0);
    setLiked(Boolean(ownLikeResult.data));
  }

  const toggleLike = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser || isLikeLoading) return;

    setIsLikeLoading(true);

    try {
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

        await loadLikes();
        return;
      }

      const { error } = await supabase.from("likes").insert({
        post_id: post.id,
        user_id: currentUser.userId,
      });

      if (error) {
        if (error.code !== "23505") {
          console.error(error);
          return;
        }

        await loadLikes();
        return;
      }

      if (post.userId !== currentUser.userId) {
        const { data: existingNotification, error: checkNotificationError } =
          await supabase
            .from("notifications")
            .select("id")
            .eq("post_id", post.id)
            .eq("from_user_id", currentUser.userId)
            .eq("to_user_id", post.userId)
            .eq("type", "like")
            .maybeSingle();

        if (checkNotificationError) {
          console.error("通知確認エラー:", checkNotificationError);
        }

        if (!checkNotificationError && !existingNotification) {
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert({
              post_id: post.id,
              from_user_id: currentUser.userId,
              from_user_name: currentUser.name,
              to_user_id: post.userId,
              type: "like",
              message: `${currentUser.name}さんがあなたの投稿に「おいしそう」しました`,
              read: false,
            });

          if (notificationError) {
            console.error("通知作成エラー:", notificationError);
          }
        }

        if (post.userId) {
          await sendPushNotification({
            toUserId: post.userId,
            title: "おいしそう",
            body: `${currentUser.name}さんがあなたの投稿に「おいしそう」しました`,
          });
        }
      }

      await loadLikes();
    } finally {
      setIsLikeLoading(false);
    }
  };

  const addComment = async () => {
    const currentUser = getCurrentUser();

    if (!currentUser) return;

    if (!commentText.trim()) return;

    const insertData: Record<string, string | number | null> = {
      post_id: post.id,
      user_id: currentUser.userId,
      user_name: currentUser.name,
      text: commentText.trim(),
    };

    if (replyTarget) {
      insertData.parent_comment_id = replyTarget.id;
    }

    const { error } = await supabase.from("comments").insert(insertData);

    if (error) {
      console.error(error);
      showToast("コメント保存に失敗しました");
      return;
    }

    const notificationTarget = replyTarget
      ? {
          userId: replyTarget.userId,
          title: "返信",
          message: `${currentUser.name}さんがあなたのコメントに返信しました`,
          type: "reply",
        }
      : post.userId !== currentUser.userId
      ? {
          userId: post.userId,
          title: "コメント",
          message: `${currentUser.name}さんがあなたの投稿にコメントしました`,
          type: "comment",
        }
      : null;

    if (
      notificationTarget?.userId &&
      notificationTarget.userId !== currentUser.userId
    ) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          post_id: post.id,
          from_user_id: currentUser.userId,
          from_user_name: currentUser.name,
          to_user_id: notificationTarget.userId,
          type: notificationTarget.type,
          message: notificationTarget.message,
          read: false,
        });

      if (notificationError) {
        console.error("コメント通知作成エラー:", notificationError);
      }

      await sendPushNotification({
        toUserId: notificationTarget.userId,
        title: notificationTarget.title,
        body: notificationTarget.message,
      });
    }

    setCommentText("");
    setReplyTarget(null);
    await loadComments();
    showToast(replyTarget ? "返信しました" : "コメントを投稿しました");
  };

  const deleteComment = async (commentId: string | number) => {
    const currentUser = getCurrentUser();
    const targetComment = comments.find((comment) => comment.id === commentId);

    if (!currentUser || !targetComment) return;

    if (targetComment.userId !== currentUser.userId) {
      setDeleteCommentId(null);
      showToast("削除できません");
      return;
    }

    if (isDeletingCommentId !== null) return;

    setIsDeletingCommentId(commentId);

    const { error: childError } = await supabase
      .from("comments")
      .update({ parent_comment_id: null })
      .eq("parent_comment_id", commentId);

    if (childError) {
      console.error(childError);
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    setIsDeletingCommentId(null);
    setDeleteCommentId(null);

    if (error) {
      console.error(error);
      showToast("コメント削除に失敗しました");
      return;
    }

    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    await loadComments();
    showToast("コメントを削除しました");
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed left-1/2 top-5 z-[200] -translate-x-1/2 rounded-full bg-[#6b2f13] px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(107,47,19,0.24)]">
          {toastMessage}
        </div>
      )}
      <article
        className={`rounded-[28px] border bg-white/95 shadow-[0_16px_44px_rgba(107,47,19,0.13)] transition-all duration-300 ${
          highlight
            ? "border-[#f39a00] ring-4 ring-[#f39a00]/30"
            : "border-white/75"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-3">
            <img
              src={post.userIcon}
              alt={post.userName}
              className="h-11 w-11 rounded-full border border-[#f8b72a] object-cover shadow-sm"
            />

            <div>
              <p className="text-[15px] font-black tracking-[-0.02em] text-[#6b2f13]">
                {post.userName}
              </p>
              <p className="text-[11px] font-bold text-[#6b2f13]/45">
                {createdTimeText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMyPost && onDelete && (
              <button
                type="button"
                onClick={() => onDelete?.(post.id)}
                className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white"
              >
                削除
              </button>
            )}
          </div>
        </div>

        <div className="px-5 pb-3 pt-4">
          <div className="relative rounded-[28px] bg-[#f8b72a] px-3 pb-2 pt-4 shadow-inner">
            <div className="-mx-3 -mt-1">
              <StackedPhotos post={post} onClick={onImageClick} />
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="mb-3 flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLike}
              disabled={isLikeLoading}
              className="flex h-10 w-10 items-center justify-center disabled:opacity-50"
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
            {post.dishName || "今日の料理"} 🍳
          </p>

          {post.memo && (
            <p className="mt-2 rounded-[18px] bg-[#fff4d7]/80 px-4 py-3 text-sm font-bold text-[#6b2f13]">
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
                    const parentComment = comment.parentCommentId
                      ? commentMap.get(String(comment.parentCommentId))
                      : null;

                    return (
                      <div
                        key={comment.id}
                        className={`rounded-2xl bg-[#fff8e6] px-4 py-3 text-sm font-bold text-[#6b2f13] ${
                          comment.parentCommentId ? "ml-5 border-l-4 border-[#f39a00]/35" : ""
                        }`}
                      >
                        {parentComment && (
                          <p className="mb-2 text-[11px] font-black text-[#f39a00]">
                            @{parentComment.userName} へ返信
                          </p>
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="whitespace-pre-line leading-relaxed">
                              <span className="font-black">{comment.userName}</span>{" "}
                              {comment.text}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyTarget(comment);
                                setShowComments(true);
                              }}
                              className="mt-2 text-[11px] font-black text-[#f39a00]"
                            >
                              返信
                            </button>
                          </div>

                          {canDeleteComment && (
                            <button
                              type="button"
                              onClick={() => setDeleteCommentId(comment.id)}
                              className="shrink-0 rounded-full bg-red-500 px-2 py-1 text-[10px] font-black text-white"
                            >
                              削除
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {replyTarget && (
                  <div className="mt-3 flex items-center justify-between rounded-full bg-[#fff4d7] px-4 py-2 text-xs font-black text-[#6b2f13]">
                    <span>@{replyTarget.userName} に返信</span>
                    <button
                      type="button"
                      onClick={() => setReplyTarget(null)}
                      className="text-[#f39a00]"
                    >
                      解除
                    </button>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={replyTarget ? "返信を追加" : "コメントを追加"}
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
        {deleteCommentId !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6">
            <div className="w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-[0_24px_60px_rgba(107,47,19,0.22)]">
              <p className="text-lg font-black text-[#6b2f13]">
                コメントを削除しますか？
              </p>

              <p className="mt-2 text-sm font-bold text-[#6b2f13]/60">
                削除すると元に戻せません。
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteCommentId(null)}
                  className="flex-1 rounded-[18px] bg-[#fff4d7]/80 py-3 text-sm font-black text-[#6b2f13]"
                >
                  キャンセル
                </button>

                <button
                  type="button"
                  disabled={isDeletingCommentId !== null}
                  onClick={() => deleteComment(deleteCommentId)}
                  className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {isDeletingCommentId !== null ? "削除中" : "削除"}
                </button>
              </div>
            </div>
          </div>
        )}
      </article>
    </>
  );
}
