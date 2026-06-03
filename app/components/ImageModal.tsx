"use client";

import ViewportPortal from "./common/ViewportPortal";

type ImageModalProps = {
    src: string;
    onClose: () => void;
  };
  
  export default function ImageModal({ src, onClose }: ImageModalProps) {
    return (
      <ViewportPortal>
        <div
        onClick={onClose}
        className="fixed inset-0 z-[9999] flex min-h-[100dvh] items-center justify-center bg-black/70 p-6"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl bg-white p-4"
        >
          <img src={src} alt="" className="w-full rounded-xl object-cover" />
  
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-full bg-[#f39a00] py-3 font-black text-white"
          >
            閉じる
          </button>
        </div>
        </div>
      </ViewportPortal>
    );
  }
  