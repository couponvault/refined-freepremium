"use client";

import { useState } from "react";
import EmbedPlayer from "./EmbedPlayer";
import ExclusiveUnlock from "./ExclusiveUnlock";
import StickyMiniPlayer from "./StickyMiniPlayer";
import AutoplayNext, { type NextVideo } from "./AutoplayNext";
import { pushContinue } from "./ContinueRow";
import ViewBeacon from "./ViewBeacon";

export default function VideoWatchClient({
  slug,
  title,
  thumbnail,
  embedUrl,
  exclusive,
  durationSec = 0,
  next = null,
}: {
  slug: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
  exclusive: boolean;
  durationSec?: number;
  next?: NextVideo | null;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div>
      <ViewBeacon slug={slug} />
      <StickyMiniPlayer slug={slug} title={title} thumbnail={thumbnail}>
        <ExclusiveUnlock
          exclusive={exclusive}
          thumbnail={thumbnail}
          title={title}
        >
          <EmbedPlayer
            fill
            embedUrl={embedUrl}
            thumbnail={thumbnail}
            title={title}
            onPlay={() => {
              setPlaying(true);
              pushContinue({ slug, title, thumbnail });
            }}
          />
        </ExclusiveUnlock>
      </StickyMiniPlayer>
      <AutoplayNext next={next} durationSec={durationSec} playing={playing} />
    </div>
  );
}
