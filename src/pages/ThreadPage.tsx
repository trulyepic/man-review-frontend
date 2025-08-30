import { useEffect, useState, type CSSProperties } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  getForumThread,
  createForumPost,
  deleteForumPost,
  type ForumPost,
  deleteMyForumPost,
  type ForumSeriesRef,
  type ForumThread,
  lockForumThread,
  updateForumThreadSettings,
  getPublicReadingList,
} from "../api/manApi";
import { useUser } from "../login/useUser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Helmet } from "react-helmet";
import { stripMdHeading } from "../util/strings";
import RichReplyEditor from "../components/RichReplyEditor";

import rehypeRaw from "rehype-raw"; // Re-enable rehype-raw
import rehypeSanitize from "rehype-sanitize"; // Re-enable rehype-sanitize

const pillBase =
  "inline-flex items-center gap-1 h-7 px-3 rounded-full border text-xs font-medium shadow-sm";
const pillAmber = "border-amber-200 bg-amber-50 text-amber-800";
const pillIndigo = "border-indigo-200 bg-indigo-50 text-indigo-800";
const pillRose = "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100";

const ctrlGroup =
  "flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm";
const ctrlBtn =
  "inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs border border-transparent hover:bg-gray-50 text-gray-700";
const ctrlActiveAmber = "bg-amber-50 border-amber-300 text-amber-800";
const ctrlActiveIndigo = "bg-indigo-50 border-indigo-300 text-indigo-800";

type AxiosLike = {
  message?: string;
  response?: { data?: { detail?: unknown } };
};

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as AxiosLike;
    const detail = e.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object" && "message" in detail) {
      const msg = (detail as { message?: string }).message;
      if (typeof msg === "string") return msg;
    }
    if (e.message) return e.message;
  }
  return "An error occurred.";
}

const listPublicCache = new Map<string, boolean>();

