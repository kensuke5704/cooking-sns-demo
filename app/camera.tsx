"use client";

import { useEffect, useRef, useState } from "react";

type ShotType = "prep" | "cooking" | "finished";

type DailyPhotos = {
  prep?: string;
  cooking?: string;
  finished?: string;
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

export default function CameraPost() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [photos, setPhotos] = useState<DailyPhotos>({});
  const [selectedType, setSelectedType] = useState<ShotType | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(getTodayKey());
    if (saved) {
      setPhotos(JSON.parse(saved));
    }
  }, []);

  const savePhotos = (nextPhotos: DailyPhotos) => {
    setPhotos(nextPhotos);
    localStorage.setItem(getTodayKey(), JSON.stringify(nextPhotos));
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
    <div className="w-full min-h-screen bg-[#f7b18f] pb-28 px-4 pt-6">
      <div className="w-full max-w-md mx-auto">
        <h2 className="text-2xl font-black text-[#6b2f13] text-center mb-2">
          今日の料理を投稿
        </h2>

        <p className="text-center text-sm font-bold text-[#6b2f13]/80 mb-6">
          撮影するカードを選んでください
        </p>

        {!isCameraOn && (
          <div className="bg-[#8a4728] rounded-[32px] overflow-hidden shadow-lg">
            <div className="bg-[#f7b18f] px-4 py-5">
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
            </div>

            <div className="h-9 bg-[#8a4728]" />
          </div>
        )}

        {isCameraOn && (
          <div className="bg-white rounded-3xl shadow-lg p-4">
            <p className="text-center font-black text-[#6b2f13] mb-3">
              {selectedType ? `${shotLabels[selectedType]}を撮影中` : "撮影中"}
            </p>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[3/4] rounded-2xl bg-black object-cover"
            />

            <button
              onClick={takePhoto}
              className="w-full mt-4 bg-[#ffcf33] text-black font-black py-3 rounded-2xl"
            >
              撮影する
            </button>

            <button
              onClick={stopCamera}
              className="w-full mt-2 bg-gray-200 text-black font-bold py-3 rounded-2xl"
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
      <button onClick={onClick} className="w-full aspect-[3/4]">
        {src ? (
          <div className="w-full h-full bg-white p-2 pb-7 shadow-xl">
            <img
              src={src}
              alt={label}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <p className="text-[11px] font-black text-[#6b2f13] mt-1 text-center">
              {label} 済み
            </p>
          </div>
        ) : (
          <div className="w-full h-full rounded-xl border-2 border-dashed border-white/70 bg-white/20 flex items-center justify-center text-white text-sm font-black">
            {label}
          </div>
        )}
      </button>
    );
  }