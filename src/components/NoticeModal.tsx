import { useEffect, useRef } from "react";

type Variant = "info" | "success" | "warning" | "error";

export type NoticeModalProps = {
  open: boolean;
  title?: string;
  message: string | React.ReactNode;
  onClose: () => void;
  variant?: Variant;
  primaryText?: string;
};

const VARIANT_STYLES: Record<Variant, string> = {
  info: "bg-blue-100 text-blue-700 dark:bg-[linear-gradient(145deg,_rgba(30,45,82,0.86),_rgba(22,31,55,0.86))] dark:text-blue-200",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-[linear-gradient(145deg,_rgba(30,74,58,0.86),_rgba(19,49,39,0.86))] dark:text-emerald-200",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-[linear-gradient(145deg,_rgba(90,58,20,0.86),_rgba(61,38,12,0.86))] dark:text-amber-200",
  error:
    "bg-red-100 text-red-700 dark:bg-[linear-gradient(145deg,_rgba(83,25,24,0.82),_rgba(52,17,16,0.82))] dark:text-red-200",
};

const VARIANT_ICON: Record<Variant, string> = {
  info: "i",
  success: "OK",
  warning: "!",
  error: "x",
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
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_26px_70px_rgba(15,23,42,0.18)] dark:border-[#3a3028] dark-theme-shell">
        <div className="mb-3 flex items-start gap-3">
          <div
            className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${VARIANT_STYLES[variant]}`}
            aria-hidden
          >
            {VARIANT_ICON[variant]}
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

        <div className="mt-5 flex justify-end">
          <button
            ref={btnRef}
            type="button"
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 dark-theme-card-soft dark:text-stone-200 dark:hover:bg-[#241d19]"
            onClick={onClose}
          >
            {primaryText}
          </button>
        </div>
      </div>
    </div>
  );
}
