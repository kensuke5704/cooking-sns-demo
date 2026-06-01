async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;

  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.8,
  });

  const jpegBlob = Array.isArray(converted) ? converted[0] : converted;

  return new File(
    [jpegBlob],
    file.name.replace(/\.(heic|heif)$/i, ".jpg"),
    {
      type: "image/jpeg",
    }
  );
}

export async function resizeImageFile(
  file: File,
  maxWidth = 900,
  quality = 0.6
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");

      const targetFile = isHeic
        ? await convertHeicToJpeg(file)
        : file;

      const reader = new FileReader();

      reader.onerror = () => {
        reject(new Error("ファイル読み込みに失敗しました"));
      };

      reader.onload = async () => {
        const originalDataUrl = reader.result as string;

        try {
          const bitmap = await createImageBitmap(targetFile);

          const scale = Math.min(1, maxWidth / bitmap.width);
          const width = Math.round(bitmap.width * scale);
          const height = Math.round(bitmap.height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve(originalDataUrl);
            return;
          }

          ctx.drawImage(bitmap, 0, 0, width, height);

          const resizedDataUrl = canvas.toDataURL("image/jpeg", quality);

          resolve(resizedDataUrl);
        } catch (error) {
          console.error("画像変換エラー:", error);
          reject(new Error("画像の変換に失敗しました"));
        }
      };

      reader.readAsDataURL(targetFile);
    } catch (error) {
      console.error("HEIC変換エラー:", error);
      reject(new Error("HEIC画像の変換に失敗しました"));
    }
  });
}