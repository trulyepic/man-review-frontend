import { useEffect, useRef, useState } from "react";
import type { ForumSeriesRef } from "../api/manApi";
import { forumSeriesSearch } from "../api/manApi";

type Props = {
  value: string;
  onChange: (text: string) => void;

  // Selected series IDs are tracked outside so callers can submit them
  seriesIds: number[];
  onSeriesIdsChange: (ids: number[]) => void;

  placeholder?: string;
  compact?: boolean;
};

export default function RichReplyEditor({
  value,
  onChange,
  seriesIds,
  onSeriesIdsChange,
  placeholder,
  compact,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // Autocomplete state
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ForumSeriesRef[]>([]);
  const [triggerStart, setTriggerStart] = useState<number | null>(null);

  // Keep caret so we can restore after insert
  const caretRef = useRef<number>(0);

  // Handle typing + detect `[[ ...`
  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const next = e.target.value;
    onChange(next);

    const pos = e.target.selectionStart ?? next.length;
    caretRef.current = pos;

    const upto = next.slice(0, pos);
    const lastOpen = upto.lastIndexOf("[[");
    const lastClose = upto.lastIndexOf("]]");

    if (lastOpen !== -1 && (lastClose === -1 || lastClose < lastOpen)) {
      const q = upto.slice(lastOpen + 2);
      if (q.trim().length >= 1) {
        setQuery(q.trim());
        setTriggerStart(lastOpen);
        setOpen(true);
        return;
      }
    }
    // otherwise close the menu
    setOpen(false);
    setTriggerStart(null);
    setQuery("");
  };

  // Debounced fetch for autocomplete
  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (!open || !query) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await forumSeriesSearch(query);
        if (active) setSuggestions(res);
      } catch {
        if (active) setSuggestions([]);
      }
    }, 180);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [open, query]);

  const addSeries = (s: ForumSeriesRef) => {
    if (triggerStart == null || !taRef.current) return;

    const before = value.slice(0, triggerStart);
    const after = value.slice(caretRef.current);
    const insertText = s.title ? s.title : `#${s.series_id}`;
    const nextValue = `${before}${insertText}${after}`;

    onChange(nextValue);

    // update caret
    const newCaret = before.length + insertText.length;
    requestAnimationFrame(() => {
      taRef.current?.focus();
      taRef.current?.setSelectionRange(newCaret, newCaret);
      caretRef.current = newCaret;
    });

    // record chosen series id (dedupe)
    if (!seriesIds.includes(s.series_id)) {
      onSeriesIdsChange([...seriesIds, s.series_id]);
    }

    // close menu
    setOpen(false);
    setTriggerStart(null);
    setQuery("");
    setSuggestions([]);
  };

  const removeSeries = (id: number) => {
    onSeriesIdsChange(seriesIds.filter((x) => x !== id));
  };

  // Tiny toolbar (bold/italic)
  const wrapSelection = (fence: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd } = ta;
    const sel = value.slice(selectionStart, selectionEnd);
    const next =
      value.slice(0, selectionStart) +
      fence +
      sel +
      fence +
      value.slice(selectionEnd);
    onChange(next);

    // reselect inside fences
    const offset = fence.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selectionStart + offset, selectionEnd + offset);
    });
  };

  return (
    <div
      className={`relative ${compact ? "" : "border rounded-lg p-3 bg-white"}`}
    >
      {/* Toolbar */}
      <div className="mb-2 flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => wrapSelection("**")}
          className="px-2 py-1 rounded border hover:bg-gray-50"
          title="Bold"
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => wrapSelection("*")}
          className="px-2 py-1 rounded border hover:bg-gray-50"
          title="Italic"
        >
          Italic
        </button>
        <span className="ml-auto text-[11px] text-gray-500">
          Tip: type <code>[[</code> to insert a series
        </span>
      </div>

      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder || "Write in Markdown…"}
        className="w-full border rounded px-3 py-2 h-36"
      />

      {/* Autocomplete panel */}
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto border rounded bg-white shadow">
          {suggestions.map((s) => (
            <button
              key={s.series_id}
              type="button"
              onClick={() => addSeries(s)}
              className="flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-gray-50"
            >
              {s.cover_url ? (
                <img
                  src={s.cover_url}
                  alt={s.title || `Series #${s.series_id}`}
                  className="w-8 h-12 object-cover rounded bg-gray-200"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-8 h-12 rounded bg-gray-200" />
              )}
              <div className="min-w-0">
                <div className="text-sm truncate">
                  {s.title || `#${s.series_id}`}
                </div>
                <div className="mt-0.5 flex gap-1">
                  {s.type && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100">
                      {s.type}
                    </span>
                  )}
                  {s.status && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100">
                      {s.status}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected series mini-cards */}
      {seriesIds.length > 0 && (
        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
          {suggestionsFromIds(seriesIds, suggestions).map((s) => (
            <MiniCard
              key={s.series_id}
              s={s}
              onRemove={() => removeSeries(s.series_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** If we only know IDs, show lightweight cards; enhance with last fetched data when available */
function suggestionsFromIds(
  ids: number[],
  known: ForumSeriesRef[]
): ForumSeriesRef[] {
  const map = new Map<number, ForumSeriesRef>();
  for (const k of known) map.set(k.series_id, k);
  return ids.map((id) => map.get(id) ?? { series_id: id });
}

function MiniCard({
  s,
  onRemove,
}: {
  s: ForumSeriesRef;
  onRemove: () => void;
}) {
  return (
    <div className="group relative border rounded-lg p-2 flex items-center gap-3 bg-white">
      {s.cover_url ? (
        <img
          src={s.cover_url}
          alt={s.title || `Series #${s.series_id}`}
          className="w-12 h-16 object-cover rounded bg-gray-200"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-12 h-16 rounded bg-gray-200" />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">
          {s.title || `#${s.series_id}`}
        </div>
        <div className="mt-1 flex items-center gap-1">
          {s.type && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100">
              {s.type}
            </span>
          )}
          {s.status && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100">
              {s.status}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 text-[10px] px-1 py-0.5 rounded border opacity-0 group-hover:opacity-100 hover:bg-red-50"
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}
