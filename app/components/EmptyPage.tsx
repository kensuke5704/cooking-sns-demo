import ScreenShell from "./common/ScreenShell";
import SectionCard from "./common/SectionCard";

export default function EmptyPage({ title }: { title: string }) {
  return (
    <ScreenShell
      label="COMING SOON"
      title={title}
    >
      <SectionCard>
        <div className="rounded-2xl border-2 border-dashed border-[#f1d59a] bg-[#fff4d7] px-4 py-8 text-center">
          <p className="text-sm font-black text-[#6b2f13]">
            まだコンテンツはありません
          </p>
        </div>
      </SectionCard>
    </ScreenShell>
  );
}
