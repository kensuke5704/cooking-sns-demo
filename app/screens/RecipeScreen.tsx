"use client";

const recipes = [
  {
    title: "アスパラベーコン",
    description:
      "ベーコンの旨味とアスパラの食感を楽しめる、短時間で作れる定番おかず。",
    ingredients: [
      ["アスパラ", "4〜6本"],
      ["ベーコン", "4枚"],
      ["塩こしょう", "少々"],
      ["油", "少量"],
    ],
    steps: [
      "アスパラの根元を切り、硬い部分の皮をむく。",
      "アスパラにベーコンを巻く。",
      "フライパンに油をひき、中火で焼く。",
      "焼き色がついたら塩こしょうで味を整える。",
    ],
    point:
      "ベーコンの巻き終わりを下にして焼くと、崩れにくくきれいに仕上がります。",
  },
  {
    title: "鶏の照り焼き",
    description: "甘辛いタレでご飯が進む、定番のメインおかず。",
    ingredients: [
      ["鶏もも肉", "1枚"],
      ["しょうゆ", "大さじ2"],
      ["みりん", "大さじ2"],
      ["砂糖", "小さじ2"],
    ],
    steps: [
      "鶏肉の余分な脂を取り、食べやすい大きさに切る。",
      "フライパンで皮目から焼く。",
      "調味料を加えて煮からめる。",
      "照りが出たら完成。",
    ],
    point: "皮目をしっかり焼くと香ばしく仕上がります。",
  },
  {
    title: "豚キムチ",
    description: "炒めるだけで作れる、辛味とうま味のある時短メニュー。",
    ingredients: [
      ["豚こま肉", "150g"],
      ["キムチ", "100g"],
      ["もやし", "1/2袋"],
      ["ごま油", "小さじ1"],
    ],
    steps: [
      "フライパンにごま油を熱する。",
      "豚肉を炒める。",
      "もやしとキムチを加えて炒める。",
      "全体に火が通ったら完成。",
    ],
    point: "キムチは最後に入れると風味が残りやすいです。",
  },
  {
    title: "鮭のバター醤油焼き",
    description: "鮭にバター醤油をからめた、簡単で満足感のある一品。",
    ingredients: [
      ["鮭", "2切れ"],
      ["バター", "10g"],
      ["しょうゆ", "小さじ2"],
      ["薄力粉", "少々"],
    ],
    steps: [
      "鮭に薄力粉を薄くまぶす。",
      "フライパンで両面を焼く。",
      "バターとしょうゆを加える。",
      "全体にからめて完成。",
    ],
    point: "薄力粉をまぶすとタレがよく絡みます。",
  },
  {
    title: "オムライス",
    description: "ケチャップライスと卵で作る、食べやすい定番ごはん。",
    ingredients: [
      ["ご飯", "1杯分"],
      ["卵", "2個"],
      ["鶏肉", "50g"],
      ["ケチャップ", "大さじ2"],
    ],
    steps: [
      "鶏肉を炒める。",
      "ご飯とケチャップを加えて炒める。",
      "卵を焼く。",
      "ケチャップライスに卵をのせる。",
    ],
    point: "卵は半熟気味にすると見た目もよくなります。",
  },
  {
    title: "麻婆豆腐",
    description: "豆腐とひき肉で作る、ピリ辛のご飯向きおかず。",
    ingredients: [
      ["豆腐", "1丁"],
      ["豚ひき肉", "100g"],
      ["豆板醤", "小さじ1"],
      ["しょうゆ", "大さじ1"],
    ],
    steps: [
      "ひき肉を炒める。",
      "豆板醤を加えて香りを出す。",
      "豆腐と調味料を加える。",
      "軽く煮込んで完成。",
    ],
    point: "豆腐は崩れやすいので大きめに切ると扱いやすいです。",
  },
  {
    title: "ツナマヨ丼",
    description: "火を使わず作れる、忙しい日に向いた簡単丼。",
    ingredients: [
      ["ご飯", "1杯分"],
      ["ツナ缶", "1缶"],
      ["マヨネーズ", "大さじ1"],
      ["しょうゆ", "少々"],
    ],
    steps: [
      "ツナ缶の油を軽く切る。",
      "ツナ、マヨネーズ、しょうゆを混ぜる。",
      "ご飯にのせる。",
      "好みでのりをかける。",
    ],
    point: "少量のしょうゆを入れると味が締まります。",
  },
  {
    title: "肉じゃが",
    description: "じゃがいもと肉を甘辛く煮た、家庭的な和食メニュー。",
    ingredients: [
      ["じゃがいも", "2個"],
      ["豚肉", "100g"],
      ["玉ねぎ", "1/2個"],
      ["しょうゆ", "大さじ2"],
    ],
    steps: [
      "具材を食べやすい大きさに切る。",
      "肉と玉ねぎを炒める。",
      "じゃがいもと調味料を加える。",
      "やわらかくなるまで煮る。",
    ],
    point: "一度冷ますと味がよく染みます。",
  },
  {
    title: "焼きそば",
    description: "野菜と麺を炒めるだけで作れる、手軽な定番メニュー。",
    ingredients: [
      ["焼きそば麺", "1玉"],
      ["豚肉", "80g"],
      ["キャベツ", "2枚"],
      ["焼きそばソース", "1袋"],
    ],
    steps: [
      "豚肉とキャベツを炒める。",
      "麺を加えてほぐす。",
      "ソースを加えて炒める。",
      "全体がなじんだら完成。",
    ],
    point: "麺を少し蒸すとほぐれやすくなります。",
  },
  {
    title: "親子丼",
    description: "鶏肉と卵を甘辛く煮てご飯にのせる、やさしい味の丼。",
    ingredients: [
      ["ご飯", "1杯分"],
      ["鶏もも肉", "100g"],
      ["卵", "2個"],
      ["めんつゆ", "大さじ3"],
    ],
    steps: [
      "鶏肉を食べやすく切る。",
      "めんつゆで鶏肉を煮る。",
      "溶き卵を回し入れる。",
      "ご飯にのせて完成。",
    ],
    point: "卵は2回に分けて入れるとふんわりします。",
  },
];

export default function RecipePage() {
  const today = new Date();
  const dayCount = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const recipe = recipes[dayCount % recipes.length];

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
              <RecipeItem key={name} name={name} amount={amount} />
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black">作り方</h2>

          <div className="mt-4 space-y-4">
            {recipe.steps.map((text, index) => (
              <Step key={text} number={String(index + 1)} text={text} />
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