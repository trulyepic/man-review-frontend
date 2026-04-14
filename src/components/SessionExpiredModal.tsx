import { useEffect, useRef } from "react";

export function SessionExpiredModal({
  open,
  onConfirm,
}: {
  open: boolean;
  onConfirm: () => void;
}) {
  const okRef = useRef<HTMLButtonElement | null>(null);

  // Basic a11y: focus the OK button when modal opens
  useEffect(() => {
    if (open) okRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      {/* dialog */}
      <div className="dark-theme-shell relative w-full max-w-sm rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_26px_70px_rgba(15,23,42,0.18)] dark:border-[#3a3028]">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-stone-50">
          Session expired
        </h2>
        <p className="mb-5 text-sm leading-6 text-gray-600 dark:text-stone-300">
          You were logged out due to inactivity or token expiry. Please log in
          again.
        </p>
        <div className="flex justify-end">
          <button
            ref={okRef}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-[linear-gradient(145deg,_rgba(51,93,195,0.96),_rgba(34,73,170,0.96))] dark:hover:bg-[linear-gradient(145deg,_rgba(69,109,209,0.96),_rgba(48,86,184,0.96))]"
            onClick={onConfirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
