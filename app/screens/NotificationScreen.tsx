"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../lib/auth";
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

  return (
    <main className="min-h-screen bg-[#f8b72a] px-5 pt-6 pb-28 text-[#6b2f13]">
      <div className="mx-auto max-w-md">
        <h1 className="mb-5 text-3xl font-black">通知</h1>

        <section className="rounded-[32px] bg-white p-5 shadow-xl">
          {notifications.length === 0 ? (
            <p className="text-sm font-bold opacity-60">
              通知はまだありません
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
                  <p className="text-sm font-black">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs font-bold opacity-50">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}