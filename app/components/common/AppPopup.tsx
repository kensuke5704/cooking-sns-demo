export type AppPopupState = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  danger?: boolean;
};

export default function AppPopup({
  popup,
  onClose,
}: {
  popup: AppPopupState | null;
  onClose: () => void;
}) {
  if (!popup) return null;

  const handleConfirm = async () => {
    const confirmAction = popup.onConfirm;

    onClose();

    if (confirmAction) {
      await confirmAction();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-5">
      <div className="w-full max-w-sm rounded-[32px] bg-white p-6 text-center text-[#6b2f13] shadow-[0_24px_60px_rgba(107,47,19,0.22)]">
        <p className="text-xs font-black text-[#f39a00]">MESSAGE</p>
        <h2 className="mt-2 text-2xl font-black">{popup.title}</h2>
        <p className="mt-3 whitespace-pre-line text-sm font-bold leading-6 opacity-70">
          {popup.message}
        </p>

        <div className="mt-6 flex gap-3">
          {popup.onConfirm && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full bg-[#fff4d7] py-3 text-sm font-black text-[#6b2f13]"
            >
              {popup.cancelLabel || "キャンセル"}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 rounded-full py-3 text-sm font-black text-white ${
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
