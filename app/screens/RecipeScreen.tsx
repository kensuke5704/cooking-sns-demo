"use client";

import { useState } from "react";
import SectionCard from "../components/common/SectionCard";
import ScreenShell from "../components/common/ScreenShell";
import { getTodayRecipe } from "../lib/todayRecipe";

export default function RecipeScreen() {
  const recipe = getTodayRecipe();
  const [showDetail, setShowDetail] = useState(false);

  return (
    <ScreenShell>
      <div className="mb-7">
        <h1 className="text-[36px] font-black leading-none text-[#3f2116]">
          記事
        </h1>
      </div>
      {!showDetail ? (
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="w-full overflow-hidden rounded-[30px] bg-[#fffaf2]/94 text-left shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65 transition active:scale-[0.99]"
        >
          <div className="bg-[#0f6a47] px-5 py-2.5">
            <p className="text-[11px] font-black text-white">
              TODAY'S MENU
            </p>
          </div>

          <div className="p-6">
            <p className="text-sm font-black text-[#0f6a47]">今日の献立</p>

            <h1 className="mt-2 text-[30px] font-black leading-tight text-[#3f2116]">
              {recipe.title}
            </h1>

            <p className="mt-4 text-sm font-bold leading-relaxed text-[#3f2116]/62">
              {recipe.description}
            </p>

            <div className="mt-5 flex items-center justify-between rounded-[20px] border border-[#dfc79d]/65 bg-[#fff8e6]/80 px-4 py-3">
              <span className="text-sm font-black text-[#3f2116]">
見る
              </span>
              <span className="text-lg font-black text-[#0f6a47]">›</span>
            </div>
          </div>
        </button>
      ) : (
        <>
          <section className="overflow-hidden rounded-[30px] bg-[#fffaf2]/94 shadow-[0_18px_44px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
            <div className="bg-[#0f6a47] px-5 py-2.5">
              <p className="text-[11px] font-black text-white">
                MENU DETAIL
              </p>
            </div>

            <div className="p-6">
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="mb-5 rounded-full border border-[#dfc79d]/65 bg-[#fff8e6]/80 px-4 py-2 text-sm font-black text-[#3f2116]"
              >
← 戻る
              </button>

              <p className="text-sm font-black text-[#0f6a47]">今日の献立</p>

              <h1 className="mt-2 text-[30px] font-black leading-tight text-[#3f2116]">
                {recipe.title}
              </h1>

              <p className="mt-4 text-sm font-bold leading-relaxed text-[#3f2116]/62">
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
            <p className="rounded-[20px] border border-[#dfc79d]/65 bg-[#fff8e6]/80 px-4 py-3 text-sm font-bold leading-relaxed text-[#3f2116]">
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
    <div className="flex items-center justify-between rounded-[20px] border border-[#f1d59a]/65 bg-[#fff4d7]/80 px-4 py-3">
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
