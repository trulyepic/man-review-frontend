import { useState } from "react";

type ToggleResult =
  | { ok: true; count: number; hearted?: boolean } // success: server count; optional server truth for on/off
  | { ok: false; error?: string }; // failure: revert

type HeartButtonProps = {
  initialOn: boolean;
  initialCount: number;
  ariaLabelBase?: string;
  onToggle: () => Promise<ToggleResult>; // ← no param
};

export function HeartButton({
  initialOn,
  initialCount,
  onToggle,
  ariaLabelBase = "Heart",
}: HeartButtonProps) {
  const [on, setOn] = useState(initialOn);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const label = `${ariaLabelBase}: ${on ? "on" : "off"}; ${count} ${
    count === 1 ? "like" : "likes"
  }`;

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      disabled={busy}
      className={`inline-flex items-center gap-1 text-xs rounded-full border px-2 py-1 ${
        on ? "bg-rose-50 border-rose-200 text-rose-700" : "hover:bg-gray-50"
      } ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
      onClick={async () => {
        if (busy) return;
        setBusy(true);

        // optimistic flip
        const prevOn = on;
        const prevCount = count;
        const nextOn = !prevOn;
        setOn(nextOn);
        setCount((p) => Math.max(0, p + (nextOn ? 1 : -1)));

        try {
          const res = await onToggle(); // ← no arg
          if (res.ok) {
            // If server tells us the actual hearted state, trust it.
            if (typeof res.hearted === "boolean") setOn(res.hearted);
            setCount(res.count); // always use server count
          } else {
            // revert silently
            setOn(prevOn);
            setCount(prevCount);
          }
        } catch {
          // revert on unexpected error
          setOn(prevOn);
          setCount(prevCount);
        } finally {
          setBusy(false);
        }
      }}
    >
      <span aria-hidden>{on ? "❤️" : "🤍"}</span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
