type NotificationButtonProps = {
  unreadCount: number;
  onClick: () => void;
};

export default function NotificationButton({
  unreadCount,
  onClick,
}: NotificationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#fffaf2]/90 text-[#4b2a1d] shadow-[0_10px_24px_rgba(75,42,29,0.12)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96]"
      aria-label="通知"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 7.5C4 6.12 5.12 5 6.5 5h11C18.88 5 20 6.12 20 7.5v9C20 17.88 18.88 19 17.5 19h-11C5.12 19 4 17.88 4 16.5v-9Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M5.5 7.5 12 12.5l6.5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
