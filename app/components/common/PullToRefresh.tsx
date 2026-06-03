"use client";

import { type ReactNode, useRef, useState } from "react";

type PullToRefreshProps = {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
};

const REFRESH_THRESHOLD = 72;
const MAX_PULL_DISTANCE = 104;

export default function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
}: PullToRefreshProps) {
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const canStartPull = () => {
    if (disabled || isRefreshing) return false;
    if (typeof window === "undefined") return false;

    return window.scrollY <= 0;
  };

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!canStartPull()) return;

    startYRef.current = event.touches[0].clientY;
    isPullingRef.current = true;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!isPullingRef.current || startYRef.current === null) return;

    const currentY = event.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff <= 0) {
      setPullDistance(0);
      return;
    }

    const distance = Math.min(diff * 0.45, MAX_PULL_DISTANCE);
    setPullDistance(distance);
  }

  async function handleTouchEnd() {
    if (!isPullingRef.current) return;

    const shouldRefresh = pullDistance >= REFRESH_THRESHOLD;

    startYRef.current = null;
    isPullingRef.current = false;

    if (!shouldRefresh) {
      setPullDistance(0);
      return;
    }

    setIsRefreshing(true);
    setPullDistance(REFRESH_THRESHOLD);

    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }

  return (
    <div
      className="relative min-h-screen overscroll-y-contain"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="pointer-events-none fixed left-0 right-0 top-0 z-[80] flex justify-center transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance - 56}px)` }}
      >
        <div className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-black text-[#f39a00] shadow-lg">
          {isRefreshing
            ? "更新中..."
            : pullDistance >= REFRESH_THRESHOLD
              ? "離して更新"
              : "下に引っ張って更新"}
        </div>
      </div>

      <div
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
