"use client";

import { useEffect, useRef, useState } from "react";
import { getCurrentUser } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { resizeImageFile } from "../../lib/image";
import { publishPostData } from "../../lib/posts";
import CameraCard from "./CameraCard";


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


function getTodayKey(userId?: string) {
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Tokyo",
  });
  return `daily-cooking-photos-${userId || "guest"}-${today}`;
}

function getDraftIdKey(userId?: string) {
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Tokyo",
  });
  return `daily-cooking-draft-id-${userId || "guest"}-${today}`;
}

function getOrCreateDraftId(userId?: string) {
  const key = getDraftIdKey(userId);
  const saved = localStorage.getItem(key);

  if (saved) return saved;

  const nextId = crypto.randomUUID();
  localStorage.setItem(key, nextId);
  return nextId;
}

function clearDraftId(userId?: string) {
  localStorage.removeItem(getDraftIdKey(userId));
}


export default function CameraPost({ onBack }: CameraPostProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [photos, setPhotos] = useState<DailyPhotos>({});
  const [selectedType, setSelectedType] = useState<ShotType | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [dishName, setDishName] = useState("");
  const [memo, setMemo] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const saved = localStorage.getItem(getTodayKey(currentUser?.userId));
  
    if (saved) {
      const parsed = JSON.parse(saved);
      setPhotos(parsed);
      setDishName(parsed.dishName || "");
      setMemo(parsed.memo || "");
    }
  }, []);

  const savePhotos = (nextPhotos: DailyPhotos) => {
    const currentUser = getCurrentUser();
  
    setPhotos(nextPhotos);
    localStorage.setItem(
      getTodayKey(currentUser?.userId),
      JSON.stringify(nextPhotos)
    );
  };

  const resetTodayPhotos = () => {
    const ok = confirm("今日撮った写真とメモをリセットしますか？");
  
    if (!ok) return;
  
    const currentUser = getCurrentUser();
  
    localStorage.removeItem(getTodayKey(currentUser?.userId));
    clearDraftId(currentUser?.userId);
  
    setPhotos({});
    setDishName("");
    setMemo("");
    setSelectedType(null);
    setIsCameraOn(false);
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

  const publishPost = async () => {
    if (isPublishing) return;
  
    const currentUser = getCurrentUser();
  
    if (!currentUser) {
      alert("ログインしてください");
      return;
    }
  
    setIsPublishing(true);
  
    try {
      const draftId = getOrCreateDraftId(currentUser.userId);
  
      const { existingPost, finishedPhotoUrl } = await publishPostData({
        userId: currentUser.userId,
        userName: currentUser.name,
        dishName,
        memo,
        photos,
        draftId,
      });
  
      const shouldCompleteDraft = Boolean(
        finishedPhotoUrl || existingPost?.finished_photo
      );
  
      if (shouldCompleteDraft) {
        localStorage.removeItem(getTodayKey(currentUser.userId));
  
        clearDraftId(currentUser.userId);
  
        setPhotos({});
        setDishName("");
        setMemo("");
      }
  
      alert(
        shouldCompleteDraft
          ? "完成まで投稿しました。次の料理を開始できます。"
          : "投稿しました。続きの写真を追加できます。"
      );
  
      onBack();
    } catch (error) {
      console.error("投稿エラー:", error);

      alert(
        `投稿に失敗しました\n\n${JSON.stringify(error)}`
      );
    } finally {
      setIsPublishing(false);
    }
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

    const maxWidth = 900;
    const scale = Math.min(1, maxWidth / video.videoWidth);

    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.6);

    const nextPhotos = {
      ...photos,
      [selectedType]: imageData,
    };

    savePhotos(nextPhotos);
    stopCamera();
  };

  const selectPhotoFromLibrary = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: ShotType
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    if (photos[type]) {
      alert(`${shotLabels[type]}は本日すでに登録済みです。`);
      return;
    }
  
    resizeImageFile(file, 900, 0.6)
      .then((imageData) => {
        const nextPhotos = {
          ...photos,
          [type]: imageData,
        };

        savePhotos(nextPhotos);
      })
      .catch((error) => {
        console.error(error);
        alert("画像の読み込みに失敗しました");
      });
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
              onFileChange={(e) => selectPhotoFromLibrary(e, "prep")}
            />
              <CameraCard
                label="調理"
                src={photos.cooking}
                onClick={() => startCamera("cooking")}
                onFileChange={(e) => selectPhotoFromLibrary(e, "cooking")}
              />
              <CameraCard
                label="完成"
                src={photos.finished}
                onClick={() => startCamera("finished")}
                onFileChange={(e) => selectPhotoFromLibrary(e, "finished")}
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
                disabled={isPublishing}
                className={`mt-4 w-full rounded-full py-3 font-black text-white ${
                  isPublishing
                    ? "cursor-not-allowed bg-[#f39a00]/50"
                    : "bg-[#f39a00]"
                }`}
              >
                メモを保存
              </button>

              <button
                type="button"
                onClick={resetTodayPhotos}
                disabled={isPublishing}
                className={`mt-3 w-full rounded-full border-2 border-[#6b2f13] py-3 font-black text-[#6b2f13] ${
                  isPublishing ? "cursor-not-allowed bg-white/50" : "bg-white"
                }`}
              >
                今日の写真をリセット
              </button>
              
              <button
                type="button"
                onClick={publishPost}
                disabled={isPublishing}
                className={`mt-3 w-full rounded-full py-3 font-black text-white ${
                  isPublishing
                    ? "cursor-not-allowed bg-[#6b2f13]/50"
                    : "bg-[#6b2f13]"
                }`}
              >
                {isPublishing ? "アップロード中..." : "投稿する"}
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