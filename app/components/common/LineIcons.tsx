type LineIconProps = {
  className?: string;
};

export function CameraLineIcon({ className }: LineIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M7.3 7.3 8.8 5h6.4l1.5 2.3h2.1a2.1 2.1 0 0 1 2.1 2.1v7.5a2.1 2.1 0 0 1-2.1 2.1H5.2a2.1 2.1 0 0 1-2.1-2.1V9.4a2.1 2.1 0 0 1 2.1-2.1h2.1Z"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.2" r="3.35" stroke="currentColor" strokeWidth="2.1" />
    </svg>
  );
}

export function CalendarLineIcon({ className }: LineIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M7 4.8v3M17 4.8v3M4.7 9.4h14.6"
        stroke="currentColor"
        strokeWidth="2.05"
        strokeLinecap="round"
      />
      <rect x="4.2" y="6.5" width="15.6" height="13.4" rx="2.2" stroke="currentColor" strokeWidth="2.05" />
      <path
        d="M8.2 12.8h.1M12 12.8h.1M15.8 12.8h.1M8.2 16.2h.1M12 16.2h.1"
        stroke="currentColor"
        strokeWidth="2.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeartLineIcon({ className }: LineIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M12 20.2S4.3 15.7 4.3 9.6c0-2.5 1.8-4.2 4-4.2 1.6 0 2.8.8 3.7 2 .9-1.2 2.1-2 3.7-2 2.2 0 4 1.7 4 4.2 0 6.1-7.7 10.6-7.7 10.6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CommentLineIcon({ className }: LineIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M5.2 18.4v-2.9a7.1 7.1 0 1 1 3.1 3.1l-3.1-.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
