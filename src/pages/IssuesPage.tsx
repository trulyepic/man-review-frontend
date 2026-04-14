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
import { ConfirmModal } from "../components/ConfirmModal";

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
  WONT_FIX: "Won't Fix",
};

const badgeClasses: Record<IssueStatus, string> = {
  OPEN: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-200 dark:border-yellow-800/70",
  IN_PROGRESS:
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-800/70",
  FIXED:
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-200 dark:border-green-800/70",
  WONT_FIX:
    "bg-gray-100 text-gray-700 border-gray-300 dark:bg-[#241d19] dark:text-stone-300 dark:border-[#3a3028]",
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
  const [q, setQ] = useState("");
  const [type, setType] = useState<IssueType | "">("");
  const [status, setStatus] = useState<IssueStatus | "">("");
  const [activeTab, setActiveTab] = useState<IssueStatus | "ALL">("ALL");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

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
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: next } : it))
    );
    try {
      await adminUpdateIssueStatus(id, next);
    } catch (e: any) {
      setErrorMsg(
        e?.response?.data?.detail || e?.message || "Failed to update status"
      );
      await fetchData();
    }
  };

  const onDelete = async (id: number) => {
    if (!isAdmin) return;
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId == null) return;
    const snapshot = items;
    setItems((prev) => prev.filter((it) => it.id !== confirmDeleteId));
    try {
      await adminDeleteIssue(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch (e: any) {
      setErrorMsg(
        e?.response?.data?.detail || e?.message || "Failed to delete report"
      );
      setItems(snapshot);
    }
  };

  return (
    <div className="dark-theme-shell mx-auto max-w-6xl px-4 py-8">
      <div className="mb-1 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-stone-50 md:text-3xl">
          Site Updates & Known Issues
        </h1>
        <Link
          to="/report-issue"
          className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-700"
        >
          Report an Issue
        </Link>
      </div>
      <p className="mb-6 text-slate-600 dark:text-stone-300">
        Track what we're working on and what's been fixed.{" "}
        {isAdmin ? "Admins can update status or delete items below." : ""}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Open" value={counts.OPEN} />
        <SummaryCard label="In Progress" value={counts.IN_PROGRESS} />
        <SummaryCard label="Resolved" value={counts.FIXED} />
        <SummaryCard label="Won't Fix" value={counts.WONT_FIX} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Tab label="All" active={activeTab === "ALL"} onClick={() => setActiveTab("ALL")} />
        {statusOptions.map((s) => (
          <Tab
            key={s}
            label={statusLabels[s]}
            active={activeTab === s}
            onClick={() => setActiveTab(s)}
          />
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          className="dark-theme-field rounded border border-gray-300 px-3 py-2 text-slate-900 dark:border-[#3a3028] dark:text-stone-100 dark:placeholder:text-stone-500"
          placeholder="Search title/description..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="dark-theme-field rounded border border-gray-300 px-3 py-2 text-slate-900 dark:border-[#3a3028] dark:text-stone-100"
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
          className="dark-theme-field rounded border border-gray-300 px-3 py-2 text-slate-900 dark:border-[#3a3028] dark:text-stone-100"
          value={status}
          onChange={(e) => setStatus((e.target.value || "") as IssueStatus | "")}
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
          className="rounded-md border border-gray-300 px-3 py-2 font-medium hover:bg-gray-50 dark:border-[#3a3028] dark:text-stone-200 dark:hover:bg-[#241d19]"
        >
          Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-800 dark:border-red-800/70 dark:bg-red-950/30 dark:text-red-200">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-600 dark:text-stone-400">Loading...</div>
      ) : filteredByTab.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#3a3028]">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-[#18120f] dark:text-stone-300">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Reported</th>
                <th className="px-3 py-2 text-left">Screenshot</th>
                {isAdmin && <th className="px-3 py-2 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#3a3028]">
              {filteredByTab.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50 dark:hover:bg-[#201915]">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-slate-900 dark:text-stone-100">{it.title}</div>
                    <div className="line-clamp-2 text-slate-600 dark:text-stone-400">
                      {it.description}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-stone-300">{it.type}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={it.status} />
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-stone-300">
                    {new Date(it.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    {it.screenshot_url ? (
                      <a
                        className="text-blue-600 hover:underline dark:text-blue-300"
                        href={it.screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400 dark:text-stone-500">-</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          className="dark-theme-field rounded border border-gray-300 px-2 py-1 text-slate-900 dark:border-[#3a3028] dark:text-stone-100"
                          value={it.status}
                          onChange={(e) => onChangeStatus(it.id, e.target.value as IssueStatus)}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {statusLabels[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => onDelete(it.id)}
                          className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-red-700 hover:bg-red-100 dark:border-red-800/70 dark:bg-red-950/20 dark:text-red-200 dark:hover:bg-red-950/35"
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

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Delete issue?"
        message="This will permanently remove the report and any associated screenshot."
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="dark-theme-card rounded-lg border border-slate-200 p-4 shadow-sm dark:border-[#3a3028]">
      <div className="text-sm text-gray-500 dark:text-stone-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-stone-50">{value}</div>
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
      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
        active
          ? "border-blue-600 bg-blue-600 text-white shadow"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#3a3028] dark:bg-[#18120f] dark:text-stone-200 dark:hover:bg-[#241d19]"
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
      <div className="mb-1 text-lg font-semibold text-slate-900 dark:text-stone-50">
        No matching reports
      </div>
      <div className="mb-4 text-slate-600 dark:text-stone-400">
        Try adjusting the filters or{" "}
        <Link to="/report-issue" className="text-blue-600 hover:underline dark:text-blue-300">
          report a new issue
        </Link>
        .
      </div>
      <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-[#3a3028] dark:text-stone-300">
        Tip: You can filter by type, status, or search the description/title.
      </div>
    </div>
  );
}
