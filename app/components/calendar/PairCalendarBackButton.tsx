type PairCalendarBackButtonProps = {
  onClick: () => void;
};

export default function PairCalendarBackButton({ onClick }: PairCalendarBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 rounded-full bg-white px-5 py-3 text-sm font-black shadow"
    >
      ← 元のカレンダーに戻る
    </button>
  );
}
