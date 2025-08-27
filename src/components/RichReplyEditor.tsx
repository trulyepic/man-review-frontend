import { useEffect, useRef, useState } from "react";
import type { ForumSeriesRef } from "../api/manApi";
import { forumSeriesSearch } from "../api/manApi";
import { useUser } from "../login/useUser";

// type Props = {
//   value: string;
//   onChange: (text: string) => void;

//   // Selected series IDs are tracked outside so callers can submit them
//   seriesIds: number[];
//   onSeriesIdsChange: (ids: number[]) => void;

//   placeholder?: string;
//   compact?: boolean;
// };

export default function RichReplyEditor({
  onSubmit,
  compact = false,
  initial = "",
}: {
  onSubmit: (content: string, seriesIds: number[]) => Promise<void> | void;
  compact?: boolean;
  initial?: string;
}) {
  const { user } = useUser();

  const [value, setValue] = useState(initial);
  const [results, setResults] = useState<ForumSeriesRef[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  // Tracks active "@word" start index (where the '@' begins)
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const MAX_MENTIONS = 10;

  // ---- helpers
  type ApiErrorPayload = {
    detail?: string | { message?: string };
    message?: string;
  };

  function getErrorMessage(
    e: unknown,
    fallback = "Failed to post reply."
  ): string {
    if (typeof e === "string") return e;
    if (e instanceof Error) return e.message;

    if (typeof e === "object" && e !== null) {
      // Safely dig into axios-style shapes without using `any`
      const resp = (e as { response?: { data?: ApiErrorPayload } }).response;
      const data = resp?.data;

      const detail = data?.detail;
      if (typeof detail === "string") return detail;
      if (detail && typeof detail === "object" && "message" in detail) {
        const msg = (detail as { message?: unknown }).message;
        if (typeof msg === "string") return msg;
      }

      const msg = (e as { message?: unknown }).message;
      if (typeof msg === "string") return msg;
    }

    return fallback;
  }

  const wrapSelection = (left: string, right = left) => {
    const el = taRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = value.slice(0, start);
    const sel = value.slice(start, end);
    const after = value.slice(end);
    const next = `${before}${left}${sel}${right}${after}`;
    setValue(next);
    queueMicrotask(() => {
      el.focus();
      const cursorStart = start + left.length;
      el.setSelectionRange(cursorStart, cursorStart + sel.length);
    });
  };

  // Parse IDs from content like: [Title](series:123)
  const extractIds = (text: string) =>
    Array.from(text.matchAll(/\(series:(\d+)\)/g)).map((m) => Number(m[1]));

  // Given the new text value and caret, find the @token under caret and return its query + bounds
  function detectAtToken(nextValue: string, caret: number) {
    // Guard: if caret invalid or no text
    if (caret < 0 || caret > nextValue.length) return null;

    // Slice up to caret, find the last whitespace/punct boundary
    const before = nextValue.slice(0, caret);
    const lastBoundary = Math.max(
      before.lastIndexOf(" "),
      before.lastIndexOf("\n"),
      before.lastIndexOf("\t"),
      before.lastIndexOf("("),
      before.lastIndexOf("[")
    );
    const tokenStart = lastBoundary + 1;
    const token = nextValue.slice(tokenStart, caret); // token up to caret

    if (!token.startsWith("@")) return null;

    // Now find token end (from caret forward until whitespace/punct)
    const after = nextValue.slice(caret);
    const m = after.match(/^[^\s.,!?)]*/);
    const tokenEnd = caret + (m ? m[0].length : 0);

    const wholeToken = nextValue.slice(tokenStart, tokenEnd); // e.g. "@solo"
    const query = wholeToken.slice(1); // remove "@"

    return { tokenStart, tokenEnd, query };
  }

  // Run search for @query
  async function runMentionSearch(q: string) {
    try {
      const r = await forumSeriesSearch(q);
      setResults(r);
      setHighlight(0);
      setMenuOpen(r.length > 0);
    } catch {
      setResults([]);
      setMenuOpen(false);
    }
  }

  // Insert chosen mention replacing the @token
  function insertMention(
    chosen: ForumSeriesRef,
    tokenStart: number,
    tokenEnd: number
  ) {
    // Count current mentions
    const currentIds = Array.from(new Set(extractIds(value)));
    if (currentIds.length >= MAX_MENTIONS) {
      alert(`You can mention up to ${MAX_MENTIONS} series per reply.`);
      setMenuOpen(false);
      return;
    }

    const before = value.slice(0, tokenStart);
    const after = value.slice(tokenEnd);
    const inserted = `[${chosen.title || `#${chosen.series_id}`}](series:${
      chosen.series_id
    })`;
    const next = `${before}${inserted}${after}`;
    setValue(next);
    setMenuOpen(false);
    setResults([]);
    setMentionStart(null);

    queueMicrotask(() => {
      taRef.current?.focus();
      const newPos = (before + inserted).length;
      taRef.current?.setSelectionRange(newPos, newPos);
    });
  }

  // --- EVENTS ---
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setValue(next);

    const caret = e.target.selectionStart ?? next.length;
    const hit = detectAtToken(next, caret);

    // require at least 1–2 chars after @ to search; adjust as desired
    if (hit && hit.query.length >= 1) {
      // console.log("SEARCH:", hit.query);
      setMentionStart(hit.tokenStart);
      runMentionSearch(hit.query);
    } else {
      // No active @token -> close menu
      setMentionStart(null);
      setMenuOpen(false);
      setResults([]);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!menuOpen || results.length === 0 || mentionStart === null) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      // Re-detect bounds using current caret to be safe
      const caret = taRef.current?.selectionStart ?? value.length;
      const hit = detectAtToken(value, caret);
      const start = hit ? hit.tokenStart : mentionStart;
      const end = hit ? hit.tokenEnd : caret;
      insertMention(results[highlight], start, end);
    } else if (e.key === "Escape") {
      setMenuOpen(false);
      setResults([]);
      setMentionStart(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(ev.target as Node) &&
        ev.target !== taRef.current
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handlePost = async () => {
    if (!user) {
      alert("You need to be logged in to post a reply.");
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      alert("Reply cannot be empty.");
      return;
    }
    const ids = Array.from(new Set(extractIds(trimmed)));
    if (ids.length > MAX_MENTIONS) {
      alert(`You can mention up to ${MAX_MENTIONS} series per reply.`);
      return;
    }
    try {
      await onSubmit(trimmed, ids);
      setValue("");
      setResults([]);
      setMenuOpen(false);
      setMentionStart(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className={`rounded ${compact ? "bg-gray-50" : "bg-white"} relative`}>
      {/* toolbar */}
      <div className="flex items-center gap-2 mb-2 text-sm">
        <button
          type="button"
          className="px-2 py-1 rounded border hover:bg-gray-50"
          onClick={() => wrapSelection("**")}
          title="Bold (**text**)"
        >
          B
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border hover:bg-gray-50 italic"
          onClick={() => wrapSelection("*")}
          title="Italic (*text*)"
        >
          I
        </button>
        <span className="ml-2 text-xs text-gray-500">
          Markdown + type <span className="font-semibold">@</span> to mention a
          series
        </span>
      </div>

      <textarea
        ref={taRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Write a reply… (try typing @series title to mention/ref a series)"
        className="w-full border rounded px-3 py-2 h-28"
      />

      {/* Mention menu */}
      {menuOpen && results.length > 0 && (
        <div
          ref={menuRef}
          className="absolute left-2 right-2 mt-1 top-full z-50 max-h-60 overflow-auto rounded border bg-white shadow"
        >
          {results.map((r, i) => (
            <button
              key={r.series_id}
              type="button"
              onClick={() => {
                // Safely compute current token bounds in case user moved caret
                const caret = taRef.current?.selectionStart ?? value.length;
                const hit = detectAtToken(value, caret);
                const start = hit ? hit.tokenStart : mentionStart ?? caret;
                const end = hit ? hit.tokenEnd : caret;
                insertMention(r, start, end);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left ${
                i === highlight ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              title={r.title || `#${r.series_id}`}
            >
              {r.cover_url ? (
                <img
                  src={r.cover_url}
                  alt={r.title || `Series #${r.series_id}`}
                  className="w-6 h-8 object-cover rounded"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-6 h-8 rounded bg-gray-200" />
              )}
              <div className="min-w-0">
                <div className="text-sm truncate">{r.title}</div>
                <div className="text-[11px] text-gray-500">#{r.series_id}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Live extracted IDs (nice to verify during testing) */}
      {extractIds(value).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Array.from(new Set(extractIds(value))).map((id) => (
            <span
              key={id}
              className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
            >
              #{id}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <button
          onClick={handlePost}
          className="px-3 py-1.5 rounded bg-blue-600 text-white"
        >
          Post Reply
        </button>
      </div>
    </div>
  );
}

// export default function RichReplyEditor({
//   value,
//   onChange,
//   seriesIds,
//   onSeriesIdsChange,
//   placeholder,
//   compact,
// }: Props) {
//   const taRef = useRef<HTMLTextAreaElement | null>(null);

//   // Autocomplete state
//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState("");
//   const [suggestions, setSuggestions] = useState<ForumSeriesRef[]>([]);
//   const [triggerStart, setTriggerStart] = useState<number | null>(null);

//   // Keep caret so we can restore after insert
//   const caretRef = useRef<number>(0);

//   // Handle typing + detect `[[ ...`
//   const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
//     const next = e.target.value;
//     onChange(next);

//     const pos = e.target.selectionStart ?? next.length;
//     caretRef.current = pos;

//     const upto = next.slice(0, pos);
//     const lastOpen = upto.lastIndexOf("[[");
//     const lastClose = upto.lastIndexOf("]]");

//     if (lastOpen !== -1 && (lastClose === -1 || lastClose < lastOpen)) {
//       const q = upto.slice(lastOpen + 2);
//       if (q.trim().length >= 1) {
//         setQuery(q.trim());
//         setTriggerStart(lastOpen);
//         setOpen(true);
//         return;
//       }
//     }
//     // otherwise close the menu
//     setOpen(false);
//     setTriggerStart(null);
//     setQuery("");
//   };

//   // Debounced fetch for autocomplete
//   useEffect(() => {
//     let active = true;
//     const t = setTimeout(async () => {
//       if (!open || !query) {
//         setSuggestions([]);
//         return;
//       }
//       try {
//         const res = await forumSeriesSearch(query);
//         if (active) setSuggestions(res);
//       } catch {
//         if (active) setSuggestions([]);
//       }
//     }, 180);
//     return () => {
//       active = false;
//       clearTimeout(t);
//     };
//   }, [open, query]);

//   const addSeries = (s: ForumSeriesRef) => {
//     if (triggerStart == null || !taRef.current) return;

//     const before = value.slice(0, triggerStart);
//     const after = value.slice(caretRef.current);
//     const insertText = s.title ? s.title : `#${s.series_id}`;
//     const nextValue = `${before}${insertText}${after}`;

//     onChange(nextValue);

//     // update caret
//     const newCaret = before.length + insertText.length;
//     requestAnimationFrame(() => {
//       taRef.current?.focus();
//       taRef.current?.setSelectionRange(newCaret, newCaret);
//       caretRef.current = newCaret;
//     });

//     // record chosen series id (dedupe)
//     if (!seriesIds.includes(s.series_id)) {
//       onSeriesIdsChange([...seriesIds, s.series_id]);
//     }

//     // close menu
//     setOpen(false);
//     setTriggerStart(null);
//     setQuery("");
//     setSuggestions([]);
//   };

//   const removeSeries = (id: number) => {
//     onSeriesIdsChange(seriesIds.filter((x) => x !== id));
//   };

//   // Tiny toolbar (bold/italic)
//   const wrapSelection = (fence: string) => {
//     const ta = taRef.current;
//     if (!ta) return;
//     const { selectionStart, selectionEnd } = ta;
//     const sel = value.slice(selectionStart, selectionEnd);
//     const next =
//       value.slice(0, selectionStart) +
//       fence +
//       sel +
//       fence +
//       value.slice(selectionEnd);
//     onChange(next);

//     // reselect inside fences
//     const offset = fence.length;
//     requestAnimationFrame(() => {
//       ta.focus();
//       ta.setSelectionRange(selectionStart + offset, selectionEnd + offset);
//     });
//   };

//   return (
//     <div
//       className={`relative ${compact ? "" : "border rounded-lg p-3 bg-white"}`}
//     >
//       {/* Toolbar */}
//       <div className="mb-2 flex items-center gap-2 text-xs">
//         <button
//           type="button"
//           onClick={() => wrapSelection("**")}
//           className="px-2 py-1 rounded border hover:bg-gray-50"
//           title="Bold"
//         >
//           Bold
//         </button>
//         <button
//           type="button"
//           onClick={() => wrapSelection("*")}
//           className="px-2 py-1 rounded border hover:bg-gray-50"
//           title="Italic"
//         >
//           Italic
//         </button>
//         <span className="ml-auto text-[11px] text-gray-500">
//           Tip: type <code>[[</code> to insert a series
//         </span>
//       </div>

//       <textarea
//         ref={taRef}
//         value={value}
//         onChange={handleChange}
//         placeholder={placeholder || "Write in Markdown…"}
//         className="w-full border rounded px-3 py-2 h-36"
//       />

//       {/* Autocomplete panel */}
//       {open && suggestions.length > 0 && (
//         <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto border rounded bg-white shadow">
//           {suggestions.map((s) => (
//             <button
//               key={s.series_id}
//               type="button"
//               onClick={() => addSeries(s)}
//               className="flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-gray-50"
//             >
//               {s.cover_url ? (
//                 <img
//                   src={s.cover_url}
//                   alt={s.title || `Series #${s.series_id}`}
//                   className="w-8 h-12 object-cover rounded bg-gray-200"
//                   loading="lazy"
//                   decoding="async"
//                 />
//               ) : (
//                 <div className="w-8 h-12 rounded bg-gray-200" />
//               )}
//               <div className="min-w-0">
//                 <div className="text-sm truncate">
//                   {s.title || `#${s.series_id}`}
//                 </div>
//                 <div className="mt-0.5 flex gap-1">
//                   {s.type && (
//                     <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100">
//                       {s.type}
//                     </span>
//                   )}
//                   {s.status && (
//                     <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100">
//                       {s.status}
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Selected series mini-cards */}
//       {seriesIds.length > 0 && (
//         <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
//           {suggestionsFromIds(seriesIds, suggestions).map((s) => (
//             <MiniCard
//               key={s.series_id}
//               s={s}
//               onRemove={() => removeSeries(s.series_id)}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// /** If we only know IDs, show lightweight cards; enhance with last fetched data when available */
// function suggestionsFromIds(
//   ids: number[],
//   known: ForumSeriesRef[]
// ): ForumSeriesRef[] {
//   const map = new Map<number, ForumSeriesRef>();
//   for (const k of known) map.set(k.series_id, k);
//   return ids.map((id) => map.get(id) ?? { series_id: id });
// }

