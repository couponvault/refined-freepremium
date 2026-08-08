"use client";

import { useState, type FormEvent } from "react";

export default function DmcaForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("loading");
    setError("");
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      url: String(fd.get("url") ?? ""),
      company: String(fd.get("company") ?? ""),
      details: String(fd.get("details") ?? ""),
    };
    try {
      const res = await fetch("/api/dmca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Submission failed");
      }
      form.reset();
      setStatus("ok");
    } catch (err) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  }

  const input =
    "mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent/50";

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <label className="block text-sm">
        Full name *
        <input name="name" required className={input} />
      </label>
      <label className="block text-sm">
        Email *
        <input name="email" type="email" required className={input} />
      </label>
      <label className="block text-sm">
        Infringing URL *
        <input name="url" type="url" required placeholder="https://" className={input} />
      </label>
      <label className="block text-sm">
        Company / organization
        <input name="company" className={input} />
      </label>
      <label className="block text-sm">
        Details *
        <textarea name="details" required rows={5} className={input} />
      </label>
      {status === "ok" && (
        <p className="text-sm text-green-400">Notice submitted. We will review it shortly.</p>
      )}
      {status === "err" && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Submit DMCA notice"}
      </button>
    </form>
  );
}
