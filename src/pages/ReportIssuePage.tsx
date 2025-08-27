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
      // Optionally scroll to top to show the success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      let detail = "Failed to submit the report.";

      if (typeof err === "string") {
        detail = err;
      } else if (err instanceof Error) {
        detail = err.message;
      } else if (typeof err === "object" && err !== null) {
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
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Report an Issue</h1>
      <p className="text-gray-600 mb-6">
        Spotted a bug or something off? Let us know so we can fix it.
      </p>

      {successMsg && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-green-800">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-800">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Issue Type</label>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2"
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
          <label className="block text-sm font-semibold mb-1">Title</label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Short summary (e.g., 'Category page throws error')"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Description
          </label>
          <textarea
            className="w-full rounded border border-gray-300 px-3 py-2 min-h-[120px]"
            placeholder="What happened? Steps to reproduce? What did you expect to happen?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Tip: Include steps, the page you were on, and any error messages.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Email (optional)
          </label>
          <input
            type="email"
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="you@example.com (only if you want follow-up)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Screenshot (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshot(e.target.files?.[0])}
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
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
