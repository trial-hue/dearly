'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * The message, revealed word by word while narration plays: evenly across the audio duration for
 * a recording, on word boundaries for the built-in voice (2.5 words a second where the browser
 * fires none).
 */
export function Narration({
  text,
  audioUrl,
  timings,
  className,
}: {
  text: string;
  audioUrl: string | null;
  timings: number[];
  className?: string;
}) {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const [shown, setShown] = useState(words.length);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    const t = timer;
    return () => {
      if (t.current) clearInterval(t.current);
    };
  }, []);

  const revealEvenly = (durationSec: number) => {
    setShown(0);
    const per = Math.max(120, (durationSec * 1000) / Math.max(1, words.length));
    let i = 0;
    stopTimer();
    timer.current = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= words.length) stopTimer();
    }, per);
  };

  const playAudio = () => {
    const el = audioRef.current;
    if (!el) return;
    setPlaying(true);
    const start = () => {
      if (timings.length >= words.length) {
        setShown(0);
        const tick = () => {
          const t = el.currentTime * 1000;
          setShown(timings.filter((ms) => ms <= t).length);
          if (!el.paused && !el.ended) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } else {
        revealEvenly(
          Number.isFinite(el.duration) && el.duration > 0 ? el.duration : words.length / 2.5,
        );
      }
      void el.play();
    };
    if (Number.isFinite(el.duration) && el.duration > 0) start();
    else el.addEventListener('loadedmetadata', start, { once: true });
    el.onended = () => {
      setPlaying(false);
      setShown(words.length);
    };
  };

  const speak = () => {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    u.rate = 0.95;
    let boundaryFired = false;
    setShown(0);
    setPlaying(true);
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      boundaryFired = true;
      const before = text.slice(0, e.charIndex).split(/\s+/).filter(Boolean).length;
      setShown(Math.min(words.length, before + 1));
    };
    u.onstart = () => {
      setTimeout(() => {
        if (!boundaryFired) revealEvenly(words.length / 2.5);
      }, 700);
    };
    u.onend = () => {
      stopTimer();
      setShown(words.length);
      setPlaying(false);
    };
    u.onerror = u.onend;
    window.speechSynthesis.speak(u);
  };

  return (
    <div>
      <p className={`leading-snug ${className ?? ''}`} data-testid="narrated-message">
        <span className="sr-only">{text}</span>
        {words.map((w, i) => (
          <span key={i} className={`word ${i < shown ? 'word-on' : ''}`} aria-hidden="true">
            {w}{' '}
          </span>
        ))}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {audioUrl ? (
          <>
            <audio ref={audioRef} src={audioUrl} preload="metadata" />
            <button type="button" className="btn btn-sm" onClick={playAudio} disabled={playing}>
              {playing ? 'Playing…' : 'Play the narration'}
            </button>
          </>
        ) : null}
        {canSpeak ? (
          <button type="button" className="btn btn-sm btn-ghost" onClick={speak} disabled={playing}>
            Read it aloud
          </button>
        ) : null}
      </div>
    </div>
  );
}
