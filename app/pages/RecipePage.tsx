"use client";

export default function RecipePage() {
  return (
    <main className="min-h-screen bg-[#f8b72a] px-5 pt-6 pb-28 text-[#6b2f13]">
      <div className="mx-auto max-w-md">
        <section className="overflow-hidden rounded-[36px] bg-white shadow-xl">
          <div className="bg-[#f39a00] px-5 py-2">
            <p className="text-xs font-black text-white">TODAY'S RECIPE</p>
          </div>

          <div className="p-6 text-center">
            <p className="text-sm font-black text-[#f39a00]">今日の献立</p>

            <h1 className="mt-2 text-3xl font-black leading-tight">
              アスパラベーコン
            </h1>

            <p className="mt-4 text-sm font-bold text-[#6b2f13]/60">
              ベーコンの旨味とアスパラの食感を楽しめる、短時間で作れる定番おかず。
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black">材料</h2>

          <div className="mt-4 space-y-3">
            <RecipeItem name="アスパラ" amount="4〜6本" />
            <RecipeItem name="ベーコン" amount="4枚" />
            <RecipeItem name="塩こしょう" amount="少々" />
            <RecipeItem name="油" amount="少量" />
          </div>
        </section>

        <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black">作り方</h2>

          <div className="mt-4 space-y-4">
            <Step number="1" text="アスパラの根元を切り、硬い部分の皮をむく。" />
            <Step number="2" text="アスパラにベーコンを巻く。" />
            <Step number="3" text="フライパンに油をひき、中火で焼く。" />
            <Step number="4" text="焼き色がついたら塩こしょうで味を整える。" />
          </div>
        </section>

        <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black">ポイント</h2>

          <p className="mt-3 rounded-2xl bg-[#fff4d7] px-4 py-3 text-sm font-bold">
            ベーコンの巻き終わりを下にして焼くと、崩れにくくきれいに仕上がります。
          </p>
        </section>
      </div>
    </main>
  );
}

function RecipeItem({ name, amount }: { name: string; amount: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#fff4d7] px-4 py-3">
      <span className="font-black">{name}</span>
      <span className="text-sm font-bold text-[#6b2f13]/60">{amount}</span>
    </div>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f39a00] text-sm font-black text-white">
        {number}
      </div>

      <p className="pt-1 text-sm font-bold leading-relaxed">{text}</p>
    </div>
  );
}