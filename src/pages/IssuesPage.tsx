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
const statusOptions: IssueStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];

const badgeClasses: Record<IssueStatus, string> = {
  OPEN: "bg-yellow-100 text-yellow-800 border-yellow-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
  RESOLVED: "bg-green-100 text-green-800 border-green-300",
};

function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClasses[status]}`}
    >
      {status.replace("_", " ")}
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
      setErrorMsg(e?.response?.data?.detail || e?.message || "Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, params.type, params.status]);

  const onChangeStatus = async (id: number, next: IssueStatus) => {
    if (!isAdmin) return;
    // optimistic update
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: next } : it)));
    try {
      await adminUpdateIssueStatus(id, next);
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail || e?.message || "Failed to update status");
      // revert on error
      await fetchData();
    }
  };

  const onDelete = async (id: number) => {
    if (!isAdmin) return;
    const yes = confirm("Delete this issue? This will also delete its screenshot if any.");
    if (!yes) return;
    // optimistic remove
    const snapshot = items;
    setItems((prev) => prev.filter((it) => it.id !== id));
    try {
      await adminDeleteIssue(id);
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail || e?.message || "Failed to delete issue");
      setItems(snapshot);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Issues</h1>
        <Link
          to="/report-issue"
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700"
        >
          Report an Issue
        </Link>
      </div>

      <p className="text-gray-600 mb-6">
        View known issues and their status. {isAdmin ? "You can update status or delete items below." : ""}
      </p>

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
          onChange={(e) => setStatus((e.target.value || "") as IssueStatus | "")}
        >
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
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
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-gray-600">No issues found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Reported</th>
                <th className="px-3 py-2 text-left">Page</th>
                <th className="px-3 py-2 text-left">Screenshot</th>
                {isAdmin && <th className="px-3 py-2 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="font-semibold">{it.title}</div>
                    <div className="text-gray-600 line-clamp-2">{it.description}</div>
                  </td>
                  <td className="px-3 py-2">{it.type}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={it.status} />
                  </td>
                  <td className="px-3 py-2">
                    {new Date(it.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 max-w-[220px]">
                    {it.page_url ? (
                      <a
                        className="text-blue-600 hover:underline break-all"
                        href={it.page_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {it.page_url}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
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
                              {s.replace("_", " ")}
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
