import { supabase } from "./supabase";

export async function uploadBase64Image(
  base64: string,
  filePath: string
): Promise<string> {
  const res = await fetch(base64);
  const blob = await res.blob();

  const { error } = await supabase.storage
    .from("post-images")
    .upload(filePath, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error(error);
    throw new Error("画像アップロードに失敗しました");
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