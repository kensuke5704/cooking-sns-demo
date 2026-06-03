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
    <section className="mt-5 rounded-[28px] border border-white/75 bg-white/95 p-5 shadow-[0_16px_44px_rgba(107,47,19,0.13)]">
      <p className="text-xs font-black text-[#f39a00]">GIFT CONNECTION</p>
      <h2 className="mt-1 text-2xl font-black">2人カレンダー</h2>

      {pairState.status === "loading" && (
        <p className="mt-4 rounded-[20px] border border-[#f1d59a]/65 bg-[#fff4d7]/75 px-4 py-4 text-sm font-bold text-[#6b2f13]/70">
          確認中です
        </p>
      )}

      {pairPartners.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-bold text-[#6b2f13]/70">
            ペア一覧です。プロフィール画像またはボタンを押すと、相手ごとの2人カレンダーを開けます。
          </p>

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
        <div className="mt-5">
          <EmptyState
            title="まだペアはありません"
            message="同じコードを2人で入力すると、2人だけの連続投稿カレンダーを作れます。"
          />
        </div>
      )}

      {hasPendingCode && (
        <div className="mt-4 rounded-[20px] border border-[#f1d59a]/65 bg-[#fff4d7]/75 px-4 py-4">
          <p className="text-sm font-black">入力済みコード：{pairState.code}</p>
          <p className="mt-2 text-sm font-bold text-[#6b2f13]/70">
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
        <div className="mt-5 space-y-3">
          <p className="text-sm font-bold text-[#6b2f13]/70">
            新しい2人カレンダーを追加する場合は、有効なコードを入力してください。
          </p>
          <input
            value={codeInput}
            onChange={(e) => onCodeInputChange(e.target.value)}
            placeholder="コードを入力"
            className="w-full rounded-[20px] border border-[#f1d59a]/65 bg-[#fff4d7]/75 px-4 py-4 text-sm font-black outline-none"
          />
          <button
            type="button"
            onClick={onSubmitCode}
            className="w-full rounded-full bg-[#f39a00] py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(107,47,19,0.12)]"
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
    <div className="flex w-full items-center gap-4 rounded-[24px] border border-[#f1d59a]/65 bg-[#fff4d7]/75 p-4">
      <button
        type="button"
        onClick={() => onOpenPairCalendar(pair)}
        className="shrink-0"
        aria-label={`${pair.partner.name || "ペア相手"}のカレンダーを見る`}
      >
        <img
          src={pair.partner.icon_url || "/images/default-icon.png"}
          alt={pair.partner.name ?? "ペア相手"}
          className="h-14 w-14 rounded-full object-cover"
        />
      </button>

      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs font-black text-[#f39a00]">{pair.code}</p>
        <p className="truncate font-black text-[#6b2f13]">
          {pair.partner.name || pair.partner.user_id}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpenPairCalendar(pair)}
            className="rounded-full bg-[#f39a00] px-3 py-1 text-xs font-black text-white"
          >
            カレンダーを見る
          </button>

          <button
            type="button"
            onClick={() => onDeletePair(pair.code)}
            className="rounded-full bg-white px-3 py-1 text-xs font-black text-red-500"
          >
            ペア解除
          </button>
        </div>
      </div>
    </div>
  );
}
