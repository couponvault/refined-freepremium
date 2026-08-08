"use client";

import { useState, type FormEvent } from "react";

const REASONS = [
  { value: "broken", label: "Broken / dead embed" },
  { value: "copyright", label: "Copyright" },
  { value: "illegal", label: "Illegal content" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
] as const;

export default function ReportVideo({ videoId }: { videoId: number }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          reason: String(fd.get("reason") ?? ""),
          details: String(fd.get("details") ?? ""),
          email: String(fd.get("email") ?? ""),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to report");
      }
      setStatus("ok");
    } catch (err) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Failed to report");
    }
  }

  const input =
    "mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent/50";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setStatus("idle");
          setError("");
        }}
        className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
      >
        Report video
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
          <div className="glass card-shadow w-full max-w-md rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Report video</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {status === "ok" ? (
              <p className="mt-4 text-sm text-green-400">
                Thanks — your report was submitted.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <label className="block text-sm">
                  Reason *
                  <select name="reason" required className={input} defaultValue="broken">
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Details
                  <textarea name="details" rows={3} className={input} />
                </label>
                <label className="block text-sm">
                  Email (optional)
                  <input name="email" type="email" className={input} />
                </label>
                {status === "err" && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {status === "loading" ? "Sending…" : "Submit report"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
