type PairPost = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_icon: string | null;
  prep_photo: string | null;
  cooking_photo: string | null;
  finished_photo: string | null;
  dish_name: string | null;
  memo: string | null;
  created_at: string;
  post_date: string;
};

type Props = {
  currentUser: any;
  partner: any;
  pairPosts: PairPost[];
  streakCount: number;
  onBack: () => void;
};

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#f8b72a]">
      <path d="M12 2l3.09 6.26 6.91 1-5 4.87 1.18 6.87L12 17.77 5.82 21 7 14.13 2 9.26l6.91-1L12 2z" />
    </svg>
  );
}

function getMonthDays() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const lastDate = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: lastDate }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month, day);
    const dateKey = date.toISOString().slice(0, 10);

    return {
      day,
      dateKey,
    };
  });
}

export default function PairCalendarScreen({
  currentUser,
  partner,
  pairPosts,
  streakCount,
  onBack,
}: Props) {
  const monthDays = getMonthDays();

  const myPostedDates = new Set(
    pairPosts
      .filter((post) => post.user_id === currentUser.userId)
      .map((post) => post.post_date)
  );

  const partnerPostedDates = new Set(
    pairPosts
      .filter((post) => post.user_id === partner.user_id)
      .map((post) => post.post_date)
  );

  return (
    <main className="min-h-screen bg-[#f8b72a] p-5 text-[#6b2f13]">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 rounded-full bg-white px-4 py-2 font-black shadow"
      >
        ← 戻る
      </button>

      <h1 className="mb-2 text-xl font-black">ふたりのカレンダー</h1>

      <div className="mb-6 flex items-center gap-4">
        <img
          src={currentUser.iconUrl ?? "/images/default-icon.png"}
          alt={currentUser.name ?? "自分"}
          className="h-16 w-16 rounded-full object-cover"
        />

        <span className="text-2xl">❤️</span>

        <img
          src={partner?.icon_url ?? "/images/default-icon.png"}
          alt={partner?.name ?? "相手"}
          className="h-16 w-16 rounded-full object-cover"
        />
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <p className="mb-4 font-black">今月の達成カレンダー</p>

        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((date) => {
            const bothPosted =
              myPostedDates.has(date.dateKey) &&
              partnerPostedDates.has(date.dateKey);

            return (
              <div
                key={date.dateKey}
                className="flex h-10 flex-col items-center justify-center rounded-xl bg-[#fff4d7] text-xs font-black"
              >
                <span>{date.day}</span>
                {bothPosted && <StarIcon />}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs font-bold text-[#9b6b2f]">
          ⭐は2人とも投稿した日です
        </p>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-5 shadow">
        <p className="font-black">現在 {streakCount}日連続</p>

        <div className="mt-3 space-y-2 text-sm font-bold text-[#9b6b2f]">
          <p>🎁 50日連続：限定バッジ</p>
          <p>🎁 100日連続：限定フレーム</p>
        </div>
      </div>
    </main>
  );
}