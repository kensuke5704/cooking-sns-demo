"use client";

import { useEffect, useRef, useState } from "react";

type ShotType = "prep" | "cooking" | "finished";

type DailyPhotos = {
  prep?: string;
  cooking?: string;
  finished?: string;
  dishName?: string;
  memo?: string;
};

type CameraPostProps = {
  onBack: () => void;
};

const shotLabels: Record<ShotType, string> = {
  prep: "準備",
  cooking: "調理",
  finished: "完成",
};

function getTodayKey() {
  const today = new Date().toISOString().slice(0, 10);
  return `daily-cooking-photos-${today}`;
}

export default function CameraPost({ onBack }: CameraPostProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [photos, setPhotos] = useState<DailyPhotos>({});
  const [selectedType, setSelectedType] = useState<ShotType | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [dishName, setDishName] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(getTodayKey());
    if (saved) {
      const parsed = JSON.parse(saved);
      setPhotos(parsed);
      setDishName(parsed.dishName || "");
      setMemo(parsed.memo || "");
    }
  }, []);

  const savePhotos = (nextPhotos: DailyPhotos) => {
    setPhotos(nextPhotos);
    localStorage.setItem(getTodayKey(), JSON.stringify(nextPhotos));
  };

  const savePostText = () => {
    const nextPhotos = {
      ...photos,
      dishName,
      memo,
    };
  
    savePhotos(nextPhotos);
    alert("料理名とコメントを保存しました");
  };

  const startCamera = async (type: ShotType) => {
    if (photos[type]) {
      alert(`${shotLabels[type]}は本日すでに撮影済みです。`);
      return;
    }

    setSelectedType(type);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setIsCameraOn(true);

      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      }, 100);
    } catch (error) {
      console.error(error);
      alert("カメラを起動できませんでした。HTTPS環境またはカメラ許可を確認してください。");
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;

    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    setIsCameraOn(false);
    setSelectedType(null);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !selectedType) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    const nextPhotos = {
      ...photos,
      [selectedType]: imageData,
    };

    savePhotos(nextPhotos);
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-[#f8b72a] px-4 pt-5 pb-28 text-[#6b2f13]">
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 rounded-full bg-white/90 px-4 py-2 text-sm font-black shadow"
        >
          ← ホームへ戻る
        </button>
  
        <div className="mb-6 rounded-[32px] bg-white p-5 shadow-xl">
          <p className="text-xs font-black text-[#f39a00]">TODAY'S COOKING</p>
          <h2 className="mt-1 text-3xl font-black leading-tight">
            今日の料理を
            <br />
            投稿する
          </h2>
          <p className="mt-3 text-sm font-bold opacity-70">
            準備・調理・完成の3枚を撮影できます。
          </p>
        </div>
  
        {!isCameraOn && (
          <div className="rounded-[32px] bg-[#6b2f13] p-4 shadow-xl">
            <div className="grid grid-cols-3 gap-3">
              <CameraCard
                label="準備"
                src={photos.prep}
                onClick={() => startCamera("prep")}
              />
              <CameraCard
                label="調理"
                src={photos.cooking}
                onClick={() => startCamera("cooking")}
              />
              <CameraCard
                label="完成"
                src={photos.finished}
                onClick={() => startCamera("finished")}
              />
            </div>
            <div className="mt-5 rounded-[32px] bg-white p-5 shadow-xl">
              <h3 className="text-xl font-black">料理メモ</h3>

              <label className="mt-4 block text-sm font-black">料理名</label>
              <input
               value={dishName}
               onChange={(e) => setDishName(e.target.value)}
                placeholder="例：アスパラベーコン"
                className="mt-2 w-full rounded-2xl border-2 border-[#f1d59a] px-4 py-3 font-bold outline-none"
             />

             <label className="mt-4 block text-sm font-black">コメント</label>
             <textarea
               value={memo}
               onChange={(e) => setMemo(e.target.value)}
               placeholder="例：少し焦げたけどおいしくできた"
               rows={3}
               className="mt-2 w-full resize-none rounded-2xl border-2 border-[#f1d59a] px-4 py-3 font-bold outline-none"
             />

             <button
               type="button"
               onClick={savePostText}
               className="mt-4 w-full rounded-full bg-[#f39a00] py-3 font-black text-white"
               >
                メモを保存
                </button>
            </div>
          </div>
        )}
  
        {isCameraOn && (
          <div className="rounded-[32px] bg-white p-4 shadow-xl">
            <p className="mb-3 text-center text-lg font-black">
              {selectedType ? `${shotLabels[selectedType]}を撮影中` : "撮影中"}
            </p>
  
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-[3/4] w-full rounded-[24px] bg-black object-cover"
            />
  
            <button
              onClick={takePhoto}
              className="mt-4 w-full rounded-full bg-[#f39a00] py-4 text-lg font-black text-white shadow"
            >
              撮影する
            </button>
  
            <button
              onClick={stopCamera}
              className="mt-3 w-full rounded-full bg-gray-100 py-3 font-black text-[#6b2f13]"
            >
              キャンセル
            </button>
          </div>
        )}
  
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

function CameraCard({
  label,
  src,
  onClick,
}: {
  label: string;
  src?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full">
      {src ? (
        <div className="bg-white p-2 pb-6 shadow-xl">
          <img
            src={src}
            alt={label}
            className="aspect-[3/4] w-full object-cover"
            draggable={false}
          />
          <p className="mt-1 text-center text-[11px] font-black text-[#6b2f13]">
            {label} 済み
          </p>
        </div>
      ) : (
        <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl border-2 border-dashed border-white/70 bg-white/20 text-sm font-black text-white">
          ＋ {label}
        </div>
      )}
    </button>
  );
}