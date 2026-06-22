import { useEffect, useRef, useState } from "react";
import { useSynthesizeTrack, useUpsertMyHistory } from "@workspace/api-client-react";
import { Play, Pause, SkipBack, SkipForward, Repeat } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PlayerProps {
  chapterId: number;
  scriptureId: number;
  language: string;
  voice: string;
  accentColor?: string;
  title: string;
  subtitle: string;
  /** Full chapter text shown as a synchronized transcript below the player. */
  transcript?: string;
  /**
   * Called when the current track ends. Returning true tells the player a
   * next chapter was queued and to keep `isPlaying` true through the swap.
   */
  onTrackEnded?: () => boolean | void;
  /** Whether the player should auto-play newly loaded tracks (used during continuous recitation). */
  autoPlay?: boolean;
}

export function AudioPlayer({
  chapterId,
  scriptureId: _scriptureId,
  language,
  voice,
  accentColor = "hsl(var(--primary))",
  title,
  subtitle,
  transcript,
  onTrackEnded,
  autoPlay = false,
}: PlayerProps) {
  void _scriptureId;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [continuous, setContinuous] = useState<boolean>(autoPlay);
  const lastHistoryWriteRef = useRef<number>(0);
  // Tracks whether the *next* trackUrl load should resume playback immediately
  // (set when a chapter ends and a successor is queued, or when the user has
  // continuous recitation enabled and changes chapter manually).
  const playOnLoadRef = useRef<boolean>(false);

  const synthesize = useSynthesizeTrack();
  const upsertHistory = useUpsertMyHistory();

  const writeHistory = (completed: boolean) => {
    const a = audioRef.current;
    if (!a || !chapterId) return;
    upsertHistory.mutate({
      data: {
        chapterId,
        positionSeconds: Math.floor(a.currentTime),
        completed,
      },
    });
    lastHistoryWriteRef.current = Date.now();
  };

  // Load track when dependencies change
  useEffect(() => {
    setTrackUrl(null);
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    if (!chapterId || !language || !voice) return;

    synthesize.mutate(
      { data: { chapterId, language, voice } },
      {
        onSuccess: (track) => {
          setTrackUrl(track.audioUrl);
        },
      },
    );
    // We intentionally do not reset isPlaying here — when a previous chapter
    // ended and queued a successor, we want playback to continue seamlessly.
  }, [chapterId, language, voice]);

  useEffect(() => {
    if (trackUrl && audioRef.current) {
      audioRef.current.src = trackUrl;
      if (playOnLoadRef.current) {
        playOnLoadRef.current = false;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [trackUrl]);

  // Keep the continuous toggle in sync with the prop if parent changes it.
  useEffect(() => {
    setContinuous(autoPlay);
  }, [autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current || !trackUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      writeHistory(false);
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    if (Date.now() - lastHistoryWriteRef.current >= 10_000) {
      writeHistory(false);
    }
  };

  const handleEnded = () => {
    writeHistory(true);
    if (continuous && onTrackEnded) {
      // Tell the player the next track should auto-play once it loads.
      playOnLoadRef.current = true;
      const advanced = onTrackEnded();
      if (advanced) {
        // Keep visual play state; the load effect will swap src + autoplay.
        return;
      }
      // No next chapter; fall through to stop.
      playOnLoadRef.current = false;
    }
    setIsPlaying(false);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (val: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val[0];
      setProgress(val[0]);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-card border border-primary/10 rounded-2xl p-6 relative overflow-hidden">
      {/* Decorative Glow */}
      <div
        aria-hidden="true"
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[50px] opacity-20 pointer-events-none motion-reduce:hidden"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex flex-col gap-6 relative z-10">
        <div className="text-center">
          <h3 className="font-display text-xl text-secondary mb-1">{title}</h3>
          <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
            {subtitle}
          </p>
        </div>

        {/* Polite live announcement of which chapter is now playing. */}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {synthesize.isPending
            ? `Loading ${title}, ${subtitle}`
            : isPlaying
              ? `Now playing: ${title}, ${subtitle}`
              : `Ready: ${title}, ${subtitle}`}
        </p>

        {synthesize.isPending ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <Skeleton className="h-12 w-full bg-primary/5 rounded-lg" />
            <Skeleton className="h-4 w-3/4 bg-primary/5 rounded-full" />
          </div>
        ) : (
          <>
            {/* Waveform Visualization (CSS animated) — decorative only. */}
            <div
              aria-hidden="true"
              className="flex items-center justify-center gap-1 h-12 motion-reduce:hidden"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlaying ? "animate-pulse" : ""
                  }`}
                  style={{
                    backgroundColor: accentColor,
                    height: isPlaying ? `${Math.random() * 100}%` : "20%",
                    opacity: isPlaying ? 0.8 : 0.3,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
            {/* Reduced-motion-safe alternative: a static bar that still reads
                 as "audio is playing" without animation. */}
            <div
              aria-hidden="true"
              className="hidden motion-reduce:flex items-center justify-center h-12"
            >
              <div
                className="h-1 w-full max-w-[240px] rounded-full"
                style={{
                  backgroundColor: accentColor,
                  opacity: isPlaying ? 0.7 : 0.25,
                }}
              />
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <Slider
                value={[progress]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                aria-label="Playback position"
                aria-valuetext={`${formatTime(progress)} of ${formatTime(duration)}`}
                className="[&_[role=slider]]:bg-secondary [&_[role=slider]]:border-none [&_[role=slider]]:w-3 [&_[role=slider]]:h-3"
              />
              <div className="flex justify-between text-xs font-sans text-muted-foreground">
                <span aria-label={`Elapsed ${formatTime(progress)}`}>
                  {formatTime(progress)}
                </span>
                <span aria-label={`Total ${formatTime(duration)}`}>
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-secondary rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                disabled={!trackUrl}
                onClick={() => handleSeek([Math.max(0, progress - 15)])}
                aria-label="Skip back 15 seconds"
                title="Back 15s"
              >
                <SkipBack className="w-6 h-6" aria-hidden="true" />
              </Button>
              <Button
                onClick={togglePlay}
                disabled={!trackUrl}
                aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
                aria-pressed={isPlaying}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-card hover:scale-105 transition-transform shadow-[0_0_30px_rgba(201,147,58,0.3)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-reduce:hover:scale-100 motion-reduce:transition-none"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" aria-hidden="true" />
                ) : (
                  <Play className="w-8 h-8 ml-1" aria-hidden="true" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-secondary rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                disabled={!trackUrl || (duration > 0 && progress >= duration)}
                onClick={() =>
                  handleSeek([Math.min(duration || progress + 15, progress + 15)])
                }
                aria-label="Skip forward 15 seconds"
                title="Forward 15s"
              >
                <SkipForward className="w-6 h-6" aria-hidden="true" />
              </Button>
            </div>

            {/* Continuous recitation toggle */}
            {onTrackEnded ? (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setContinuous((v) => !v)}
                  aria-pressed={continuous}
                  className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-widest font-sans px-3 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                    continuous
                      ? "border-secondary/60 text-secondary bg-secondary/10"
                      : "border-primary/20 text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="button-continuous-toggle"
                >
                  <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
                  Continuous recitation {continuous ? "on" : "off"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
        className="hidden"
      >
        <track kind="captions" srcLang="en" label="Transcript" />
      </audio>

      {/* Visual transcript — the canonical text being recited, shown in the
           original language for accessibility (screen-reader-friendly,
           respects users who prefer reading along). */}
      {transcript ? (
        <section
          aria-label={`Transcript of ${title}, ${subtitle}`}
          className="relative z-10 mt-6 pt-6 border-t border-primary/10"
        >
          <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Transcript
          </h4>
          <div className="font-serif text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line max-h-80 overflow-y-auto pr-2">
            {transcript}
          </div>
        </section>
      ) : null}
    </div>
  );
}