function ListPillMaybeActive({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  // /lists/<token>[?...]
  const token = to.replace(/^\/lists\//, "").split(/[?#]/)[0];
  const [isPublic, setIsPublic] = useState<boolean | null>(
    listPublicCache.has(token) ? listPublicCache.get(token)! : null
  );

  useEffect(() => {
    if (isPublic !== null) return;
    let cancelled = false;
    (async () => {
      try {
        await getPublicReadingList(token);
        if (!cancelled) {
          listPublicCache.set(token, true);
          setIsPublic(true);
        }
      } catch {
        if (!cancelled) {
          listPublicCache.set(token, false);
          setIsPublic(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isPublic]);

  const base =
    "inline-flex items-center gap-1 h-7 px-3 rounded-full border text-xs font-medium shadow-sm";
  const activeClass =
    "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100";

  // Unknown: show active styling while we check (optional)
  if (isPublic === null) {
    return (
      <span
        className={`${base} bg-emerald-50 text-emerald-700 ring-emerald-200`}
      >
        <span aria-hidden className="text-[11px]">
          📃
        </span>
        <span className="truncate">{children}</span>
      </span>
    );
  }

  if (!isPublic) {
    // ⛔ Unshared now → gray pill, no link
    return (
      <span
        className={`${base} bg-gray-100 text-gray-500 ring-gray-200`}
        title="This list is no longer public"
      >
        <span aria-hidden className="text-[11px]">
          📃
        </span>
        <span className="truncate">{children}</span>
      </span>
    );
  }

  // ✅ Public → green pill link
  return (
    <Link
      to={to}
      className={`${base} ${activeClass} no-underline`}
      title="Open reading list"
    >
      <span aria-hidden className="text-[11px]">
        📃
      </span>
      <span className="truncate">{children}</span>
    </Link>
  );
}

function MarkdownProse({
  children,
  className,
  size = "base",
}: {
  children: string;
  className?: string;
  size?: "base" | "sm";
}) {
  // 1) Remove [Title](series:123) and [Title](/series/123) from the markdown itself
  const safeMd = children
    // [Title](series:123)
    .replace(/\[([^\]]+?)\]\(\s*series:\s*\d+\s*\)/gi, "$1")
    // [Title](/series/123)  (also tolerate query/hash)
    .replace(/\[([^\]]+?)\]\(\s*\/series\/\d+(?:[?#][^)]+)?\s*\)/gi, "$1");

  return (
    <div
      className={`${size === "sm" ? "prose prose-sm" : "prose"} max-w-none ${
        className || ""
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[
          rehypeRaw, // Enable raw HTML processing
          rehypeSanitize, // Sanitize the raw HTML to ensure safety
        ]}
        components={{
          a: ({ children: linkChildren, href, ...props }) => {
            const url = String(href ?? "");

            // 2) Just in case anything survived: render series links as plain text
            const isSeriesLink =
              /^series:\s*\d+$/i.test(url) ||
              /^\/series\/\d+(?:[/?#].*)?$/i.test(url);

            if (isSeriesLink) {
              return (
                <span className="font-medium text-gray-900">
                  {linkChildren}
                </span>
              );
            }

            // Legacy list pill
            if (url.startsWith("list:")) {
              const tokenOrId = url.slice("list:".length);
              const isToken = /\D/.test(tokenOrId);
              const to = isToken
                ? `/lists/${tokenOrId}`
                : `/my-lists#list-${tokenOrId}`;

              return (
                <ListPillMaybeActive to={to}>
                  {linkChildren}
                </ListPillMaybeActive>
              );
            }

            // Same-origin SPA links (incl. /lists/:token smart pill)
            const toURL = (() => {
              try {
                const u = new URL(url, window.location.origin);
                if (
                  u.origin === window.location.origin &&
                  u.pathname.startsWith("/")
                ) {
                  return u.pathname + u.search + u.hash;
                }
              } catch {
                if (url.startsWith("/")) return url;
              }
              return null;
            })();

            if (toURL && /^\/lists\//.test(toURL)) {
              return (
                <ListPillMaybeActive to={toURL}>
                  {linkChildren}
                </ListPillMaybeActive>
              );
            }

            if (toURL) {
              return (
                <Link
                  to={toURL}
                  className="underline decoration-emerald-600/40 hover:decoration-emerald-600"
                >
                  {linkChildren}
                </Link>
              );
            }

            // External fallback
            const isExternal = /^https?:/i.test(url);
            return (
              <a
                {...props}
                href={url}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
              >
                {linkChildren}
              </a>
            );
          },
        }}
      >
        {safeMd}
      </ReactMarkdown>
    </div>
  );
}

export default function ThreadPage() {
  const { id } = useParams();
  const threadId = Number(id);
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const { user } = useUser();
  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";

  const loc = useLocation();
  const siteUrl = "https://toonranks.com";

  const threadTitle = thread?.title
    ? `${thread.title} — Forum — Toon Ranks`
    : "Forum thread — Toon Ranks";

  const canonical = `${siteUrl}${loc.pathname.replace(/\/+$/, "")}`;

  const raw = posts[0]?.content_markdown || "";
  const desc = raw
    .replace(/[#*_`>]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 155);

  const load = async () => {
    const data = await getForumThread(threadId);
    setThread(data.thread);
    setPosts(data.posts);
  };

  useEffect(() => {
    load();
  }, [threadId]);

  const reportHref = `/report-issue?page_url=${encodeURIComponent(canonical)}`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Helmet>
        <title>{threadTitle}</title>
        <link rel="canonical" href={canonical} />
        <meta
          name="description"
          content={desc || "Read and reply to this Toon Ranks forum thread."}
        />
        <meta property="og:title" content={thread?.title || "Forum thread"} />
        <meta
          property="og:description"
          content={desc || "Join the discussion on Toon Ranks."}
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta
          property="og:image"
          content="https://toonranks.com/android-chrome-512x512.png"
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {thread && (
        <header className="mb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-2xl font-bold">
              {stripMdHeading(thread!.title)}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              {thread?.locked && (
                <span className={`${pillBase} ${pillAmber}`} title="Locked">
                  🔒 Locked
                </span>
              )}
              {thread?.latest_first && (
                <span
                  className={`${pillBase} ${pillIndigo}`}
                  title="Newest updates show first"
                >
                  🛈 Latest updates first
                </span>
              )}

              <Link
                to={reportHref}
                className={`${pillBase} ${pillRose}`}
                title="Report a bug or issue about this thread"
              >
                🐞 Report issue
              </Link>

              {isAdmin && (
                <div className={ctrlGroup}>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !thread!.locked;
                      try {
                        await lockForumThread(thread!.id, next);
                        setThread((t) => (t ? { ...t, locked: next } : t));
                      } catch (e) {
                        alert(
                          (e as { message?: string }).message ||
                            "Failed to toggle lock."
                        );
                      }
                    }}
                    className={`${ctrlBtn} ${
                      thread?.locked ? ctrlActiveAmber : ""
                    }`}
                    title={thread?.locked ? "Unlock thread" : "Lock thread"}
                  >
                    {thread?.locked ? "Unlock" : "Lock"}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const next = !thread!.latest_first;
                      try {
                        await updateForumThreadSettings(thread!.id, {
                          latest_first: next,
                        });
                        setThread((t) =>
                          t ? { ...t, latest_first: next } : t
                        );
                      } catch (e) {
                        alert(
                          (e as { message?: string }).message ||
                            "Failed to update ordering."
                        );
                      }
                    }}
                    className={`${ctrlBtn} ${
                      thread?.latest_first ? ctrlActiveIndigo : ""
                    }`}
                    title={
                      thread?.latest_first
                        ? "Show oldest first"
                        : "Show latest first"
                    }
                  >
                    {thread?.latest_first ? "Oldest first" : "Latest first"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {thread?.series_refs?.length ? (
            <div className="mt-2 flex flex-wrap gap-3">
              {thread.series_refs.map((s) => (
                <Link
                  key={s.series_id}
                  to={`/series/${s.series_id}`}
                  className="w-16 text-center"
                  title={s.title || `#${s.series_id}`}
                >
                  {s.cover_url ? (
                    <img
                      src={s.cover_url}
                      alt={s.title || `Series #${s.series_id}`}
                      className="w-16 h-24 object-cover rounded shadow"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gray-200 rounded" />
                  )}
                  <div className="text-[10px] mt-1 truncate">
                    {s.title || `#${s.series_id}`}
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </header>
      )}

      <section className="space-y-4">
        {posts[0] && (
          <article className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                Original post
              </span>
              <span>• {posts[0].author_username || "Anonymous"}</span>
              <span>• {new Date(posts[0].created_at).toLocaleString()}</span>
            </div>

            <MarkdownProse>{posts[0].content_markdown}</MarkdownProse>

            {(() => {
              const firstRefs: ForumSeriesRef[] =
                posts[0].series_refs && posts[0].series_refs.length > 0
                  ? posts[0].series_refs
                  : thread?.series_refs ?? [];

              return firstRefs.length ? (
                <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
                  {firstRefs.map((s) => (
                    <SeriesMiniCard key={s.series_id} s={s} />
                  ))}
                </div>
              ) : null;
            })()}
          </article>
        )}

        {(() => {
          const byParent: Record<number, ForumPost[]> = {};
          posts.slice(1).forEach((p) => {
            const pid = p.parent_id && p.parent_id > 0 ? p.parent_id : 0;
            (byParent[pid] ||= []).push(p);
          });

          const topLevel = (byParent[0] || []).sort((a, b) => {
            const ta = new Date(a.created_at).getTime();
            const tb = new Date(b.created_at).getTime();
            return thread?.latest_first ? tb - ta : ta - tb;
          });

          const reload = async () => {
            const data = await getForumThread(threadId);
            setThread(data.thread);
            setPosts(data.posts);
          };

          return (
            <>
              {topLevel.map((p, idx) => (
                <ReplyBranch
                  key={p.id}
                  post={p}
                  depth={0}
                  topIndex={idx + 1}
                  byParent={byParent}
                  threadId={threadId}
                  reload={reload}
                  isAdmin={isAdmin}
                  currentUsername={user?.username || null}
                  locked={!!thread?.locked}
                  isUpdatesMode={!!thread?.latest_first}
                />
              ))}
            </>
          );
        })()}
      </section>

      <div className="mt-6 border rounded-lg p-4">
        <h3 className="font-semibold mb-2">
          {thread?.latest_first ? "Add Update" : "Reply"}
        </h3>

        {!thread?.locked || isAdmin ? (
          <RichReplyEditor
            compact={false}
            onSubmit={async (content, seriesIds) => {
              if (!user) {
                alert("You need to be logged in to post a reply.");
                return;
              }
              const trimmed = content.trim();
              if (!trimmed) {
                alert("Reply cannot be empty.");
                return;
              }
              try {
                const p = await createForumPost(threadId, {
                  content_markdown: trimmed,
                  series_ids: seriesIds,
                });
                setPosts((prev) => [...prev, p]);
              } catch (err: unknown) {
                alert(getErrorMessage(err) || "Failed to post reply.");
              }
            }}
          />
        ) : (
          <div className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded">
            🔒 This thread is locked. Only admins can add new replies.
          </div>
        )}
      </div>
    </div>
  );
}

function ReplyBranch({
  post,
  depth,
  topIndex,
  byParent,
  threadId,
  reload,
  isAdmin,
  currentUsername,
  locked,
  isUpdatesMode,
}: {
  post: ForumPost;
  depth: number;
  topIndex: number;
  byParent: Record<number, ForumPost[]>;
  threadId: number;
  reload: () => Promise<void>;
  isAdmin: boolean;
  currentUsername: string | null;
  locked: boolean;
  isUpdatesMode: boolean;
}) {
  const railColors = [
    "#3b82f6",
    "#93c5fd",
    "#a5b4fc",
    "#c4b5fd",
    "#d8b4fe",
    "#f0abfc",
  ];

  function lightenHex(hex: string, amount = 0.35) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return hex;
    const toInt = (s: string) => parseInt(s, 16);
    const [, r, g, b] = m;
    const lr = Math.round(toInt(r) + (255 - toInt(r)) * amount);
    const lg = Math.round(toInt(g) + (255 - toInt(g)) * amount);
    const lb = Math.round(toInt(b) + (255 - toInt(b)) * amount);
    return `rgb(${lr}, ${lg}, ${lb})`;
  }

  const rail = railColors[Math.min(depth, railColors.length - 1)];
  const labelBg = lightenHex(rail, 0.73);

  const labelStyle: CSSProperties = {
    backgroundColor: labelBg,
    color: "#0f172a",
  };

  const isTopLevel = depth === 0;
  const indentPx = Math.min(depth, 6) * 16;
  const labelText = isTopLevel
    ? isUpdatesMode
      ? `Update #${topIndex}`
      : `Reply #${topIndex}`
    : isUpdatesMode
    ? `↳ Comment on Update #${topIndex}`
    : `↳ Reply to ${
        post.author_username ? `@${post.author_username} ` : ""
      }#${topIndex}`;

  const children = (byParent[post.id] || []).sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const canDelete =
    isAdmin ||
    (!!currentUsername && currentUsername === (post.author_username || null));

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!window.confirm("Delete this post (and its replies)?")) return;
    try {
      if (isAdmin) {
        await deleteForumPost(threadId, post.id);
      } else {
        await deleteMyForumPost(threadId, post.id);
      }
      await reload();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ||
        (err as Error)?.message ||
        "Failed to delete post.";
      alert(msg);
    }
  };

  return (
    <div>
      <article
        className={
          (isTopLevel
            ? "rounded-lg p-4 border border-gray-200 shadow-sm bg-gray-50"
            : "rounded-lg p-3 border border-gray-200 shadow-sm bg-white") + ""
        }
        style={{
          marginLeft: indentPx,
          marginTop: 6,
          borderLeftWidth: 4,
          borderLeftStyle: "solid",
          borderLeftColor: rail,
        }}
      >
        <div
          className={
            isTopLevel
              ? "flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2"
              : "flex flex-wrap items-center gap-2 text-[11px] text-gray-600 mb-1"
          }
        >
          <span
            className={
              isTopLevel
                ? "inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold"
                : "inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold"
            }
            style={labelStyle}
          >
            {labelText}
          </span>
          <span>• {post.author_username || "Anonymous"}</span>
          <span>• {new Date(post.created_at).toLocaleString()}</span>
        </div>

        <MarkdownProse size={isTopLevel ? "base" : "sm"}>
          {post.content_markdown}
        </MarkdownProse>

        {post.series_refs?.length ? (
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
            {post.series_refs.map((s) => (
              <SeriesMiniCard key={s.series_id} s={s} />
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-3">
          {!isUpdatesMode ? (
            !locked || isAdmin ? (
              <details>
                <summary className="cursor-pointer text-xs text-blue-600 hover:underline">
                  Reply to this reply
                </summary>
                <div className="mt-2">
                  <RichReplyEditor
                    compact
                    onSubmit={async (content, seriesIds) => {
                      if (!content.trim()) {
                        alert("Reply cannot be empty.");
                        return;
                      }
                      try {
                        await createForumPost(threadId, {
                          content_markdown: content.trim(),
                          series_ids: seriesIds,
                          parent_id: post.id,
                        });
                        await reload();
                      } catch (err: unknown) {
                        alert(getErrorMessage(err) || "Failed to post reply.");
                      }
                    }}
                  />
                </div>
              </details>
            ) : (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                🔒 Thread is locked — replies are disabled.
              </span>
            )
          ) : null}

          {canDelete && (
            <button
              onClick={handleDelete}
              className="text-xs text-red-600 hover:underline"
              title={isAdmin ? "Admin delete" : "Delete your post"}
            >
              Delete
            </button>
          )}
        </div>
      </article>

      {children.map((child) => (
        <ReplyBranch
          key={child.id}
          post={child}
          depth={depth + 1}
          topIndex={topIndex}
          byParent={byParent}
          threadId={threadId}
          reload={reload}
          isAdmin={isAdmin}
          currentUsername={currentUsername}
          locked={locked}
          isUpdatesMode={isUpdatesMode}
        />
      ))}
    </div>
  );
}

function SeriesMiniCard({ s }: { s: ForumSeriesRef }) {
  const statusClasses: Record<string, string> = {
    ONGOING: "bg-emerald-100 text-emerald-700",
    COMPLETE: "bg-slate-200 text-slate-800",
    HIATUS: "bg-amber-100 text-amber-800",
    UNKNOWN: "bg-gray-100 text-gray-700",
  };
  const statusKey = (s.status || "").toUpperCase();
  const statusClass = statusClasses[statusKey] || "bg-gray-100 text-gray-700";

  return (
    <Link
      to={`/series/${s.series_id}`}
      className="group border rounded-lg p-2 flex items-start gap-3 bg-white hover:shadow w-full"
      title={s.title || `#${s.series_id}`}
    >
      {s.cover_url ? (
        <img
          src={s.cover_url}
          alt={s.title || `Series #${s.series_id}`}
          className="w-12 h-16 object-cover rounded bg-gray-200 shrink-0"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-12 h-16 rounded bg-gray-200 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {s.title || `#${s.series_id}`}
        </div>

        <div className="mt-1 flex flex-wrap gap-1">
          {s.type && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
              {s.type}
            </span>
          )}
          {s.status && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${statusClass}`}
            >
              {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
