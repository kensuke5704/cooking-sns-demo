export default function RecipePage() {
    return (
      <div className="px-5 pt-6">
        <div className="bg-[#6b2f13] text-white rounded-[32px] p-6 shadow-md">
          <p className="text-sm opacity-90">今日の献立</p>
          <h1 className="text-3xl font-black mt-1">アスパラベーコン</h1>
        </div>
  
        <section className="mt-6 bg-white/50 rounded-[32px] p-5">
          <h2 className="text-xl font-black text-[#6b2f13]">材料</h2>
          <ul className="mt-4 space-y-2 text-[#6b2f13] font-bold">
            <li>・アスパラガス：4本</li>
            <li>・ベーコン：4枚</li>
            <li>・塩こしょう：少々</li>
            <li>・油：小さじ1</li>
          </ul>
        </section>
  
        <section className="mt-5 bg-white/50 rounded-[32px] p-5">
          <h2 className="text-xl font-black text-[#6b2f13]">作り方</h2>
          <ol className="mt-4 space-y-3 text-[#6b2f13] font-bold">
            <li>1. アスパラの根元を切り、食べやすい長さに切る。</li>
            <li>2. ベーコンでアスパラを巻く。</li>
            <li>3. フライパンに油をひき、中火で焼く。</li>
            <li>4. 焼き色がついたら塩こしょうで味を整える。</li>
          </ol>
        </section>
      </div>
    );
  }