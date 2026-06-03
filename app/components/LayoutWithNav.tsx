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
  const content = (
    <>
      {children}

      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
      />
    </>
  );

  if (!onRefresh) return content;

  return <PullToRefresh onRefresh={onRefresh}>{content}</PullToRefresh>;
}
