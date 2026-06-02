import type { CalendarPopupState } from "../../types/calendar";

type CalendarPopupProps = {
  popup: CalendarPopupState;
  onClose: () => void;
};

export default function CalendarPopup({ popup, onClose }: CalendarPopupProps) {
  if (!popup) return null;

  const hasConfirmAction = Boolean(popup.onConfirm);

  async function handleConfirm() {
    const confirmAction = popup?.onConfirm;

    if (!confirmAction) {
      onClose();
      return;
    }

    onClose();
    await confirmAction();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-5">
      <div className="w-full max-w-sm rounded-[32px] bg-white p-6 text-[#6b2f13] shadow-2xl">
        <p className="text-xs font-black text-[#f39a00]">CALENDAR MESSAGE</p>
        <h2 className="mt-2 text-2xl font-black">{popup.title}</h2>
        <p className="mt-4 whitespace-pre-line text-sm font-bold leading-6 text-[#6b2f13]/75">
          {popup.message}
        </p>

        <div className="mt-6 flex gap-3">
          {hasConfirmAction && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full bg-[#fff4d7] py-3 text-sm font-black"
            >
              {popup.cancelLabel || "やめる"}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 rounded-full py-3 text-sm font-black text-white shadow ${
              popup.danger ? "bg-red-500" : "bg-[#f39a00]"
            }`}
          >
            {popup.confirmLabel || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
