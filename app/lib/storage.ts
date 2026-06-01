import { supabase } from "./supabase";

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(",");
  const contentType = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const raw = atob(parts[1]);
  const array = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i++) {
    array[i] = raw.charCodeAt(i);
  }

  return new Blob([array], { type: contentType });
}

async function normalizeImage(base64: string): Promise<Blob> {
  const originalBlob = base64ToBlob(base64);

  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(originalBlob);
  } catch {
    console.warn("画像変換できないため、元画像のままアップロードします", {
      type: originalBlob.type,
      size: originalBlob.size,
    });
  
    return originalBlob;
  }

  const maxWidth = 1200;
  const scale = Math.min(1, maxWidth / bitmap.width);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("画像変換に失敗しました");
  }

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

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