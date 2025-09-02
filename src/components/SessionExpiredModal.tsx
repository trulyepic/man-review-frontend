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
      className="fixed inset-0 z-[1000] flex items-center justify-center"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      {/* dialog */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Session expired
        </h2>
        <p className="mb-5 text-sm text-gray-600">
          You were logged out due to inactivity or token expiry. Please log in
          again.
        </p>
        <div className="flex justify-end">
          <button
            ref={okRef}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={onConfirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