// function MiniCard({
//   s,
//   onRemove,
// }: {
//   s: ForumSeriesRef;
//   onRemove: () => void;
// }) {
//   return (
//     <div className="group relative border rounded-lg p-2 flex items-center gap-3 bg-white">
//       {s.cover_url ? (
//         <img
//           src={s.cover_url}
//           alt={s.title || `Series #${s.series_id}`}
//           className="w-12 h-16 object-cover rounded bg-gray-200"
//           loading="lazy"
//           decoding="async"
//         />
//       ) : (
//         <div className="w-12 h-16 rounded bg-gray-200" />
//       )}
//       <div className="min-w-0">
//         <div className="text-sm font-medium truncate">
//           {s.title || `#${s.series_id}`}
//         </div>
//         <div className="mt-1 flex items-center gap-1">
//           {s.type && (
//             <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100">
//               {s.type}
//             </span>
//           )}
//           {s.status && (
//             <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100">
//               {s.status}
//             </span>
//           )}
//         </div>
//       </div>

//       <button
//         type="button"
//         onClick={onRemove}
//         className="absolute top-1 right-1 text-[10px] px-1 py-0.5 rounded border opacity-0 group-hover:opacity-100 hover:bg-red-50"
//         title="Remove"
//       >
//         ✕
//       </button>
//     </div>
//   );
// }
