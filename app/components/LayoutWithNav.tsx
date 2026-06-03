import type { ReactNode } from "react";
import PullToRefresh from "./common/PullToRefresh";
import BottomNav from "./navigation/BottomNav";

type LayoutWithNavProps = {
  children: ReactNode;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  unreadCount: number;
  onRefresh?: () => Promise<void> | void;
};

export default function LayoutWithNav({
  children,
  currentTab,
  setCurrentTab,
  unreadCount,
  onRefresh,
}: LayoutWithNavProps) {
  return (
    <>
      {onRefresh ? (
        <PullToRefresh onRefresh={onRefresh}>{children}</PullToRefresh>
      ) : (
        children
      )}

      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
      />
    </>
  );
}
