import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/app/lib/supabase";

webpush.setVapidDetails(
  "mailto:kensuke5704@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const { toUserId, title, body } = await request.json();

    if (!toUserId || !title || !body) {
      return NextResponse.json(
        { error: "toUserId, title, body are required" },
        { status: 400 }
      );
    }

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", toUserId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    await Promise.all(
      subscriptions.map((subscription) =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title,
            body,
          })
        )
      )
    );

    return NextResponse.json({
      ok: true,
      sent: subscriptions.length,
    });
  } catch (error) {
    console.error("Push送信エラー:", error);

    return NextResponse.json(
      { error: "Push送信に失敗しました" },
      { status: 500 }
    );
  }
}