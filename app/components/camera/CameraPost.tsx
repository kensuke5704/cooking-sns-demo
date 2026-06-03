"use client";

import { useEffect, useRef, useState } from "react";
import { getCurrentUser } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { resizeImageFile } from "../../lib/image";
import { publishPostData } from "../../lib/posts";
import CameraCard from "./CameraCard";
import AppPopup, { type AppPopupState } from "../common/AppPopup";
import ScreenShell from "../common/ScreenShell";
import SectionCard from "../common/SectionCard";


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
  const [popup, setPopup] = useState<AppPopupState | null>(null);

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
    setPopup({
      title: "今日の写真をリセットしますか？",
      message: "撮影済みの写真とメモがこの端末から削除されます。",
      confirmLabel: "リセットする",
      cancelLabel: "やめる",
      onConfirm: () => {
        const currentUser = getCurrentUser();

        localStorage.removeItem(getTodayKey(currentUser?.userId));
        clearDraftId(currentUser?.userId);

        setPhotos({});
        setDishName("");
        setMemo("");
        setSelectedType(null);
        setIsCameraOn(false);
      },
    });
  };

  const savePostText = () => {
    const nextPhotos = {
      ...photos,
      dishName,
      memo,
    };
  
    savePhotos(nextPhotos);
    setPopup({ title: "保存しました", message: "料理名とコメントを保存しました。" });
  };

  const publishPost = async () => {
    if (isPublishing) return;
  
    const currentUser = getCurrentUser();
  
    if (!currentUser) {
      setPopup({ title: "ログインしてください", message: "投稿するにはログインが必要です。" });
      return;
    }

    const hasAnyPhoto = Boolean(photos.prep || photos.cooking || photos.finished);

    if (!hasAnyPhoto) {
      setPopup({ title: "写真を追加してください" });
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
  
      setPopup({
        title: "投稿しました",
        message: shouldCompleteDraft
          ? "完成まで投稿しました。次の料理を開始できます。"
          : "投稿しました。続きの写真を追加できます。",
      });
  
      onBack();
    } catch (error: any) {
      console.error("投稿エラー:", error);
      setPopup({
        title: "投稿に失敗しました",
        message: `型: ${typeof error}
内容: ${String(error)}`,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const startCamera = async (type: ShotType) => {
    if (photos[type]) {
      setPopup({ title: "撮影済みです", message: `${shotLabels[type]}は本日すでに撮影済みです。` });
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
      setPopup({ title: "カメラを起動できませんでした", message: "HTTPS環境またはカメラ許可を確認してください。" });
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
      setPopup({ title: "登録済みです", message: `${shotLabels[type]}は本日すでに登録済みです。` });
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
        setPopup({ title: "画像の読み込みに失敗しました", message: "別の画像で試してください。" });
      });
  };

  return (
    <ScreenShell
      label="TODAY'S COOKING"
      title="今日の料理を投稿"
      subtitle="準備・調理・完成の順に写真を残せます。"
      action={
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-white/90 px-4 py-2 text-sm font-black shadow-[0_10px_24px_rgba(107,47,19,0.12)]"
        >
          戻る
        </button>
      }
    >
  
        {!isCameraOn && (
          <SectionCard label="PHOTOS" title="写真" description="各カードを押すと撮影、ライブラリからも選択できます。">
            <div className="rounded-[28px] bg-[#6b2f13] p-4">
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
            </div>
            <div className="mt-5 rounded-[24px] border border-[#f1d59a]/65 bg-[#fff4d7]/75 p-4">
              <h3 className="text-xl font-black">料理メモ</h3>

              <label className="mt-4 block text-sm font-black">料理名</label>
              <input
               value={dishName}
               onChange={(e) => setDishName(e.target.value)}
                placeholder="例：アスパラベーコン"
                className="mt-2 w-full rounded-[18px] border border-[#f1d59a] px-4 py-3 font-bold outline-none"
             />

             <label className="mt-4 block text-sm font-black">コメント</label>
             <textarea
               value={memo}
               onChange={(e) => setMemo(e.target.value)}
               placeholder="例：少し焦げたけどおいしくできた"
               rows={3}
               className="mt-2 w-full resize-none rounded-[18px] border border-[#f1d59a] px-4 py-3 font-bold outline-none"
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
          </SectionCard>
        )}
  
        {isCameraOn && (
          <SectionCard title={selectedType ? `${shotLabels[selectedType]}を撮影中` : "撮影中"}>
            <div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-[3/4] w-full rounded-[24px] bg-black object-cover"
            />
  
            <button
              onClick={takePhoto}
              className="mt-4 w-full rounded-full bg-[#f39a00] py-4 text-lg font-black text-white shadow-[0_10px_24px_rgba(107,47,19,0.12)]"
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
          </SectionCard>
        )}

        <canvas ref={canvasRef} className="hidden" />
      <AppPopup popup={popup} onClose={() => setPopup(null)} />
    </ScreenShell>
  );
}