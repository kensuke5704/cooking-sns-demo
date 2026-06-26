import EmptyState from "../common/EmptyState";
import type { PairPartner, PairState } from "../../types/calendar";

type PairCodeSectionProps = {
  pairState: PairState;
  pairPartners: PairPartner[];
  codeInput: string;
  onCodeInputChange: (value: string) => void;
  onSubmitCode: () => void;
  onOpenPairCalendar: (pair: PairPartner) => void;
  onDeletePair: (code: string) => void;
  onCancelPendingCode: () => void;
};

export default function PairCodeSection({
  pairState,
  pairPartners,
  codeInput,
  onCodeInputChange,
  onSubmitCode,
  onOpenPairCalendar,
  onDeletePair,
  onCancelPendingCode,
}: PairCodeSectionProps) {
  const hasPendingCode = pairState.status === "pending";
  const canInputCode = pairState.status === "none" || pairState.status === "paired";

  return (
    <section className="mt-3 rounded-[8px] bg-[#fffaf2]/94 p-3 shadow-[0_10px_24px_rgba(63,33,22,0.13)] ring-1 ring-white/65">
      <h2 className="text-[15px] font-black text-[#3f2116]">今月のつながり</h2>

      {pairState.status === "loading" && (
        <p className="mt-3 rounded-[6px] border border-[#dfc79d]/65 bg-[#fff8e6]/75 px-3 py-2 text-[11px] font-bold text-[#3f2116]/70">
          確認中です
        </p>
      )}

      {pairPartners.length > 0 && (
        <div className="mt-3 space-y-2">
          {pairPartners.map((pair) => (
            <PairPartnerCard
              key={pair.code}
              pair={pair}
              onOpenPairCalendar={onOpenPairCalendar}
              onDeletePair={onDeletePair}
            />
          ))}
        </div>
      )}


      {pairState.status === "none" && pairPartners.length === 0 && (
        <div className="mt-3">
          <EmptyState
            title="まだペアはありません"
            message="同じコードを2人で入力すると、2人だけの連続投稿カレンダーを作れます。"
          />
        </div>
      )}

      {hasPendingCode && (
        <div className="mt-3 rounded-[6px] border border-[#dfc79d]/65 bg-[#fff8e6]/75 px-3 py-2">
          <p className="text-[11px] font-black">入力済みコード：{pairState.code}</p>
          <p className="mt-1 text-[10px] font-bold text-[#3f2116]/70">
            相手が入力すると2人カレンダーが作成されます。キャンセルすると、新しいコードを入力できます。
          </p>
          <button
            type="button"
            onClick={onCancelPendingCode}
            className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-black text-red-500 shadow-sm"
          >
            コード入力をキャンセル
          </button>
        </div>
      )}

      {canInputCode && (
        <div className="mt-3 space-y-2">
          <p className="text-[10px] font-bold text-[#3f2116]/70">
            新しい2人カレンダーを追加する場合は、有効なコードを入力してください。
          </p>
          <input
            value={codeInput}
            onChange={(e) => onCodeInputChange(e.target.value)}
            placeholder="コードを入力"
            className="w-full rounded-[6px] border border-[#dfc79d]/65 bg-[#fffaf2] px-3 py-2 text-[11px] font-black text-[#3f2116] outline-none"
          />
          <button
            type="button"
            onClick={onSubmitCode}
            className="w-full rounded-full bg-[#0f6a47] py-2 text-[11px] font-black text-[#fff8e6] shadow-[0_10px_24px_rgba(15,106,71,0.16)]"
          >
            コードを登録する
          </button>
        </div>
      )}
    </section>
  );
}

function PairPartnerCard({
  pair,
  onOpenPairCalendar,
  onDeletePair,
}: {
  pair: PairPartner;
  onOpenPairCalendar: (pair: PairPartner) => void;
  onDeletePair: (code: string) => void;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-[8px] border border-[#dfc79d]/65 bg-[#fff8e6]/75 p-3">
      <button
        type="button"
        onClick={() => onOpenPairCalendar(pair)}
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
        aria-label={`${pair.partner.name || "ペア相手"}のカレンダーを見る`}
      >
        <img
          src={pair.partner.icon_url || "/images/default-icon.png"}
          alt={pair.partner.name ?? "ペア相手"}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-[#0f6a47]">{pair.code}</p>
          <p className="truncate font-black text-[#3f2116]">
            {pair.partner.name || pair.partner.user_id}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onDeletePair(pair.code)}
        className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-black text-red-500"
      >
        解除
      </button>
    </div>
  );
}
