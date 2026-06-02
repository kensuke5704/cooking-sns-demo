import type { ReactNode } from "react";
import BottomNav from "./navigation/BottomNav";

type LayoutWithNavProps = {
  children: ReactNode;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  unreadCount: number;
};

export default function LayoutWithNav({
  children,
  currentTab,
  setCurrentTab,
  unreadCount,
}: LayoutWithNavProps) {
  return (
    <>
      {children}

      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
      />
    </>
  );
}
