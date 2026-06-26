"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { getCurrentUser } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { resizeImageFile } from "../../lib/image";
import { publishPostData } from "../../lib/posts";
import CameraCard from "./CameraCard";
import AppPopup, { type AppPopupState } from "../common/AppPopup";
import ScreenShell from "../common/ScreenShell";
import SectionCard from "../common/SectionCard";


type ShotType = "prep" | "cooking" | "finished";
type TitleSuffix = "作りました" | "食べました" | "なし";

type DailyPhotos = {
  prep?: string;
  cooking?: string;
  finished?: string;
  dishName?: string;
  memo?: string;
  titleSuffix?: TitleSuffix;
};

type CameraPostProps = {
  onBack: () => void;
};

const shotLabels: Record<ShotType, string> = {
  prep: "準備",
  cooking: "調理",
  finished: "完成",
};

const titleSuffixOptions: TitleSuffix[] = ["作りました", "食べました", "なし"];


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

function getPostErrorMessage(error: unknown) {
  if (!error) return "時間を置いてもう一度お試しください。";

  if (typeof error === "string") return error;

  if (error instanceof Error) {
    return error.message || "時間を置いてもう一度お試しください。";
  }

  if (typeof error === "object") {
    const record = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const rawMessage =
      typeof record.message === "string" ? record.message : "";
    const details = typeof record.details === "string" ? record.details : "";
    const hint = typeof record.hint === "string" ? record.hint : "";
    const code = typeof record.code === "string" ? record.code : "";
    const joined = `${rawMessage} ${details} ${hint} ${code}`.toLowerCase();

    if (joined.includes("title_suffix")) {
      return "投稿タイトルの保存設定を更新しました。もう一度投稿してください。";
    }

    if (joined.includes("duplicate") || code === "23505") {
      return "同じ投稿がすでに保存されています。画面を更新して確認してください。";
    }

    if (joined.includes("row-level security") || code === "42501") {
      return "投稿する権限がありません。ログイン状態を確認してください。";
    }

    if (rawMessage) return rawMessage;
  }

  return "投稿に失敗しました。時間を置いてもう一度お試しください。";
}

