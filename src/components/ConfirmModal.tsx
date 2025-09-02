import { useEffect, useRef } from "react";

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean; // red confirm button if true
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean; // disable buttons while doing work
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
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000]">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={busy ? undefined : onCancel}
      />
      <div className="relative mx-auto mt-[10vh] w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-start gap-3">
          <div
            className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              destructive
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {destructive ? "⚠️" : "ℹ️"}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <div className="mt-1 text-sm text-gray-600">{message}</div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border px-3 py-1.5 text-sm disabled:opacity-60"
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
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-400"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-400"
            } focus:outline-none focus:ring-2`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
