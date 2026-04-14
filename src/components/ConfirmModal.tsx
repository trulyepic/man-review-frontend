import { useEffect, useRef } from "react";

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

export function ConfirmModal({
  open,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmModalProps) {
  const firstBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) firstBtnRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={busy ? undefined : onCancel}
      />
      <div className="relative w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_26px_70px_rgba(15,23,42,0.18)] dark:border-[#3a3028] dark-theme-shell">
        <div className="mb-3 flex items-start gap-3">
          <div
            className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              destructive
                ? "bg-red-100 text-red-600 dark:bg-[linear-gradient(145deg,_rgba(83,25,24,0.82),_rgba(52,17,16,0.82))] dark:text-red-200"
                : "bg-blue-100 text-blue-600 dark:bg-[linear-gradient(145deg,_rgba(30,45,82,0.86),_rgba(22,31,55,0.86))] dark:text-blue-200"
            }`}
          >
            {destructive ? "!" : "i"}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-stone-50">
              {title}
            </h2>
            <div className="mt-1 text-sm leading-6 text-gray-600 dark:text-stone-300">
              {message}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-60 dark-theme-card-soft dark:text-stone-200 dark:hover:bg-[#241d19]"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelText}
          </button>
          <button
            ref={firstBtnRef}
            type="button"
            className={`rounded-xl px-3 py-1.5 text-sm text-white disabled:opacity-60 ${
              destructive
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-400 dark:bg-[linear-gradient(145deg,_rgba(173,52,47,0.96),_rgba(137,38,35,0.96))] dark:hover:bg-[linear-gradient(145deg,_rgba(192,61,55,0.96),_rgba(155,43,39,0.96))]"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-400 dark:bg-[linear-gradient(145deg,_rgba(51,93,195,0.96),_rgba(34,73,170,0.96))] dark:hover:bg-[linear-gradient(145deg,_rgba(69,109,209,0.96),_rgba(48,86,184,0.96))]"
            } focus:outline-none focus:ring-2`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
