export function resizeImageFile(
    file: File,
    maxWidth = 900,
    quality = 0.6
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
  
      reader.onload = () => {
        img.src = reader.result as string;
      };
  
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
  
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
  
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("画像変換に失敗しました"));
          return;
        }
  
        ctx.drawImage(img, 0, 0, width, height);
  
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
  
      img.onerror = () => reject(new Error("画像読み込みに失敗しました"));
      reader.onerror = () => reject(new Error("ファイル読み込みに失敗しました"));
  
      reader.readAsDataURL(file);
    });
  }