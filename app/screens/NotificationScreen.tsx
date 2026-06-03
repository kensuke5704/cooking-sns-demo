"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../lib/auth";
import ScreenShell from "../components/common/ScreenShell";
import SectionCard from "../components/common/SectionCard";
import { supabase } from "../lib/supabase";

type Notification = {
  id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
};

export default function NotificationScreen({
  onReadChange,
}: {
  onReadChange: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("to_user_id", currentUser.userId)
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

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <ScreenShell
      label="NOTIFICATIONS"
      title="通知"
      subtitle="友だち追加、コメント、いいねを新しい順で確認できます。"
    >
      <SectionCard
        title={notifications.length === 0 ? "まだ通知はありません" : `${notifications.length}件の通知`}
        description={unreadCount > 0 ? `${unreadCount}件の未読があります。` : undefined}
      >
        {notifications.length === 0 ? (
          <p className="rounded-2xl bg-[#fff4d7] px-4 py-5 text-center text-sm font-bold text-[#6b2f13]/60">
            新しい通知が届くとここに表示されます。
          </p>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl px-4 py-3 ${
                  notification.read ? "bg-[#fff4d7]" : "bg-[#f39a00]/20"
                }`}
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
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </ScreenShell>
  );
}