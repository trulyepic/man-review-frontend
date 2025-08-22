// src/pages/IssuesPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  listIssues,
  adminUpdateIssueStatus,
  adminDeleteIssue,
  type Issue,
  type IssueType,
  type IssueStatus,
} from "../api/manApi";
import { useUser } from "../login/useUser";
import { Link } from "react-router-dom";

const typeOptions: IssueType[] = ["BUG", "FEATURE", "CONTENT", "OTHER"];
const statusOptions: IssueStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "FIXED",
  "WONT_FIX",
];

const statusLabels: Record<IssueStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  FIXED: "Resolved",
  WONT_FIX: "Won’t Fix",
};

const badgeClasses: Record<IssueStatus, string> = {
  OPEN: "bg-yellow-100 text-yellow-800 border-yellow-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
  FIXED: "bg-green-100 text-green-800 border-green-300",
  WONT_FIX: "bg-gray-100 text-gray-700 border-gray-300",
};

function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

export default function IssuesPage() {
  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";

  const [items, setItems] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [type, setType] = useState<IssueType | "">("");
  const [status, setStatus] = useState<IssueStatus | "">("");

  // UI tab (quick filter by status)
  const [activeTab, setActiveTab] = useState<IssueStatus | "ALL">("ALL");

  const params = useMemo(
    () => ({
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      page: 1,
      page_size: 50,
    }),
    [q, type, status]
  );

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await listIssues(params);
      setItems(data);
    } catch (e: any) {
      setErrorMsg(
        e?.response?.data?.detail || e?.message || "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, params.type, params.status]);

  // derived counts
  const counts = useMemo(() => {
    const c: Record<IssueStatus, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      FIXED: 0,
      WONT_FIX: 0,
    };
    for (const it of items) c[it.status]++;
    return c;
  }, [items]);

  const filteredByTab = useMemo(() => {
    if (activeTab === "ALL") return items;
    return items.filter((it) => it.status === activeTab);
  }, [items, activeTab]);

  const onChangeStatus = async (id: number, next: IssueStatus) => {
    if (!isAdmin) return;
    // optimistic update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: next } : it))
    );
    try {
      await adminUpdateIssueStatus(id, next);
    } catch (e: any) {
      setErrorMsg(
        e?.response?.data?.detail || e?.message || "Failed to update status"
      );
      // revert on error
      await fetchData();
    }
  };

  const onDelete = async (id: number) => {
    if (!isAdmin) return;
    const yes = confirm(
      "Delete this report? This will also delete its screenshot (if any)."
    );
    if (!yes) return;
    // optimistic remove
    const snapshot = items;
    setItems((prev) => prev.filter((it) => it.id !== id));
    try {
      await adminDeleteIssue(id);
    } catch (e: any) {
      setErrorMsg(
        e?.response?.data?.detail || e?.message || "Failed to delete report"
      );
      setItems(snapshot);
    }
  };

  // function isUsefulPageUrl(raw?: string | null): boolean {
  //   if (!raw) return false;
  //   try {
  //     const u = new URL(raw);
  //     // hide links that point to the report page itself
  //     return !u.pathname.startsWith("/report-issue");
  //   } catch {
  //     // not a valid absolute URL; treat as not useful
  //     return false;
  //   }
  // }

  // function prettyPageUrl(raw: string): string {
  //   try {
  //     const u = new URL(raw);
  //     // show a concise label: path + query (omit domain)
  //     return u.pathname + (u.search ? u.search : "");
  //   } catch {
  //     return raw;
  //   }
  // }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl md:text-3xl font-bold">
          Site Updates & Known Issues
        </h1>
        <Link
          to="/report-issue"
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700"
        >
          Report an Issue
        </Link>
      </div>
      <p className="text-gray-600 mb-6">
        Track what we’re working on and what’s been fixed.{" "}
        {isAdmin ? "Admins can update status or delete items below." : ""}
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Open" value={counts.OPEN} />
        <SummaryCard label="In Progress" value={counts.IN_PROGRESS} />
        <SummaryCard label="Resolved" value={counts.FIXED} />
        <SummaryCard label="Won’t Fix" value={counts.WONT_FIX} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Tab
          label="All"
          active={activeTab === "ALL"}
          onClick={() => setActiveTab("ALL")}
        />
        {statusOptions.map((s) => (
          <Tab
            key={s}
            label={statusLabels[s]}
            active={activeTab === s}
            onClick={() => setActiveTab(s)}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          className="rounded border border-gray-300 px-3 py-2"
          placeholder="Search title/description…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded border border-gray-300 px-3 py-2"
          value={type}
          onChange={(e) => setType((e.target.value || "") as IssueType | "")}
        >
          <option value="">All types</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-gray-300 px-3 py-2"
          value={status}
          onChange={(e) =>
            setStatus((e.target.value || "") as IssueStatus | "")
          }
        >
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <button
          onClick={fetchData}
          className="rounded-md border border-gray-300 px-3 py-2 font-medium hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-800">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-600">Loading…</div>
      ) : filteredByTab.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Reported</th>
                {/* <th className="px-3 py-2 text-left">Page</th> */}
                <th className="px-3 py-2 text-left">Screenshot</th>
                {isAdmin && <th className="px-3 py-2 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredByTab.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="font-semibold">{it.title}</div>
                    <div className="text-gray-600 line-clamp-2">
                      {it.description}
                    </div>
                  </td>
                  <td className="px-3 py-2">{it.type}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={it.status} />
                  </td>
                  <td className="px-3 py-2">
                    {new Date(it.created_at).toLocaleString()}
                  </td>
                  {/* <td className="px-3 py-2 max-w-[260px]">
                    {isUsefulPageUrl(it.page_url) ? (
                      <a
                        className="text-blue-600 hover:underline break-all"
                        href={it.page_url as string}
                        target="_blank"
                        rel="noreferrer"
                        title={it.page_url as string}
                      >
                        {prettyPageUrl(it.page_url as string)}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td> */}

                  <td className="px-3 py-2">
                    {it.screenshot_url ? (
                      <a
                        className="text-blue-600 hover:underline"
                        href={it.screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {isAdmin && (
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          className="rounded border border-gray-300 px-2 py-1"
                          value={it.status}
                          onChange={(e) =>
                            onChangeStatus(it.id, e.target.value as IssueStatus)
                          }
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {statusLabels[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => onDelete(it.id)}
                          className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-full px-3 py-1.5 text-sm font-semibold border transition ${
        active
          ? "bg-blue-600 text-white border-blue-600 shadow"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="text-lg font-semibold mb-1">No matching reports</div>
      <div className="text-gray-600 mb-4">
        Try adjusting the filters or{" "}
        <Link to="/report-issue" className="text-blue-600 hover:underline">
          report a new issue
        </Link>
        .
      </div>
      <div className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm text-gray-700">
        Tip: You can filter by type, status, or search the description/title.
      </div>
    </div>
  );
}
