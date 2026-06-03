import { useState } from "react";
import { supabase } from "../../lib/supabase";
import type {
  CalendarPopupState,
  CodeEntry,
  PairConnection,
  PairPartner,
  PairState,
  Profile,
} from "../../types/calendar";

const EMPTY_PAIR_STATE: PairState = {
  status: "loading",
  code: "",
  partner: null,
};

type CurrentUser = {
  userId: string;
} | null;

type UsePairCalendarParams = {
  currentUser: CurrentUser;
  loadPairPosts: (partnerUserId: string) => Promise<void>;
  clearPairPosts: () => void;
  showPopup: (title: string, message?: string) => void;
  showConfirmPopup: (popupState: NonNullable<CalendarPopupState>) => void;
  clearSelectedDate: () => void;
};

export function usePairCalendar({
  currentUser,
  loadPairPosts,
  clearPairPosts,
  showPopup,
  showConfirmPopup,
  clearSelectedDate,
}: UsePairCalendarParams) {
  const [pairState, setPairState] = useState<PairState>(EMPTY_PAIR_STATE);
  const [pairPartners, setPairPartners] = useState<PairPartner[]>([]);
  const [selectedPairCode, setSelectedPairCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [isPairCalendarOpen, setIsPairCalendarOpen] = useState(false);

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
      clearPairPosts();
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
    clearPairPosts();
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
    showPopup("キャンセルしました");
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
    showPopup("登録しました", "待機中");
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
      showPopup("使用できません");
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
      showPopup("入力済みです");
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
      showPopup("使用済みです");
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

  async function openPairCalendar(pair: PairPartner) {
    setSelectedPairCode(pair.code);
    setPairState({
      status: "paired",
      code: pair.code,
      partner: pair.partner,
    });
    clearSelectedDate();
    await loadPairPosts(pair.partner.user_id);
    setIsPairCalendarOpen(true);
  }

  function resetPairCalendarView() {
    setIsPairCalendarOpen(false);
    setSelectedPairCode(null);
    clearSelectedDate();
    clearPairPosts();
  }

  return {
    pairState,
    pairPartners,
    codeInput,
    isPairCalendarOpen,
    setCodeInput,
    loadPairStatus,
    submitPairCode,
    openPairCalendar,
    deletePair,
    cancelPendingCode,
    resetPairCalendarView,
  };
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
