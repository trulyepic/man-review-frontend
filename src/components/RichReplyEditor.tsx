import { useEffect, useRef, useState } from "react";
import type { ForumSeriesRef, ReadingList } from "../api/manApi";
import {
  forumSeriesSearch,
  getMyReadingLists,
  uploadForumMedia,
} from "../api/manApi"; // ⬅️ added uploadForumMedia
import { useUser } from "../login/useUser";
import { useNotice } from "../hooks/useNotice";
import { NoticeModal } from "./NoticeModal";

export default function RichReplyEditor({
  onSubmit,
  compact = false,
  initial = "",
  mode = "reply",
  onCancel,
  // ⬇️ NEW: needed to tie uploads to the thread (+ optional editing post id)
  threadId,
  editingPostId = null,
}: {
  onSubmit: (content: string, seriesIds: number[]) => Promise<void> | void;
  compact?: boolean;
  initial?: string;
  mode?: "reply" | "edit";
  onCancel?: () => void;
  threadId: number; // ⬅️ NEW (required)
  editingPostId?: number | null; // ⬅️ NEW (optional, pass when editing)
}) {
  const { user } = useUser();

  const [value, setValue] = useState(initial);
  const [results, setResults] = useState<ForumSeriesRef[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // NEW: image upload UI
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  // NEW: list popover state
  const listMenuRef = useRef<HTMLDivElement | null>(null);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  const notice = useNotice();

  const MAX_MENTIONS = 10;

  // helper to insert text at caret
  const insertAtCaret = (text: string) => {
    const el = taRef.current;
    if (!el) return setValue((v) => v + text);
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const next = value.slice(0, start) + text + value.slice(end);
    setValue(next);
    queueMicrotask(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

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

  // Detect @token under caret
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

  // Close menus when clicking outside
  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      const target = ev.target as Node;
      const clickedTextarea =
        taRef.current === target || !!taRef.current?.contains(target);
      const clickedMentionMenu = !!menuRef.current?.contains(target);
      const clickedListMenu = !!listMenuRef.current?.contains(target);
      if (!clickedTextarea && !clickedMentionMenu) setMenuOpen(false);
      if (!clickedTextarea && !clickedListMenu) setListMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handlePrimary = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      // alert(
      //   mode === "edit" ? "Content cannot be empty." : "Reply cannot be empty."
      // );
      notice.show({
        message:
          mode === "edit"
            ? "Content cannot be empty."
            : "Reply cannot be empty.",
        title: "Can’t post",
        variant: "warning",
      });
      return;
    }
    const ids = Array.from(new Set(extractIds(trimmed)));

    // In reply mode, keep the original login checks
    if (mode === "reply") {
      if (!user) {
        // alert("You need to be logged in to post a reply.");
        notice.show({
          message: "You need to be logged in to post a reply.",
          title: "Sign in required",
          variant: "warning",
        });
        return;
      }
      if (ids.length > MAX_MENTIONS) {
        // alert(`You can mention up to ${MAX_MENTIONS} series per reply.`);
        notice.show({
          message: `You can mention up to ${MAX_MENTIONS} series per reply.`,
          title: "Limit reached",
          variant: "warning",
        });

        return;
      }
    }

    try {
      await onSubmit(trimmed, ids);
      if (mode === "reply") {
        setValue("");
        setResults([]);
        setMenuOpen(false);
        setMentionStart(null);
      }
    } catch (err: unknown) {
      alert(
        getErrorMessage(
          err,
          mode === "edit" ? "Failed to save." : "Failed to post reply."
        )
      );
    }
  };

  // ⬇️ NEW: image/GIF picking + upload
  async function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    const mime = (f.type || "").toLowerCase();
    const isGif = mime === "image/gif";
    const maxBytes = isGif ? 1_048_576 : 307_200; // 1 MB vs 300 KB
    if (f.size > maxBytes) {
      // alert(
      //   isGif ? "GIF too large (max 1 MB)." : "Image too large (max 300 KB)."
      // );
      notice.show({
        message: isGif
          ? "GIF too large (max 1 MB)."
          : "Image too large (max 300 KB).",
        title: "Upload blocked",
        variant: "warning",
      });

      e.currentTarget.value = "";
      return;
    }

    try {
      setUploading(true);
      const { url } = await uploadForumMedia(
        threadId,
        f,
        editingPostId ?? undefined
      );
      insertAtCaret(`![](${url})`);
    } catch (err: unknown) {
      // alert(err?.message || "Upload failed.");
      notice.show({
        message: getErrorMessage(err, "Upload failed."),
        title: "Upload failed",
        variant: "error",
      });
    } finally {
      setUploading(false);
      e.currentTarget.value = "";
    }
  }

  return (
    <div className={`rounded ${compact ? "bg-gray-50" : "bg-white"} relative`}>
      {/* toolbar */}
      <div className="flex items-center gap-2 mb-2 text-sm relative">
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

        {/* NEW: Image/GIF */}
        <button
          type="button"
          className="px-2 py-1 rounded border hover:bg-gray-50"
          onClick={() => fileRef.current?.click()}
          title="Add image or GIF"
        >
          + Image/GIF
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handlePickFile}
        />
        {uploading && <span className="text-xs text-gray-500">Uploading…</span>}

        {/* List picker */}
        <button
          type="button"
          className="px-2 py-1 rounded border hover:bg-gray-50"
          title="Insert a link to one of your reading lists"
          onClick={async () => {
            if (!user) {
              alert("Log in to share a list.");
              return;
            }
            setListMenuOpen((o) => !o);
            if (!lists.length) {
              try {
                setListsLoading(true);
                const data = await getMyReadingLists();
                setLists(data);
              } finally {
                setListsLoading(false);
              }
            }
          }}
        >
          📃 List
        </button>

        {listMenuOpen && (
          <div
            ref={listMenuRef}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute z-50 top-8 left-0 w-80 rounded border bg-white shadow"
          >
            {listsLoading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Loading…</div>
            ) : lists.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No lists yet.
              </div>
            ) : (
              <div className="py-1">
                {lists.map((l) => {
                  const shareable = l.is_public && !!l.share_token;
                  const base =
                    "w-full flex items-center gap-2 px-3 py-2 text-left truncate";
                  return (
                    <button
                      key={l.id}
                      type="button"
                      disabled={!shareable}
                      title={
                        shareable
                          ? "Insert public list"
                          : "This list is private. Open My Reading Lists and click “Share”."
                      }
                      onClick={() => {
                        if (!shareable) {
                          alert(
                            "This list is private.\nOpen My Reading Lists → Share to create a public link."
                          );
                          return;
                        }
                        insertAtCaret(`[${l.name}](/lists/${l.share_token})`);
                        setListMenuOpen(false);
                      }}
                      className={
                        base +
                        " " +
                        (shareable
                          ? "hover:bg-gray-50"
                          : "opacity-60 cursor-not-allowed")
                      }
                    >
                      <span className="text-lg" aria-hidden>
                        📃
                      </span>
                      <span className="min-w-0 flex-1 truncate">{l.name}</span>
                      {!shareable && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          Private
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <span className="ml-2 text-xs text-gray-500">
          Markdown + type <span className="font-semibold">@</span> to mention a
          series · <span className="font-medium">PNG/JPEG/WebP ≤ 300 KB</span>{" "}
          (≤1024×1024), <span className="font-medium">GIF ≤ 1 MB</span>{" "}
          (≤512×512)
        </span>
      </div>

      <textarea
        ref={taRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={
          mode === "edit"
            ? "Edit your content…"
            : "Write a reply… (try typing @series title to mention/ref a series)"
        }
        className="w-full border rounded px-3 py-2 h-28"
      />

      {/* Mention menu */}
      {menuOpen && results.length > 0 && (
        <div
          ref={menuRef}
          className="absolute left-2 right-2 mt-1 top-full z-40 max-h-60 overflow-auto rounded border bg-white shadow"
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

      <div className="mt-3 flex justify-end gap-2">
        {mode === "edit" ? (
          <>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePrimary}
              className="px-3 py-1.5 rounded bg-blue-600 text-white"
            >
              Save
            </button>
          </>
        ) : (
          <button
            onClick={handlePrimary}
            className="px-3 py-1.5 rounded bg-blue-600 text-white"
          >
            Post Reply
          </button>
        )}
      </div>
      <NoticeModal
        open={notice.open}
        title={notice.title}
        message={notice.message}
        variant={notice.variant}
        onClose={notice.hide}
      />
    </div>
  );
}
