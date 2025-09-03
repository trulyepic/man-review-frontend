import { useEffect, useRef } from "react";

type Variant = "info" | "success" | "warning" | "error";

export type NoticeModalProps = {
  open: boolean;
  title?: string;
  message: string | React.ReactNode;
  onClose: () => void;
  variant?: Variant;
  primaryText?: string; // default: OK
};

const VARIANT_STYLES: Record<Variant, string> = {
  info: "bg-blue-100 text-blue-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-700",
};

const VARIANT_ICON: Record<Variant, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "⛔",
};

export function NoticeModal({
  open,
  title = "Notice",
  message,
  onClose,
  variant = "info",
  primaryText = "OK",
}: NoticeModalProps) {
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    btnRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mx-auto mt-[12vh] w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-start gap-3">
          <div
            className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${VARIANT_STYLES[variant]}`}
            aria-hidden
          >
            {VARIANT_ICON[variant]}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <div className="mt-1 text-sm text-gray-600">{message}</div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            ref={btnRef}
            type="button"
            className="rounded-xl border px-3 py-1.5 text-sm"
            onClick={onClose}
          >
            {primaryText}
          </button>
        </div>
      </div>
    </div>
  );
}
