import { supabase } from "./supabase";

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(",");
  const contentType = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }

  return new Blob([array], { type: contentType });
}

export async function uploadBase64Image(
  base64: string,
  filePath: string
): Promise<string> {
  const blob = base64ToBlob(base64);

  const { error } = await supabase.storage
    .from("post-images")
    .upload(filePath, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error("画像アップロードエラー:", error);
    throw new Error(`画像アップロードに失敗しました: ${error.message}`);
  }

  const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);

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