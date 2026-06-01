export function resizeImageFile(
  file: File,
  maxWidth = 900,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("ファイル読み込みに失敗しました"));
    };

    reader.onload = async () => {
      const originalDataUrl = reader.result as string;

      try {
        const bitmap = await createImageBitmap(file);

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
        console.warn("画像圧縮に失敗したため元画像を使用します:", error);
        resolve(originalDataUrl);
      }
    };

    reader.readAsDataURL(file);
  });
}