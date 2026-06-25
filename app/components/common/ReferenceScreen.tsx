"use client";

import type { ReactNode } from "react";

type ReferenceScreenProps = {
  image: string;
  children?: ReactNode;
};

export default function ReferenceScreen({ image, children }: ReferenceScreenProps) {
  return (
    <main className="min-h-[100dvh] bg-[#f4a72d]">
      <div className="relative mx-auto h-[100dvh] w-full max-w-md overflow-hidden">
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-fill"
          draggable={false}
        />
        <div className="absolute inset-0 z-10">{children}</div>
      </div>
    </main>
  );
}

export function ReferenceNavOverlay({
  setCurrentTab,
}: {
  setCurrentTab: (tab: string) => void;
}) {
  const tabs = ["ホーム", "つながり", "カメラ", "カレンダー", "プロフィール"];

  return (
    <div className="absolute inset-x-[3%] bottom-[1.5%] grid h-[11.5%] grid-cols-5">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setCurrentTab(tab)}
          className="h-full w-full opacity-0"
          aria-label={tab}
        />
      ))}
    </div>
  );
}
