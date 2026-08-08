"use client";

import { useState } from "react";

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const eu = encodeURIComponent(url);
  const et = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const cls =
    "flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground hover:border-accent/40 hover:bg-surface-hover";

  const links = [
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${eu}&text=${et}`,
      icon: <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L2.8 2h6.4l4.4 5.9L18.9 2Zm-1.1 18h1.7L7.1 3.7H5.3L17.8 20Z" />,
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${eu}`,
      icon: <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />,
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${et}%20${eu}`,
      icon: <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.2 1.3-2 1.4-.5.1-1.2.2-3.6-.8-3-1.2-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.8 1.4 1.8 2.2 1.2 1.1 2.3 1.4 2.6 1.6.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.1.1.5 0 1Z" />,
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${eu}&text=${et}`,
      icon: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.9 6.9-1.7 7.8c-.1.6-.5.7-1 .4l-2.6-1.9-1.2 1.2c-.2.2-.3.3-.5.3l.2-2.7 5-4.5c.2-.2 0-.3-.3-.1l-6.2 3.9-2.6-.8c-.6-.2-.6-.6.1-.9l10-3.9c.5-.2.9.1.8 1.2Z" />,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={copy} className={cls}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        {copied ? "Copied!" : "Copy link"}
      </button>
      {links.map((l) => (
        <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            {l.icon}
          </svg>
          {l.name}
        </a>
      ))}
    </div>
  );
}
