import { useEffect, useRef, useState } from "react";
import type { ForumSeriesRef } from "../api/manApi";
import { forumSeriesSearch } from "../api/manApi";
import { useUser } from "../login/useUser";

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

  // helper to insert text at current caret
  // const insertAtCaret = (text: string) => {
  //   const el = taRef.current;
  //   if (!el) return setValue((v) => v + text);
  //   const start = el.selectionStart ?? 0;
  //   const end = el.selectionEnd ?? 0;
  //   const next = value.slice(0, start) + text + value.slice(end);
  //   setValue(next);
  //   queueMicrotask(() => {
  //     el.focus();
  //     const pos = start + text.length;
  //     el.setSelectionRange(pos, pos);
  //   });
  // };

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

  // Parse series IDs from content like: [Title](series:123)
  const extractIds = (text: string) =>
    Array.from(text.matchAll(/\(series:(\d+)\)/g)).map((m) => Number(m[1]));

  // Find the @token under the caret
  function detectAtToken(nextValue: string, caret: number) {
    if (caret < 0 || caret > nextValue.length) return null;

    const before = nextValue.slice(0, caret);
    const lastBoundary = Math.max(
      before.lastIndexOf(" "),
      before.lastIndexOf("\n"),
      before.lastIndexOf("\t"),
      before.lastIndexOf("("),
      before.lastIndexOf("[")
    );
    const tokenStart = lastBoundary + 1;
    const token = nextValue.slice(tokenStart, caret);

    if (!token.startsWith("@")) return null;

    const after = nextValue.slice(caret);
    const m = after.match(/^[^\s.,!?)]*/);
    const tokenEnd = caret + (m ? m[0].length : 0);

    const wholeToken = nextValue.slice(tokenStart, tokenEnd);
    const query = wholeToken.slice(1);

    return { tokenStart, tokenEnd, query };
  }

  // Search for series after "@"
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

  // Replace the @token with a markdown series link
  function insertMention(
    chosen: ForumSeriesRef,
    tokenStart: number,
    tokenEnd: number
  ) {
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

  // EVENTS
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setValue(next);

    const caret = e.target.selectionStart ?? next.length;
    const hit = detectAtToken(next, caret);

    if (hit && hit.query.length >= 1) {
      setMentionStart(hit.tokenStart);
      runMentionSearch(hit.query);
    } else {
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

  // Close mention menu when clicking outside
  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      const target = ev.target as Node;
      const clickedTextarea =
        taRef.current === target || !!taRef.current?.contains(target);
      const clickedMentionMenu = !!menuRef.current?.contains(target);
      if (!clickedTextarea && !clickedMentionMenu) setMenuOpen(false);
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

      {/* Live extracted IDs */}
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
