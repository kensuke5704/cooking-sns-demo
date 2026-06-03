"use client";

import { useState } from "react";
import SectionCard from "../components/common/SectionCard";
import ScreenShell from "../components/common/ScreenShell";
import { getTodayRecipe } from "../lib/todayRecipe";

export default function RecipeScreen() {
  const recipe = getTodayRecipe();
  const [showDetail, setShowDetail] = useState(false);

  return (
    <ScreenShell
      label="ARTICLE"
      title="記事"
      subtitle="献立カードから、材料と作り方を確認できます。"
    >
      {!showDetail ? (
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="w-full overflow-hidden rounded-[36px] bg-white text-left shadow-xl transition active:scale-[0.99]"
        >
          <div className="bg-[#f39a00] px-5 py-2">
            <p className="text-xs font-black tracking-wide text-white">
              TODAY'S MENU
            </p>
          </div>

          <div className="p-6">
            <p className="text-sm font-black text-[#f39a00]">今日の献立</p>

            <h1 className="mt-2 text-3xl font-black leading-tight text-[#6b2f13]">
              {recipe.title}
            </h1>

            <p className="mt-4 text-sm font-bold leading-relaxed text-[#6b2f13]/60">
              {recipe.description}
            </p>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#fff4d7] px-4 py-3">
              <span className="text-sm font-black text-[#6b2f13]">
                材料・作り方を見る
              </span>
              <span className="text-lg font-black text-[#f39a00]">›</span>
            </div>
          </div>
        </button>
      ) : (
        <>
          <section className="overflow-hidden rounded-[36px] bg-white shadow-xl">
            <div className="bg-[#f39a00] px-5 py-2">
              <p className="text-xs font-black tracking-wide text-white">
                MENU DETAIL
              </p>
            </div>

            <div className="p-6">
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="mb-5 rounded-full bg-[#fff4d7] px-4 py-2 text-sm font-black text-[#6b2f13]"
              >
                ← 献立カードに戻る
              </button>

              <p className="text-sm font-black text-[#f39a00]">今日の献立</p>

              <h1 className="mt-2 text-3xl font-black leading-tight text-[#6b2f13]">
                {recipe.title}
              </h1>

              <p className="mt-4 text-sm font-bold leading-relaxed text-[#6b2f13]/60">
                {recipe.description}
              </p>
            </div>
          </section>

          <SectionCard className="mt-5" title="材料">
            <div className="space-y-3">
              {recipe.ingredients.map(([name, amount]) => (
                <RecipeItem key={name} name={name} amount={amount} />
              ))}
            </div>
          </SectionCard>

          <SectionCard className="mt-5" title="作り方">
            <div className="space-y-4">
              {recipe.steps.map((text, index) => (
                <Step key={index} number={String(index + 1)} text={text} />
              ))}
            </div>
          </SectionCard>

          <SectionCard className="mt-5" title="ポイント">
            <p className="rounded-2xl bg-[#fff4d7] px-4 py-3 text-sm font-bold leading-relaxed text-[#6b2f13]">
              {recipe.point}
            </p>
          </SectionCard>
        </>
      )}
    </ScreenShell>
  );
}

function RecipeItem({
  name,
  amount,
}: {
  name: string;
  amount: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#fff4d7] px-4 py-3">
      <span className="font-black text-[#6b2f13]">{name}</span>
      <span className="text-sm font-bold text-[#6b2f13]/60">{amount}</span>
    </div>
  );
}

function Step({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f39a00] text-sm font-black text-white">
        {number}
      </div>

      <p className="pt-1 text-sm font-bold leading-relaxed text-[#6b2f13]">
        {text}
      </p>
    </div>
  );
}
