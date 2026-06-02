"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarDetail from "../components/calendar/CalendarDetail";
import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarPopup from "../components/calendar/CalendarPopup";
import PairCodeSection from "../components/calendar/PairCodeSection";
import { getCurrentUser } from "../lib/auth";
import {
  getMonthDays,
  getPairStreak,
  hasBothPostedOnDate,
} from "../lib/calendar";
import { loadPostsData } from "../lib/posts";
import { supabase } from "../lib/supabase";
import type {
  CalendarPopupState,
  CodeEntry,
  PairConnection,
  PairPartner,
  PairState,
  Profile,
} from "../types/calendar";
import type { Post } from "../types/post";

const EMPTY_PAIR_STATE: PairState = {
  status: "loading",
  code: "",
  partner: null,
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pairPosts, setPairPosts] = useState<Post[]>([]);
  const [selectedPairCode, setSelectedPairCode] = useState<string | null>(null);
  const [pairPartners, setPairPartners] = useState<PairPartner[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [pairState, setPairState] = useState<PairState>(EMPTY_PAIR_STATE);
  const [codeInput, setCodeInput] = useState("");
  const [isPairCalendarOpen, setIsPairCalendarOpen] = useState(false);
  const [popup, setPopup] = useState<CalendarPopupState>(null);

  const currentUser = getCurrentUser();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const days = getMonthDays(year, month);
  const activePosts = isPairCalendarOpen ? pairPosts : posts;

  const streakCount = useMemo(() => {
    if (!currentUser || !pairState.partner) return 0;
    return getPairStreak(pairPosts, currentUser.userId, pairState.partner.user_id);
  }, [currentUser, pairPosts, pairState.partner]);

  useEffect(() => {
    loadCalendarPosts();
    loadPairStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showPopup(title: string, message: string) {
    setPopup({ title, message });
  }

  function showConfirmPopup(popupState: NonNullable<CalendarPopupState>) {
    setPopup(popupState);
  }

  function goPrevMonth() {
    setSelectedDate(null);
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setSelectedDate(null);
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  async function loadCalendarPosts() {
    if (!currentUser) return;

    try {
      const loadedPosts = await loadPostsData(currentUser.userId);
      setPosts(loadedPosts.filter((post) => post.userId === currentUser.userId));
    } catch (error) {
      console.error("カレンダー投稿取得エラー:", error);
      showPopup("取得エラー", "カレンダーの投稿取得に失敗しました");
    }
  }

  async function fetchPairPartners() {
    if (!currentUser) return [] as PairPartner[];

    const { data: pairs, error: pairsError } = await supabase
      .from("pair_connections")
      .select("code, user1_id, user2_id, created_at")
      .or(`user1_id.eq.${currentUser.userId},user2_id.eq.${currentUser.userId}`)
      .order("created_at", { ascending: false });

    if (pairsError) {
      console.error("ペア取得エラー:", pairsError);
      showPopup("取得エラー", "2人カレンダーの取得に失敗しました");
      return [] as PairPartner[];
    }

    const pairList = (pairs ?? []) as PairConnection[];
    if (pairList.length === 0) return [] as PairPartner[];

    const partnerUserIds = pairList.map((pair) =>
      pair.user1_id === currentUser.userId ? pair.user2_id : pair.user1_id
    );

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, icon_url")
      .in("user_id", partnerUserIds);

    if (profilesError) {
      console.error("相手プロフィール取得エラー:", profilesError);
      showPopup("取得エラー", "ペア相手のプロフィール取得に失敗しました");
      return [] as PairPartner[];
    }

    return pairList
      .map((pair) => buildPairPartner(pair, currentUser.userId, profiles ?? []))
      .filter((item): item is PairPartner => item !== null);
  }

  async function loadPairStatus() {
    if (!currentUser) return;

    setPairState(EMPTY_PAIR_STATE);
    setPairPartners([]);

    const { data: myEntriesData, error: entriesError } = await supabase
      .from("calendar_code_entries")
      .select("code, created_at")
      .eq("user_id", currentUser.userId)
      .order("created_at", { ascending: false });

    if (entriesError) {
      console.error("コード入力状況取得エラー:", entriesError);
      setPairState({ status: "none", code: "", partner: null });
      showPopup("取得エラー", "コード入力状況の取得に失敗しました");
      return;
    }

    const myEntries = (myEntriesData ?? []) as CodeEntry[];

    for (const entry of myEntries) {
      await createPairConnectionIfReady(entry.code);
    }

    const partners = await fetchPairPartners();
    setPairPartners(partners);

    const pairedCodes = new Set(partners.map((pair) => pair.code));
    const pendingEntry = myEntries.find((entry) => !pairedCodes.has(entry.code));

    if (pendingEntry) {
      setPairState({ status: "pending", code: pendingEntry.code, partner: null });
      setPairPosts([]);
      setIsPairCalendarOpen(false);
      return;
    }

    if (partners.length > 0) {
      const selectedPair =
        partners.find((pair) => pair.code === selectedPairCode) ?? partners[0];

      setPairState({
        status: "paired",
        code: selectedPair.code,
        partner: selectedPair.partner,
      });

      await loadPairPosts(selectedPair.partner.user_id);
      return;
    }

    setPairState({ status: "none", code: "", partner: null });
    setPairPosts([]);
  }

  function deletePair(code: string) {
    showConfirmPopup({
      title: "ペアを解除しますか？",
      message: "解除しても投稿は削除されません。",
      confirmLabel: "解除する",
      cancelLabel: "戻る",
      danger: true,
      onConfirm: () => deletePairAfterConfirm(code),
    });
  }

  async function deletePairAfterConfirm(code: string) {
    const { error: pairError } = await supabase
      .from("pair_connections")
      .delete()
      .eq("code", code);

    if (pairError) {
      console.error("ペア解除エラー:", pairError);
      showPopup("解除エラー", "ペア解除に失敗しました");
      return;
    }

    const { error: entryError } = await supabase
      .from("calendar_code_entries")
      .delete()
      .eq("code", code);

    if (entryError) {
      console.error("コード入力履歴削除エラー:", entryError);
      showPopup("削除エラー", "コード履歴の削除に失敗しました");
      return;
    }

    resetPairCalendarView();
    await loadPairStatus();
    showPopup("解除しました", "2人カレンダーのペアを解除しました");
  }

  function cancelPendingCode() {
    if (!currentUser || pairState.status !== "pending") return;

    showConfirmPopup({
      title: "コードをキャンセルしますか？",
      message: "キャンセルすると、新しいコードを入力できるようになります。",
      confirmLabel: "キャンセルする",
      cancelLabel: "戻る",
      danger: true,
      onConfirm: cancelPendingCodeAfterConfirm,
    });
  }

  async function cancelPendingCodeAfterConfirm() {
    if (!currentUser || pairState.status !== "pending") return;

    const { error } = await supabase
      .from("calendar_code_entries")
      .delete()
      .eq("code", pairState.code)
      .eq("user_id", currentUser.userId);

    if (error) {
      console.error("コードキャンセルエラー:", error);
      showPopup("キャンセルエラー", "コードのキャンセルに失敗しました");
      return;
    }

    setCodeInput("");
    resetPairCalendarView();
    await loadPairStatus();
    showPopup("キャンセルしました", "入力済みコードをキャンセルしました");
  }

  async function submitPairCode() {
    if (!currentUser) return;

    const normalizedCode = codeInput.trim();

    if (!normalizedCode) {
      showPopup("入力エラー", "コードを入力してください");
      return;
    }

    const isValid = await validatePairCode(normalizedCode);
    if (!isValid) return;

    const { error: insertError } = await supabase
      .from("calendar_code_entries")
      .insert({
        code: normalizedCode,
        user_id: currentUser.userId,
      });

    if (insertError) {
      console.error("コード登録エラー:", insertError);
      showPopup("登録エラー", "コード登録に失敗しました");
      return;
    }

    await createPairConnectionIfReady(normalizedCode);
    setCodeInput("");
    await loadPairStatus();
    showPopup("登録しました", "相手も同じコードを入力すると、2人カレンダーが作成されます");
  }

  async function validatePairCode(normalizedCode: string) {
    if (!currentUser) return false;

    const { data: validCode, error: codeError } = await supabase
      .from("calendar_codes")
      .select("code")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .maybeSingle();

    if (codeError) {
      console.error("コード確認エラー:", codeError);
      showPopup("確認エラー", "コードの確認に失敗しました");
      return false;
    }

    if (!validCode) {
      showPopup("使用できません", "このコードは使用できません");
      return false;
    }

    const { data: existingEntry, error: existingEntryError } = await supabase
      .from("calendar_code_entries")
      .select("code")
      .eq("code", normalizedCode)
      .eq("user_id", currentUser.userId)
      .maybeSingle();

    if (existingEntryError) {
      console.error("コード入力済み確認エラー:", existingEntryError);
      showPopup("確認エラー", "コードの確認に失敗しました");
      return false;
    }

    if (existingEntry) {
      showPopup("入力済みです", "このコードはすでに入力済みです");
      return false;
    }

    const { count, error: countError } = await supabase
      .from("calendar_code_entries")
      .select("*", { count: "exact", head: true })
      .eq("code", normalizedCode);

    if (countError) {
      console.error("コード使用人数確認エラー:", countError);
      showPopup("確認エラー", "コードの確認に失敗しました");
      return false;
    }

    if ((count ?? 0) >= 2) {
      showPopup("使用済みです", "このコードはすでに2人が使用しています");
      return false;
    }

    return true;
  }

  async function createPairConnectionIfReady(code: string) {
    const { data: entries, error: entriesError } = await supabase
      .from("calendar_code_entries")
      .select("user_id, created_at")
      .eq("code", code)
      .order("created_at", { ascending: true });

    if (entriesError) {
      console.error("ペア成立確認エラー:", entriesError);
      return;
    }

    if (!entries || entries.length !== 2 || entries[0].user_id === entries[1].user_id) {
      return;
    }

    const { error: pairError } = await supabase
      .from("pair_connections")
      .insert({
        code,
        user1_id: entries[0].user_id,
        user2_id: entries[1].user_id,
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
      setPairPosts([]);
      showPopup("取得エラー", "2人カレンダーの投稿取得に失敗しました");
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, icon_url")
      .in("user_id", userIds);

    if (profilesError) {
      console.error("ペアプロフィール取得エラー:", profilesError);
      setPairPosts([]);
      showPopup("取得エラー", "プロフィール取得に失敗しました");
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
          userName: profile?.name || post.user_name || "ユーザー",
          userIcon: profile?.icon_url || post.user_icon || "/images/user1-icon.jpg",
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

  async function openPairCalendar(pair: PairPartner) {
    setSelectedPairCode(pair.code);
    setPairState({
      status: "paired",
      code: pair.code,
      partner: pair.partner,
    });
    setSelectedDate(null);
    await loadPairPosts(pair.partner.user_id);
    setIsPairCalendarOpen(true);
  }

  function resetPairCalendarView() {
    setIsPairCalendarOpen(false);
    setSelectedPairCode(null);
    setSelectedDate(null);
    setPairPosts([]);
  }

  function getDateKey(day: number) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  function getPostsByDate(dateKey: string) {
    return activePosts.filter((post) => post.postDate === dateKey);
  }

  function hasPairStar(day: number) {
    if (!isPairCalendarOpen || !currentUser || !pairState.partner) return false;

    return hasBothPostedOnDate(
      pairPosts,
      getDateKey(day),
      currentUser.userId,
      pairState.partner.user_id
    );
  }

  return (
    <main className="min-h-screen bg-[#f8b72a] px-5 pt-6 pb-28 text-[#6b2f13]">
      <div className="mx-auto max-w-md">
        {isPairCalendarOpen && pairState.partner && (
          <button
            type="button"
            onClick={resetPairCalendarView}
            className="mb-4 rounded-full bg-white px-5 py-3 text-sm font-black shadow"
          >
            ← 元のカレンダーに戻る
          </button>
        )}

        <CalendarHeader
          year={year}
          month={month}
          isPairCalendarOpen={isPairCalendarOpen}
          pairState={pairState}
          streakCount={streakCount}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
        />

        <CalendarGrid
          days={days}
          getDateKey={getDateKey}
          getPostsByDate={getPostsByDate}
          hasPairStar={hasPairStar}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {selectedDate && (
          <CalendarDetail dateKey={selectedDate} posts={getPostsByDate(selectedDate)} />
        )}

        {!isPairCalendarOpen && (
          <PairCodeSection
            pairState={pairState}
            pairPartners={pairPartners}
            codeInput={codeInput}
            onCodeInputChange={setCodeInput}
            onSubmitCode={submitPairCode}
            onOpenPairCalendar={openPairCalendar}
            onDeletePair={deletePair}
            onCancelPendingCode={cancelPendingCode}
          />
        )}
      </div>

      <CalendarPopup popup={popup} onClose={() => setPopup(null)} />
    </main>
  );
}

function buildPairPartner(
  pair: PairConnection,
  currentUserId: string,
  profiles: Profile[]
): PairPartner | null {
  const partnerUserId = pair.user1_id === currentUserId ? pair.user2_id : pair.user1_id;
  const partnerProfile = profiles.find((profile) => profile.user_id === partnerUserId);

  if (!partnerProfile) return null;

  return {
    code: pair.code,
    partner: partnerProfile,
  };
}
