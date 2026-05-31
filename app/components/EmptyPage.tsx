export default function EmptyPage({ title }: { title: string }) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-white/40 border-2 border-dashed border-white/70 rounded-[32px] p-8 text-center">
          <h1 className="text-3xl font-black text-[#6b2f13]">{title}</h1>
          <p className="mt-3 text-sm font-bold text-[#6b2f13]/70">
            まだコンテンツはありません
          </p>
        </div>
      </div>
    );
  }