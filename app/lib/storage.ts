import { supabase } from "./supabase";

function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));

    img.src = base64;
  });
}

async function normalizeImage(base64: string): Promise<Blob> {
  const img = await base64ToImage(base64);

  const maxWidth = 1200;
  const scale = Math.min(1, maxWidth / img.width);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("画像変換に失敗しました");
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("JPEG変換に失敗しました"));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      0.75
    );
  });
}

export async function uploadBase64Image(
  base64: string,
  filePath: string
): Promise<string> {
  const blob = await normalizeImage(base64);

  const safePath = filePath
    .replace(/[^a-zA-Z0-9/_\-.]/g, "_")
    .replace(/\/+/g, "/");

  const { error } = await supabase.storage
    .from("post-images")
    .upload(safePath, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error("画像アップロードエラー:", error);
    throw new Error(`画像アップロードに失敗しました: ${error.message}`);
  }

  const { data } = supabase.storage
    .from("post-images")
    .getPublicUrl(safePath);

  return data.publicUrl;
}

export async function ensureImageUrl(
  image: string,
  filePath: string
): Promise<string> {
  if (image.startsWith("http")) {
    return image;
  }

  return uploadBase64Image(image, filePath);
}