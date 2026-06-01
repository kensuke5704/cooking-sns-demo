"use client";

import { getTodayRecipe } from "../lib/todayRecipe";

export default function RecipeScreen() {
  const recipe = getTodayRecipe();

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
              {recipe.title}
            </h1>

            <p className="mt-4 text-sm font-bold text-[#6b2f13]/60">
              {recipe.description}
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black">材料</h2>

          <div className="mt-4 space-y-3">
            {recipe.ingredients.map(([name, amount]) => (
              <RecipeItem
                key={name}
                name={name}
                amount={amount}
              />
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black">作り方</h2>

          <div className="mt-4 space-y-4">
            {recipe.steps.map((text, index) => (
              <Step
                key={index}
                number={String(index + 1)}
                text={text}
              />
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black">ポイント</h2>

          <p className="mt-3 rounded-2xl bg-[#fff4d7] px-4 py-3 text-sm font-bold">
            {recipe.point}
          </p>
        </section>
      </div>
    </main>
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
      <span className="font-black">{name}</span>
      <span className="text-sm font-bold text-[#6b2f13]/60">
        {amount}
      </span>
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

      <p className="pt-1 text-sm font-bold leading-relaxed">
        {text}
      </p>
    </div>
  );
}