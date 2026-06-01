export async function sendPushNotification({
    toUserId,
    title,
    body,
  }: {
    toUserId: string;
    title: string;
    body: string;
  }) {
    const response = await fetch("/api/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        toUserId,
        title,
        body,
      }),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Push通知送信失敗:", errorText);
    }
  }