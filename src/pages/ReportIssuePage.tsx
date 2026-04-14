import { useState } from "react";
import { reportIssue, type IssueType } from "../api/manApi";

const types: { label: string; value: IssueType }[] = [
  { label: "Bug", value: "BUG" },
  { label: "Feature Request", value: "FEATURE" },
  { label: "Content Issue (wrong info, typo)", value: "CONTENT" },
  { label: "Other", value: "OTHER" },
];

const ReportIssuePage = () => {
  const [type, setType] = useState<IssueType>("BUG");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [screenshot, setScreenshot] = useState<File | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const pageUrlDefault =
    typeof window !== "undefined" ? window.location.href : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && !isValidEmail(email.trim())) {
      setErrorMsg(
        "Please enter a valid email address or leave the field blank."
      );
      return;
    }
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await reportIssue({
        type,
        title: title.trim(),
        description: description.trim(),
        page_url: pageUrlDefault,
        email: email.trim() || undefined,
        screenshot,
      });
      setSuccessMsg("Thanks! Your report has been submitted.");
      setTitle("");
      setDescription("");
      setEmail("");
      setScreenshot(undefined);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      let detail = "Failed to submit the report.";

      if (typeof err === "string") detail = err;
      else if (err instanceof Error) detail = err.message;
      else if (typeof err === "object" && err !== null) {
        const maybe = err as {
          message?: string;
          response?: { data?: { detail?: string } };
        };
        detail = maybe.response?.data?.detail || maybe.message || detail;
      }

      setErrorMsg(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dark-theme-shell mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-stone-50 md:text-3xl">
        Report an Issue
      </h1>
      <p className="mb-6 text-slate-600 dark:text-stone-300">
        Spotted a bug or something off? Let us know so we can fix it.
      </p>

      {successMsg && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-green-800 dark:border-green-800/70 dark:bg-green-950/30 dark:text-green-200">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-800 dark:border-red-800/70 dark:bg-red-950/30 dark:text-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-stone-200">
            Issue Type
          </label>
          <select
            className="dark-theme-field w-full rounded border border-gray-300 px-3 py-2 text-slate-900 dark:border-[#3a3028] dark:text-stone-100"
            value={type}
            onChange={(e) => setType(e.target.value as IssueType)}
          >
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-stone-200">
            Title
          </label>
          <input
            className="dark-theme-field w-full rounded border border-gray-300 px-3 py-2 text-slate-900 dark:border-[#3a3028] dark:text-stone-100 dark:placeholder:text-stone-500"
            placeholder="Short summary (e.g., 'Category page throws error')"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-stone-200">
            Description
          </label>
          <textarea
            className="dark-theme-field min-h-[120px] w-full rounded border border-gray-300 px-3 py-2 text-slate-900 dark:border-[#3a3028] dark:text-stone-100 dark:placeholder:text-stone-500"
            placeholder="What happened? Steps to reproduce? What did you expect to happen?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-stone-400">
            Tip: Include steps, the page you were on, and any error messages.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-stone-200">
            Email (optional)
          </label>
          <input
            type="email"
            className="dark-theme-field w-full rounded border border-gray-300 px-3 py-2 text-slate-900 dark:border-[#3a3028] dark:text-stone-100 dark:placeholder:text-stone-500"
            placeholder="you@example.com (only if you want follow-up)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-stone-200">
            Screenshot (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshot(e.target.files?.[0])}
            className="block w-full text-sm text-gray-700 dark:text-stone-300 file:mr-4 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-gray-50 dark:file:border-[#3a3028] dark:file:bg-[#18120f] dark:hover:file:bg-[#241d19]"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-stone-400">
            A screenshot often helps us fix things faster.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
};

export default ReportIssuePage;