export default function CameraPost({ onBack }: CameraPostProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [photos, setPhotos] = useState<DailyPhotos>({});
  const [selectedType, setSelectedType] = useState<ShotType | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [dishName, setDishName] = useState("");
  const [memo, setMemo] = useState("");
  const [titleSuffix, setTitleSuffix] = useState<TitleSuffix>("作りました");
  const [isTitleSuffixOpen, setIsTitleSuffixOpen] = useState(false);
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
      setTitleSuffix(parsed.titleSuffix || "作りました");
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
        setTitleSuffix("作りました");
        setIsTitleSuffixOpen(false);
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
      titleSuffix,
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

    const hasPhoto = Boolean(photos.prep || photos.cooking || photos.finished);

    if (!hasPhoto) {
      setPopup({ title: "写真を追加してください", message: "" });
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
        titleSuffix,
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
        setTitleSuffix("作りました");
        setIsTitleSuffixOpen(false);
      }
  
      setPopup({
        title: "投稿しました",
        message: shouldCompleteDraft
          ? "完成まで投稿しました。次の料理を開始できます。"
          : "投稿しました。続きの写真を追加できます。",
      });
  
      onBack();
    } catch (error: unknown) {
      console.error("投稿エラー:", error);
      setPopup({
        title: "投稿に失敗しました",
        message: getPostErrorMessage(error),
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
    <ScreenShell>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[24px] leading-none text-[#3f2116]"
          aria-label="戻る"
        >
          ‹
        </button>
        <h1 className="flex-1 text-[18px] font-black text-[#3f2116]">
          今日の記録
        </h1>
        <img
          src={getCurrentUser()?.iconUrl || "/images/user1-icon.jpg"}
          alt="ユーザー"
          className="h-9 w-9 rounded-full bg-[#fff8e6] object-cover ring-2 ring-[#fff8e6]"
        />
      </div>
  
        {!isCameraOn && (
          <>
            <section className="rounded-[8px] bg-[#fffaf2]/94 p-3 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
              <div className="grid grid-cols-[1fr_112px] items-center gap-2">
                <div className="min-w-0">
                  <h2 className="text-[20px] font-black leading-[1.16] text-[#3f2116]">
                    準備、調理、完成を
                    <br />
                    3枚で残す
                  </h2>
                  <p className="mt-2 text-[10px] font-bold leading-relaxed text-[#3f2116]/72">
                    撮った順に今日の料理がひとつの投稿になります。
                  </p>
                </div>
                <div className="relative h-[82px]" aria-hidden="true">
                  <div className="absolute right-4 top-5 h-16 w-24 rounded-b-[38px] rounded-t-[18px] bg-[#f4a72d]" />
                  <div className="absolute right-8 top-2 h-9 w-20 rounded-[100%] bg-[#fff1ce] ring-2 ring-[#7a4328]/15" />
                  <div className="absolute right-2 top-16 h-12 w-14 rotate-[8deg] rounded-[8px] bg-[#fffaf2] p-1 shadow-md">
                    <div className="h-7 rounded bg-[#dcebc9]" />
                  </div>
                  <div className="absolute right-20 top-16 h-12 w-14 -rotate-[8deg] rounded-[8px] bg-[#fffaf2] p-1 shadow-md">
                    <div className="h-7 rounded bg-[#f2c7a7]" />
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-3 space-y-2">
              <StepPhotoCard number="1" title="準備" description="材料をそろえたところや、下ごしらえの様子を撮ろう">
                <CameraCard
                  label="準備"
                  src={photos.prep}
                  onClick={() => startCamera("prep")}
                  onFileChange={(e) => selectPhotoFromLibrary(e, "prep")}
                />
              </StepPhotoCard>
              <StepPhotoCard number="2" title="調理" description="火にかけているところや、煮ている様子を撮ろう">
                <CameraCard
                  label="調理"
                  src={photos.cooking}
                  onClick={() => startCamera("cooking")}
                  onFileChange={(e) => selectPhotoFromLibrary(e, "cooking")}
                />
              </StepPhotoCard>

              <StepPhotoCard number="3" title="完成" description="できあがりの料理を撮ろう">
                <CameraCard
                  label="完成"
                  src={photos.finished}
                  onClick={() => startCamera("finished")}
                  onFileChange={(e) => selectPhotoFromLibrary(e, "finished")}
                />
              </StepPhotoCard>
            </div>

            <div className="mt-3 rounded-[8px] bg-[#fffaf2]/94 p-3 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
              <h3 className="text-[13px] font-black text-[#3f2116]">料理メモ</h3>

              <label className="mt-2 block text-[10px] font-black text-[#3f2116]">料理名</label>
              <input
	               value={dishName}
	               onChange={(e) => setDishName(e.target.value)}
                placeholder="料理名"
                className="mt-1 w-full rounded-[6px] border border-[#dfc79d] bg-[#fffaf2] px-3 py-2 text-[12px] font-bold text-[#3f2116] outline-none"
	             />

              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setIsTitleSuffixOpen((v) => !v)}
	                  className="flex w-full items-center justify-between rounded-[6px] border border-[#dfc79d] bg-[#fffaf2] px-3 py-2 text-left text-[12px] font-black text-[#3f2116]"
                >
                  <span>{titleSuffix}</span>
                  <span className="text-xs opacity-50">{isTitleSuffixOpen ? "閉じる" : "選択"}</span>
                </button>

                {isTitleSuffixOpen && (
	                  <div className="mt-2 grid grid-cols-3 gap-1 rounded-[18px] bg-[#fff8e6] p-1">
                    {titleSuffixOptions.map((option) => {
                      const active = titleSuffix === option;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setTitleSuffix(option);
                            setIsTitleSuffixOpen(false);
                          }}
	                        className={`min-w-0 whitespace-nowrap rounded-[13px] px-0 py-2 text-[10px] font-black leading-none ${
	                            active
	                              ? "bg-[#0f6a47] text-white"
	                              : "bg-[#fff4d7] text-[#3f2116]"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

	             <label className="mt-2 block text-[10px] font-black text-[#3f2116]">ひとこと</label>
	             <textarea
               value={memo}
               onChange={(e) => setMemo(e.target.value)}
	               placeholder="今日のごはんに添えるひとこと"
	               rows={2}
	               className="mt-1 w-full resize-none rounded-[6px] border border-[#dfc79d] bg-[#fffaf2] px-3 py-2 text-[12px] font-bold text-[#3f2116] outline-none"
	             />

              <button
                type="button"
                onClick={savePostText}
                disabled={isPublishing}
	                className={`mt-2 w-full rounded-full py-2 text-[12px] font-black ${
	                  isPublishing
	                    ? "cursor-not-allowed bg-[#0f6a47]/40 text-white"
	                    : "bg-[#fff8e6] text-[#3f2116] ring-1 ring-[#dfc79d]"
	                }`}
	              >
	                下書き保存
              </button>

              <button
                type="button"
                onClick={resetTodayPhotos}
                disabled={isPublishing}
	                className={`mt-2 w-full rounded-full border border-[#dfc79d] py-2 text-[12px] font-black text-[#3f2116] ${
	                  isPublishing ? "cursor-not-allowed bg-white/50" : "bg-[#fffaf2]"
                }`}
              >
                今日の写真をリセット
              </button>
              
              <button
                type="button"
                onClick={publishPost}
                disabled={isPublishing}
	                className={`mt-2 w-full rounded-full py-3 text-[14px] font-black text-[#fff8e6] shadow-[0_12px_24px_rgba(15,106,71,0.24)] ${
	                  isPublishing
	                    ? "cursor-not-allowed bg-[#0f6a47]/50"
	                    : "bg-[#0f6a47]"
	                }`}
              >
                {isPublishing ? "アップロード中..." : "投稿する"}
              </button>
            </div>
          </>
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

function StepPhotoCard({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid grid-cols-[112px_1fr] items-center gap-3 rounded-[8px] bg-[#fffaf2]/94 p-2 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
      <div className="-ml-1">{children}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f6a47] text-[12px] font-black text-[#fff8e6]">
            {number}
          </span>
          <h2 className="text-[16px] font-black text-[#3f2116]">{title}</h2>
        </div>
        <p className="mt-2 text-[10px] font-bold leading-relaxed text-[#3f2116]/75">
          {description}
        </p>
      </div>
    </section>
  );
}
