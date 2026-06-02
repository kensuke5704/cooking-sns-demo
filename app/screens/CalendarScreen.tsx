"use client";

import { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../lib/auth";
import { loadPostsData } from "../lib/posts";
import { supabase } from "../lib/supabase";
import type { Post } from "../types/post";

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  return [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
}

type Profile = {
  user_id: string;
  name: string | null;
  icon_url: string | null;
};

type PairStatus = "loading" | "none" | "pending" | "paired";

type PairState = {
  status: PairStatus;
  code: string;
  partner: Profile | null;
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pairPosts, setPairPosts] = useState<Post[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [pairState, setPairState] = useState<PairState>({
    status: "loading",
    code: "",
    partner: null,
  });
  const [codeInput, setCodeInput] = useState("");
  const [codeMessage, setCodeMessage] = useState("");
  const [isPairCalendarOpen, setIsPairCalendarOpen] = useState(false);
  const currentUser = getCurrentUser();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const days = getMonthDays(year, month);
  const activePosts = isPairCalendarOpen ? pairPosts : posts;
  const streakCount = useMemo(() => {
    if (!currentUser || !pairState.partner) return 0;
    return getPairStreak(pairPosts, currentUser.userId, pairState.partner.user_id);
  }, [currentUser, pairPosts, pairState.partner]);

  const goPrevMonth = () => {
    setSelectedDate(null);
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setSelectedDate(null);
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  useEffect(() => {
    loadCalendarPosts();
    loadPairStatus();
  }, []);

  useEffect(() => {
    if (pairState.status !== "paired" || !pairState.partner) return;

    loadPairPosts(pairState.partner.user_id);
  }, [pairState.status, pairState.partner?.user_id]);

  async function loadCalendarPosts() {
    if (!currentUser) return;

    try {
      const loadedPosts = await loadPostsData(currentUser.userId);
      const myPosts = loadedPosts.filter((post) => post.userId === currentUser.userId);
      setPosts(myPosts);
    } catch (error) {
      console.error("カレンダー投稿取得エラー:", error);
    }
  }

  async function loadPairStatus() {
    if (!currentUser) return;
  
    setPairState({ status: "loading", code: "", partner: null });
  
    const { data: pair, error: pairError } = await supabase
      .from("pair_connections")
      .select("*")
      .or(`user1_id.eq.${currentUser.userId},user2_id.eq.${currentUser.userId}`)
      .maybeSingle();
  
    if (pairError) {
      console.error("ペア取得エラー:", pairError);
      setPairState({ status: "none", code: "", partner: null });
      return;
    }
  
    if (pair) {
      const partnerUserId =
        pair.user1_id === currentUser.userId ? pair.user2_id : pair.user1_id;
  
      const { data: partnerProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, name, icon_url")
        .eq("user_id", partnerUserId)
        .maybeSingle();
  
      if (profileError) {
        console.error("相手プロフィール取得エラー:", profileError);
        setPairState({ status: "pending", code: pair.code, partner: null });
        return;
      }
  
      setPairState({
        status: "paired",
        code: pair.code,
        partner: partnerProfile,
      });

      await loadPairPosts(partnerUserId);
  
      return;
    }
  
    const { data: myEntry, error: entryError } = await supabase
      .from("calendar_code_entries")
      .select("code")
      .eq("user_id", currentUser.userId)
      .maybeSingle();
  
    if (entryError) {
      console.error("コード入力状況取得エラー:", entryError);
      setPairState({ status: "none", code: "", partner: null });
      return;
    }
  
    if (!myEntry) {
      setPairState({ status: "none", code: "", partner: null });
      return;
    }
  
    await createPairConnectionIfReady(myEntry.code);
  
    const { data: updatedPair } = await supabase
      .from("pair_connections")
      .select("*")
      .or(`user1_id.eq.${currentUser.userId},user2_id.eq.${currentUser.userId}`)
      .maybeSingle();
  
    if (!updatedPair) {
      setPairState({ status: "pending", code: myEntry.code, partner: null });
      return;
    }
  
    const partnerUserId =
      updatedPair.user1_id === currentUser.userId
        ? updatedPair.user2_id
        : updatedPair.user1_id;
  
    const { data: partnerProfile } = await supabase
      .from("profiles")
      .select("user_id, name, icon_url")
      .eq("user_id", partnerUserId)
      .maybeSingle();
  
    setPairState({
      status: "paired",
      code: updatedPair.code,
      partner: partnerProfile,
    });

    await loadPairPosts(partnerUserId);
  }

  async function submitPairCode() {
    if (!currentUser) return;

    const normalizedCode = codeInput.trim().toUpperCase();

    if (!normalizedCode) {
      setCodeMessage("コードを入力してください");
      return;
    }

    const { data: validCode, error: codeError } = await supabase
      .from("calendar_codes")
      .select("code")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .maybeSingle();

    if (codeError) {
      console.error("コード確認エラー:", codeError);
      setCodeMessage("コードの確認に失敗しました");
      return;
    }

    if (!validCode) {
      setCodeMessage("このコードは使用できません");
      return;
    }

    const { count, error: countError } = await supabase
      .from("calendar_code_entries")
      .select("*", { count: "exact", head: true })
      .eq("code", normalizedCode);

    if (countError) {
      console.error("コード使用人数確認エラー:", countError);
      setCodeMessage("コードの確認に失敗しました");
      return;
    }

    if ((count || 0) >= 2) {
      setCodeMessage("このコードはすでに2人が使用しています");
      return;
    }

    const { error: insertError } = await supabase
      .from("calendar_code_entries")
      .insert({
        code: normalizedCode,
        user_id: currentUser.userId,
      });

    if (insertError) {
      console.error("コード登録エラー:", insertError);
      setCodeMessage("すでに別のコードを入力済みです");
      return;
    }

    await createPairConnectionIfReady(normalizedCode);

    setCodeInput("");
    setCodeMessage("");
    await loadPairStatus();
  }

  async function createPairConnectionIfReady(code: string) {
    if (!currentUser) return;
  
    const { data: entries, error: entriesError } = await supabase
      .from("calendar_code_entries")
      .select("user_id, created_at")
      .eq("code", code)
      .order("created_at", { ascending: true });
  
    if (entriesError) {
      console.error("ペア成立確認エラー:", entriesError);
      return;
    }
  
    if (!entries || entries.length !== 2) {
      return;
    }
  
    const [firstUser, secondUser] = entries;
  
    if (!firstUser || !secondUser) {
      return;
    }
  
    const { error: pairError } = await supabase
      .from("pair_connections")
      .insert({
        code,
        user1_id: firstUser.user_id,
        user2_id: secondUser.user_id,
      });
  
    if (pairError && pairError.code !== "23505") {
      console.error("ペア保存エラー:", pairError);
    }
  }

  async function loadPairPosts(partnerUserId: string) {
    if (!currentUser) return;

    const userIds = [currentUser.userId, partnerUserId];

    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .in("user_id", userIds)
      .order("post_date", { ascending: false });

    if (postsError) {
      console.error("ペア投稿取得エラー:", postsError);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, icon_url")
      .in("user_id", userIds);

    if (profilesError) {
      console.error("ペアプロフィール取得エラー:", profilesError);
      return;
    }

    const profileMap = new Map(
      profilesData?.map((profile) => [profile.user_id, profile]) || []
    );

    const mappedPosts: Post[] =
      postsData?.map((post) => {
        const profile = profileMap.get(post.user_id);

        return {
          id: post.id,
          userId: post.user_id,
          userName: profile?.name || post.user_name,
          userIcon: profile?.icon_url || "/images/user1-icon.jpg",
          createdAt: post.created_at,
          postDate: post.post_date,
          prepPhoto: post.prep_photo,
          cookingPhoto: post.cooking_photo,
          finishedPhoto: post.finished_photo,
          dishName: post.dish_name,
          memo: post.memo,
        };
      }) || [];

    setPairPosts(mappedPosts);
  }

  const getDateKey = (day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const getPostsByDate = (dateKey: string) => {
    return activePosts.filter((post) => post.postDate === dateKey);
  };

  const hasPost = (day: number) => {
    return getPostsByDate(getDateKey(day)).length > 0;
  };

  const hasPairStar = (day: number) => {
    if (!isPairCalendarOpen || !currentUser || !pairState.partner) return false;

    const dateKey = getDateKey(day);
    return hasBothPostedOnDate(
      pairPosts,
      dateKey,
      currentUser.userId,
      pairState.partner.user_id
    );
  };

  return (
    <main className="min-h-screen bg-[#f8b72a] px-5 pt-6 pb-28 text-[#6b2f13]">
      <div className="mx-auto max-w-md">
        {isPairCalendarOpen && pairState.partner && (
          <button
            type="button"
            onClick={() => {
              setIsPairCalendarOpen(false);
              setSelectedDate(null);
            }}
            className="mb-4 rounded-full bg-white px-5 py-3 text-sm font-black shadow"
          >
            ← 元のカレンダーに戻る
          </button>
        )}

        <section className="rounded-[36px] bg-white p-6 shadow-xl">
          <p className="text-xs font-black text-[#f39a00]">
            {isPairCalendarOpen ? "PAIR CALENDAR" : "COOKING CALENDAR"}
          </p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrevMonth}
              className="rounded-full bg-[#fff4d7] px-4 py-2 text-sm font-black"
            >
              ←
            </button>

            <h1 className="text-3xl font-black">
              {year}年 {month + 1}月
            </h1>

            <button
              type="button"
              onClick={goNextMonth}
              className="rounded-full bg-[#fff4d7] px-4 py-2 text-sm font-black"
            >
              →
            </button>
          </div>

          <p className="mt-3 text-sm font-bold text-[#6b2f13]/60">
            {isPairCalendarOpen
              ? "2人とも投稿した日は星マークが付きます。"
              : "投稿した日は色付きで表示されます。"}
          </p>

          {isPairCalendarOpen && (
            <div className="mt-5 rounded-[28px] bg-[#fff4d7] p-4">
              <p className="text-sm font-black">現在 {streakCount}日連続</p>
              <p className="mt-1 text-xs font-bold text-[#6b2f13]/70">
                2人とも投稿している連続日数です。50日連続、100日連続などで特典がもらえます。
              </p>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[36px] bg-white p-4 shadow-xl">
          <div className="grid grid-cols-7 gap-2 text-center">
            {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
              <div key={d} className="py-2 text-xs font-black text-[#f39a00]">
                {d}
              </div>
            ))}

            {days.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} />;

              const dateKey = getDateKey(day);
              const dayPosts = getPostsByDate(dateKey);
              const posted = hasPost(day);
              const selected = selectedDate === dateKey;
              const pairStar = hasPairStar(day);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm font-black transition ${
                    posted
                      ? "bg-[#6b2f13] text-white"
                      : "bg-[#fff4d7] text-[#6b2f13]"
                  } ${selected ? "ring-4 ring-[#f39a00]/40" : ""}`}
                >
                  {pairStar && (
                    <span className="absolute -right-1 -top-1">
                      <StarIcon />
                    </span>
                  )}
                  <span>{day}</span>
                  {posted && (
                    <span className="mt-1 text-[9px]">
                      {dayPosts.length}件
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {selectedDate && (
          <CalendarDetail
            dateKey={selectedDate}
            posts={getPostsByDate(selectedDate)}
          />
        )}

        {!isPairCalendarOpen && (
          <PairCodeSection
            pairState={pairState}
            codeInput={codeInput}
            codeMessage={codeMessage}
            onCodeInputChange={setCodeInput}
            onSubmitCode={submitPairCode}
            onOpenPairCalendar={() => {
              setIsPairCalendarOpen(true);
              setSelectedDate(null);
            }}
          />
        )}
      </div>
    </main>
  );
}

function PairCodeSection({
  pairState,
  codeInput,
  codeMessage,
  onCodeInputChange,
  onSubmitCode,
  onOpenPairCalendar,
}: {
  pairState: PairState;
  codeInput: string;
  codeMessage: string;
  onCodeInputChange: (value: string) => void;
  onSubmitCode: () => void;
  onOpenPairCalendar: () => void;
}) {
  return (
    <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
      <p className="text-xs font-black text-[#f39a00]">GIFT CONNECTION</p>
      <h2 className="mt-1 text-2xl font-black">2人カレンダー</h2>

      {pairState.status === "loading" && (
        <p className="mt-4 rounded-2xl bg-[#fff4d7] px-4 py-4 text-sm font-bold text-[#6b2f13]/70">
          確認中です
        </p>
      )}

      {pairState.status === "none" && (
        <div className="mt-4 space-y-3">
          <input
            value={codeInput}
            onChange={(e) => onCodeInputChange(e.target.value.toUpperCase())}
            placeholder="コードを入力"
            className="w-full rounded-2xl bg-[#fff4d7] px-4 py-4 text-sm font-black outline-none"
          />
          <button
            type="button"
            onClick={onSubmitCode}
            className="w-full rounded-full bg-[#f39a00] py-3 text-sm font-black text-white shadow"
          >
            コードを登録する
          </button>
          {codeMessage && (
            <p className="text-sm font-bold text-red-600">{codeMessage}</p>
          )}
        </div>
      )}

      {pairState.status === "pending" && (
        <div className="mt-4 rounded-2xl bg-[#fff4d7] px-4 py-4">
          <p className="text-sm font-black">入力済みコード：{pairState.code}</p>
          <p className="mt-2 text-sm font-bold text-[#6b2f13]/70">
            相手が入力するまでお待ちください。入力済みの間は、新しいコードは入力できません。
          </p>
        </div>
      )}

      {pairState.status === "paired" && pairState.partner && (
        <div className="mt-5">
          <p className="text-sm font-bold text-[#6b2f13]/70">
            ペアになりました。プロフィール画像をタップすると、2人のカレンダーを開けます。
          </p>

          <button
            type="button"
            onClick={onOpenPairCalendar}
            className="mt-4 flex w-full items-center gap-4 rounded-[28px] bg-[#fff4d7] p-4 text-left"
          >
              <img
                src={pairState.partner.icon_url || "/images/default-icon.png"}
                alt={pairState.partner.name ?? "ペア相手"}
                className="h-14 w-14 rounded-full object-cover"
              />

              <div className="text-left">
                <p className="text-xs font-black text-[#9b6b2f]">ペア中</p>
                <p className="font-black text-[#6b2f13]">
                  {pairState.partner.name}
                </p>
                <p className="text-xs font-bold text-[#9b6b2f]">
                  ふたりのカレンダーを見る
                </p>
              </div>
          </button>
        </div>
      )}
    </section>
  );
}

function CalendarDetail({
  dateKey,
  posts,
}: {
  dateKey: string;
  posts: Post[];
}) {
  return (
    <section className="mt-5 rounded-[36px] bg-white p-5 shadow-xl">
      <p className="text-xs font-black text-[#f39a00]">SELECTED DAY</p>

      <h2 className="mt-1 text-2xl font-black">{dateKey}</h2>

      {posts.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-[#fff4d7] px-4 py-4 text-sm font-bold text-[#6b2f13]/70">
          この日の投稿はありません
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {posts.map((post) => (
            <CalendarPost key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

function CalendarPost({ post }: { post: Post }) {
  return (
    <div className="rounded-[28px] bg-[#fff4d7] p-4">
      <div className="flex items-center gap-3">
        <img
          src={post.userIcon || "/images/user1-icon.jpg"}
          alt={post.userName}
          className="h-10 w-10 rounded-full object-cover"
        />

        <div>
          <p className="text-sm font-black">{post.userName}</p>
          {post.dishName && (
            <p className="text-xs font-bold text-[#6b2f13]/70">
              {post.dishName}
            </p>
          )}
        </div>
      </div>

      {post.memo && (
        <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold">
          {post.memo}
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <CalendarPhoto label="準備" src={post.prepPhoto} />
        <CalendarPhoto label="調理" src={post.cookingPhoto} />
        <CalendarPhoto label="完成" src={post.finishedPhoto} />
      </div>
    </div>
  );
}

function CalendarPhoto({
    label,
    src,
  }: {
    label: string;
    src?: string | null;
  }) {
  if (!src) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border-2 border-dashed border-[#f1d59a] bg-white/60 text-sm font-black text-[#6b2f13]/40">
        {label}
      </div>
    );
  }

  return (
    <div className="bg-white p-2 pb-6 shadow-xl">
      <img src={src} alt={label} className="aspect-[3/4] w-full object-cover" />
      <p className="mt-1 text-center text-[11px] font-black text-[#6b2f13]">
        {label}
      </p>
    </div>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 drop-shadow"
      fill="#f39a00"
      aria-hidden="true"
    >
      <path d="M12 2.5 14.9 8.6l6.7.9-4.9 4.7 1.2 6.6L12 17.7 6.1 20.8l1.2-6.6-4.9-4.7 6.7-.9L12 2.5Z" />
    </svg>
  );
}

function hasBothPostedOnDate(
  posts: Post[],
  dateKey: string,
  myUserId: string,
  partnerUserId: string
) {
  const postedUserIds = new Set(
    posts
      .filter((post) => post.postDate === dateKey)
      .map((post) => post.userId)
  );

  return postedUserIds.has(myUserId) && postedUserIds.has(partnerUserId);
}

function getPairStreak(posts: Post[], myUserId: string, partnerUserId: string) {
  let streak = 0;
  const current = new Date();

  while (true) {
    const dateKey = current.toLocaleDateString("sv-SE", {
      timeZone: "Asia/Tokyo",
    });

    if (!hasBothPostedOnDate(posts, dateKey, myUserId, partnerUserId)) {
      break;
    }

    streak += 1;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}
