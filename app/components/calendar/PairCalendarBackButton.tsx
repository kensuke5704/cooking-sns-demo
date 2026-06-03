type PairCalendarBackButtonProps = {
  onClick: () => void;
};

export default function PairCalendarBackButton({ onClick }: PairCalendarBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 rounded-full bg-white px-5 py-3 text-sm font-black shadow-[0_10px_24px_rgba(107,47,19,0.12)]"
    >
← 戻る
    </button>
  );
}
