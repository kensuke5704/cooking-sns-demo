"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../lib/auth";
import ScreenShell from "../components/common/ScreenShell";
import SectionCard from "../components/common/SectionCard";
import EmptyState from "../components/common/EmptyState";
import { supabase } from "../lib/supabase";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type Notification = {
  id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  post_id?: string | number | null;
};

export default function NotificationScreen({
  onReadChange,
  onOpenPost,
}: {
  onReadChange: () => void;
  onOpenPost?: (postId: string | number) => Promise<void> | void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const cutoff = new Date(Date.now() - ONE_DAY_MS).toISOString();

    const { error: deleteOldError } = await supabase
      .from("notifications")
      .delete()
      .eq("to_user_id", currentUser.userId)
      .lt("created_at", cutoff);

    if (deleteOldError) {
      console.error("古い通知削除エラー:", deleteOldError);
    }

    const { error: deletePostNotificationError } = await supabase
      .from("notifications")
      .delete()
      .eq("to_user_id", currentUser.userId)
      .eq("type", "post");

    if (deletePostNotificationError) {
      console.error("投稿通知削除エラー:", deletePostNotificationError);
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("to_user_id", currentUser.userId)
      .neq("type", "post")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("通知取得エラー:", error);
      return;
    }

    setNotifications(data || []);

    const unreadIds = data?.filter((n) => !n.read).map((n) => n.id) || [];

    if (unreadIds.length > 0) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);

      onReadChange();
    }
  }

  function canOpenPost(notification: Notification) {
    return ["like", "comment", "reply"].includes(notification.type) && notification.post_id;
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <ScreenShell>
      <div className="mb-7 flex items-center justify-between">
        <h1 className="text-[36px] font-black leading-none text-[#3f2116]">
          通知
        </h1>
      </div>
      <SectionCard
        title={notifications.length === 0 ? "通知はありません" : `${notifications.length}件`}
        description={unreadCount > 0 ? `未読 ${unreadCount}` : undefined}
      >
        {notifications.length === 0 ? (
          <EmptyState title="通知はありません" />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isPostLink = canOpenPost(notification);

              return (
                <button
                  key={notification.id}
                  type="button"
                  disabled={!isPostLink}
                  onClick={() => {
                    if (notification.post_id) {
                      onOpenPost?.(notification.post_id);
                    }
                  }}
                  className={`w-full rounded-[20px] border border-[#f1d59a]/55 px-4 py-3 text-left ${
                    notification.read ? "bg-[#fff4d7]/75" : "bg-[#f39a00]/15"
                  } ${isPostLink ? "active:scale-[0.99]" : "cursor-default"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#f39a00]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs font-bold opacity-50">
                        {new Date(notification.created_at).toLocaleString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>
    </ScreenShell>
  );
}
