"use client";

import { useEffect, useRef, useState } from "react";

interface CourseVideoPlayerProps {
  videoUrl: string;
  title: string;
  isEnrolled: boolean;
  isFree?: boolean;
  initialPosition?: number;
  onPlayStart?: () => void;
  onProgress?: (data: {
    currentTime: number;
    duration: number;
  }) => void;
  onLoad?: (duration: number) => void;
  onEnd?: () => void;
  onError?: () => void;
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/i,
    /youtu\.be\/([^?]+)/i,
    /youtube\.com\/embed\/([^/?]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}?rel=0`;
    }
  }

  return null;
}

export default function CourseVideoPlayer({
  videoUrl,
  title,
  isEnrolled,
  isFree = false,
  initialPosition = 0,
  onPlayStart,
  onProgress,
  onLoad,
  onEnd,
  onError,
}: CourseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playStartedRef = useRef(false);
  const seekAppliedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const youtubeUrl = getYouTubeEmbedUrl(videoUrl);

  useEffect(() => {
    playStartedRef.current = false;
    seekAppliedRef.current = false;
    setLoading(true);
    setFailed(false);
  }, [videoUrl]);

  if (!isEnrolled && !isFree) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-4xl">🔒</div>
          <p className="mt-3 text-sm font-semibold text-white">
            Enrol to access this lecture
          </p>
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black text-white/50">
        No video source available.
      </div>
    );
  }

  if (youtubeUrl) {
    return (
      <div className="aspect-video overflow-hidden bg-black">
        <iframe
          src={youtubeUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center bg-black px-6 text-center">
        <div className="text-3xl">⚠️</div>
        <p className="mt-2 font-semibold text-white">Video unavailable</p>
        <p className="mt-1 text-sm text-white/50">
          Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setLoading(true);
            playStartedRef.current = false;
            seekAppliedRef.current = false;
            const video = videoRef.current;
            if (video) {
              video.load();
            }
          }}
          className="mt-4 rounded-lg bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden bg-black">
      <video
        ref={videoRef}
        key={videoUrl}
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          setLoading(false);

          const duration = Number.isFinite(video.duration)
            ? video.duration
            : 0;

          onLoad?.(duration);

          if (
            !seekAppliedRef.current &&
            initialPosition > 0 &&
            initialPosition < Math.max(duration - 1, 0)
          ) {
            try {
              video.currentTime = initialPosition;
            } catch {
              // Browser may reject seeking before enough media is buffered.
            }
          }

          seekAppliedRef.current = true;
        }}
        onCanPlay={() => setLoading(false)}
        onPlay={() => {
          if (!playStartedRef.current) {
            playStartedRef.current = true;
            onPlayStart?.();
          }
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          const currentTime = Number(video.currentTime) || 0;
          const duration = Number(video.duration) || 0;

          onProgress?.({
            currentTime,
            duration,
          });
        }}
        onEnded={() => {
          onEnd?.();
        }}
        onError={() => {
          setLoading(false);
          setFailed(true);
          onError?.();
        }}
      />

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-violet-400" />
        </div>
      )}
    </div>
  );
}