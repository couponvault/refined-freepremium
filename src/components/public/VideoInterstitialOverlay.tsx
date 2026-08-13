"use client";

import { useEffect, useState } from "react";
import AdSlot from "./AdSlot";

interface Props {
  seconds?: number;
  enabled?: boolean;
  headerAd?: string | null;
  sidebarAd?: string | null;
  demoMode?: boolean;
  children: React.ReactNode;
}

export default function VideoInterstitialOverlay({
  seconds = 5,
  enabled = true,
  headerAd,
  sidebarAd,
  demoMode,
  children,
}: Props) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [completed, setCompleted] = useState(!enabled);

  useEffect(() => {
    if (!enabled || completed) return;

    setTimeLeft(seconds);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, seconds]);

  if (completed) {
    return <>{children}</>;
  }

  const progressPct = Math.round(((seconds - timeLeft) / seconds) * 100);

  return (
    <div className="relative my-2 overflow-hidden rounded-2xl border border-border/80 bg-surface/90 p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
      {/* Top Ad Slot above timer */}
      {headerAd || demoMode ? (
        <div className="mb-4">
          <AdSlot slot="header" html={headerAd} demoMode={demoMode} />
        </div>
      ) : null}

      {/* Center 5-Second Timer Card */}
      <div className="mx-auto my-4 flex max-w-md flex-col items-center justify-center rounded-2xl border border-accent/40 bg-background/95 p-6 text-center shadow-2xl backdrop-blur-md">
        <div className="relative mb-4 flex h-20 w-20 items-center justify-center">
          <svg className="h-full w-full -rotate-90 text-accent" viewBox="0 0 36 36">
            <path
              className="text-surface-hover"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-accent transition-all duration-1000 ease-linear"
              strokeDasharray={`${progressPct}, 100`}
              strokeWidth="3"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute font-display text-2xl font-black text-foreground">
            {timeLeft}s
          </span>
        </div>

        <h3 className="font-display text-lg font-extrabold tracking-tight text-foreground">
          Loading your video...
        </h3>
        <p className="mt-1 text-xs text-muted">
          Please wait {timeLeft} second{timeLeft === 1 ? "" : "s"} while we prepare high quality stream
        </p>

        {/* Progress Bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-hover">
          <div
            className="h-full bg-gradient-to-r from-accent via-accent-hover to-gold transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <button
          type="button"
          onClick={() => setCompleted(true)}
          className="glow mt-5 rounded-xl bg-accent px-6 py-2.5 text-xs font-bold text-white transition-all hover:scale-105 hover:bg-accent-hover"
        >
          {timeLeft > 0 ? "Skip & Watch Video →" : "Continue to Video →"}
        </button>
      </div>

      {/* Bottom Ad Slot below timer */}
      {sidebarAd || demoMode ? (
        <div className="mt-4">
          <AdSlot slot="sidebar" html={sidebarAd} demoMode={demoMode} />
        </div>
      ) : null}
    </div>
  );
}
