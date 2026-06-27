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
  setCurrentTab?: (tab: string) => void;
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

export default function CameraPost({ onBack, setCurrentTab }: CameraPostProps) {
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
    <ScreenShell className="pt-1">
      <div className="mb-0 flex h-7 items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[22px] leading-none text-[#3f2116]"
          aria-label="戻る"
        >
          <svg viewBox="0 0 24 24" className="h-[23px] w-[23px]" aria-hidden="true" fill="none">
            <path d="M15.5 5.2 8.7 12l6.8 6.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
          </svg>
        </button>
        <h1 className="ml-6 flex-1 text-[17px] font-black text-[#3f2116]">
          今日の記録
        </h1>
        <CameraHeaderAvatar iconUrl={getCurrentUser()?.iconUrl} />
      </div>
  
        {!isCameraOn && (
          <>
            <section className="relative mx-1 h-[104px] overflow-hidden rounded-[8px] bg-[#fffaf2]/94 px-5 py-4 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
              <div className="relative z-10 max-w-[55%]">
                  <h2 className="text-[17px] font-black leading-[1.35] text-[#3f2116]">
                    準備、調理、完成を
                    <br />
                    3枚で残す
                  </h2>
                  <p className="mt-2 text-[10px] font-bold leading-[1.55] text-[#3f2116]/72">
                    撮った順に今日の料理がひとつの投稿になります。
                  </p>
              </div>
              <img
                src="/design-targets/camera-hero-illustration-crop-alpha.png"
                alt=""
                aria-hidden="true"
                className="absolute right-1 top-2 h-[98px] w-[168px] object-contain"
                draggable={false}
              />
            </section>

            <div className="mx-1 mt-2.5 space-y-1.5">
              <StepPhotoCard
                number="1"
                title="準備"
                description="材料をそろえたところや、下ごしらえの様子を撮ろう"
                onReset={photos.prep ? resetTodayPhotos : undefined}
              >
                <CameraCard
                  label="準備"
                  src={photos.prep}
                  tilt="left"
                  onClick={() => startCamera("prep")}
                  onFileChange={(e) => selectPhotoFromLibrary(e, "prep")}
                />
              </StepPhotoCard>
              <StepPhotoCard
                number="2"
                title="調理"
                description="火にかけているところや、煮ている様子を撮ろう"
                onReset={photos.cooking ? resetTodayPhotos : undefined}
              >
                <CameraCard
                  label="調理"
                  src={photos.cooking}
                  tilt="right"
                  onClick={() => startCamera("cooking")}
                  onFileChange={(e) => selectPhotoFromLibrary(e, "cooking")}
                />
              </StepPhotoCard>

              <StepPhotoCard
                number="3"
                title="完成"
                description="できあがりの料理を撮ろう"
                onReset={photos.finished ? resetTodayPhotos : undefined}
              >
                <CameraCard
                  label="完成"
                  src={photos.finished}
                  tilt="soft"
                  onClick={() => startCamera("finished")}
                  onFileChange={(e) => selectPhotoFromLibrary(e, "finished")}
                />
              </StepPhotoCard>
            </div>

            <div className="mx-1 mt-2.5 h-[111px] overflow-visible rounded-[8px] bg-[#fffaf2]/94 px-3 py-2 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
              <div className="flex items-center justify-between">
                <label className="block text-[9px] font-black text-[#3f2116]">料理名</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTitleSuffixOpen((v) => !v)}
                    aria-label="投稿タイトルの文言を選ぶ"
                    className="h-[20px] rounded-full bg-transparent px-2 text-[9px] font-black leading-none text-transparent"
                  >
                    {titleSuffix}
                  </button>

                  {isTitleSuffixOpen && (
                    <div className="absolute right-0 top-[calc(100%+5px)] z-20 grid w-[150px] grid-cols-3 gap-1 rounded-[8px] bg-[#fff8e6] p-1 shadow-[0_10px_18px_rgba(63,33,22,0.14)] ring-1 ring-[#dfc79d]">
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
                            className={`min-w-0 whitespace-nowrap rounded-[13px] px-0 py-1.5 text-[9px] font-black leading-none ${
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
              </div>
              <input
		               value={dishName}
		               onChange={(e) => setDishName(e.target.value)}
                placeholder="料理名"
                className="mt-1 h-[24px] w-full rounded-[6px] border border-[#dfc79d] bg-[#fffaf2] px-3 py-0 text-[10px] font-bold leading-none text-[#3f2116] outline-none"
		             />

		             <label className="mt-1 block text-[9px] font-black text-[#3f2116]">ひとこと</label>
		             <textarea
	               value={memo}
	               onChange={(e) => setMemo(e.target.value)}
		               placeholder="今日のごはんに添えるひとこと"
		               rows={1}
		               className="mt-1 h-[24px] w-full resize-none rounded-[6px] border border-[#dfc79d] bg-[#fffaf2] px-3 py-[6px] text-[10px] font-bold leading-none text-[#3f2116] outline-none"
		             />
            </div>

            <div className="mx-2 mt-1.5 space-y-1.5">
              <button
                type="button"
                onClick={publishPost}
                disabled={isPublishing}
		                className={`h-[28px] w-full rounded-full text-[11px] font-black leading-none text-[#fff8e6] shadow-[0_10px_18px_rgba(15,106,71,0.2)] ${
		                  isPublishing
		                    ? "cursor-not-allowed bg-[#0f6a47]/50"
		                    : "bg-[#0f6a47]"
		                }`}
              >
                {isPublishing ? "アップロード中..." : "投稿する"}
              </button>

              <button
                type="button"
                onClick={savePostText}
                disabled={isPublishing}
		                className={`h-[22px] w-full rounded-full text-[10px] font-black leading-none ${
		                  isPublishing
		                    ? "cursor-not-allowed bg-[#0f6a47]/40 text-white"
		                    : "bg-[#fff8e6] text-[#3f2116] ring-1 ring-[#dfc79d]"
	                }`}
	              >
	                下書き保存
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
      {setCurrentTab && <CameraBottomNav setCurrentTab={setCurrentTab} />}
    </ScreenShell>
  );
}

function CameraBottomNav({
  setCurrentTab,
}: {
  setCurrentTab: (tab: string) => void;
}) {
  const tabs = [
    { label: "ホーム", icon: "home", text: "ホーム" },
    { label: "つながり", icon: "friends", text: "つながり" },
    { label: "カメラ", icon: "camera", text: "撮る" },
    { label: "カレンダー", icon: "calendar", text: "カレンダー" },
    { label: "プロフィール", icon: "profile", text: "マイページ" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[58px] max-w-md px-3">
      <div className="absolute inset-x-3 bottom-0 h-[51px] rounded-t-[18px] bg-[#fff8e6]/96 shadow-[0_10px_24px_rgba(63,33,22,0.16)] ring-1 ring-white/70" />
      <div className="absolute inset-x-3 bottom-0 grid h-[51px] grid-cols-5">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setCurrentTab(tab.label)}
            className={`relative flex h-full w-full flex-col items-center justify-center rounded-[14px] text-[9px] font-black leading-none ${
              tab.label === "カメラ" ? "-mt-4 text-[#0f6a47]" : "text-[#9d7140]"
            }`}
            aria-label={tab.label}
          >
            <span className={`mb-1 flex items-center justify-center ${tab.label === "カメラ" ? "h-12 w-12 rounded-full bg-[#0f6a47] shadow-[0_10px_22px_rgba(15,106,71,0.26)] ring-4 ring-[#fff8e6]" : "h-5 w-5 opacity-65"}`}>
              <CameraNavIcon
                type={tab.icon}
                className={tab.label === "カメラ" ? "h-5 w-5 text-[#fff8e6]" : "h-5 w-5 text-current"}
              />
            </span>
            <span className="text-[8px] leading-none">{tab.text}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function CameraHeaderAvatar({ iconUrl }: { iconUrl?: string }) {
  return (
    <span className="mr-1 flex h-9 w-9 -translate-y-0.5 items-center justify-center rounded-full bg-[#fff8e6] shadow-[0_6px_14px_rgba(63,33,22,0.12)] ring-1 ring-white/80">
      <img
        src={iconUrl || "/images/user1-icon.jpg"}
        alt="ユーザー"
        className="h-[30px] w-[30px] rounded-full bg-[#dcebc9] object-cover"
      />
    </span>
  );
}

function CameraNavIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const stroke = "currentColor";

  if (type === "home") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <path d="M4.5 10.5 12 4.2l7.5 6.3v8.4a1.4 1.4 0 0 1-1.4 1.4h-4.2v-5.7h-3.8v5.7H5.9a1.4 1.4 0 0 1-1.4-1.4v-8.4Z" fill={stroke} stroke={stroke} strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    );
  }

  if (type === "friends") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <circle cx="8.2" cy="8.3" r="3" stroke={stroke} strokeWidth="1.8" />
        <circle cx="16.4" cy="9.1" r="2.6" stroke={stroke} strokeWidth="1.8" />
        <path d="M3.6 19.2c.7-3.4 2.7-5.2 4.9-5.2s4 1.8 4.5 5.2M12.6 18.8c.5-2.6 1.9-4.1 3.8-4.1 1.8 0 3.2 1.5 3.8 4.1" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (type === "calendar") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <path d="M7 4.5v3M17 4.5v3M4.8 9.4h14.4" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
        <rect x="4.5" y="6.5" width="15" height="13.2" rx="2.2" stroke={stroke} strokeWidth="1.8" />
        <path d="M8.1 12.7h.1M12 12.7h.1M15.9 12.7h.1M8.1 16h.1M12 16h.1" stroke={stroke} strokeLinecap="round" strokeWidth="2.2" />
      </svg>
    );
  }

  if (type === "profile") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <circle cx="12" cy="8" r="3.3" stroke={stroke} strokeWidth="1.8" />
        <path d="M5.4 19.4c.9-4.1 3.2-6.1 6.6-6.1s5.7 2 6.6 6.1" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path d="M8 8.3h1.8l1-1.7h2.4l1 1.7H16a2.5 2.5 0 0 1 2.5 2.5v5.4a2.5 2.5 0 0 1-2.5 2.5H8a2.5 2.5 0 0 1-2.5-2.5v-5.4A2.5 2.5 0 0 1 8 8.3Z" stroke={stroke} strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="13.5" r="2.8" stroke={stroke} strokeWidth="1.8" />
    </svg>
  );
}

function StepPhotoCard({
  number,
  title,
  description,
  onReset,
  children,
}: {
  number: string;
  title: string;
  description: string;
  onReset?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="relative grid h-[94px] grid-cols-[154px_1fr] items-center gap-3 overflow-hidden rounded-[8px] bg-[#fffaf2]/94 p-2 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="absolute right-3 top-3 z-10 flex h-4 w-4 items-center justify-center rounded-full border border-[#dfc79d] bg-[#fffaf2] text-[11px] font-black leading-none text-[#3f2116]/70"
          aria-label="今日の写真をリセット"
        >
          ×
        </button>
      )}
      <div className="ml-2.5 w-[138px]">{children}</div>
      <div className="min-w-0 -translate-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#0f6a47] text-[11px] font-black text-[#fff8e6]">
            {number}
          </span>
          <h2 className="text-[14px] font-black text-[#3f2116]">{title}</h2>
        </div>
        <p className="mt-1.5 max-w-[136px] text-[8px] font-bold leading-[1.6] text-[#3f2116]/75">
          {description}
        </p>
      </div>
    </section>
  );
}
