import { useState, useEffect, useRef } from 'react';

const REST_DURATION = 30; // seconds

export function RestTimer({ onDismiss }: { onDismiss: () => void }) {
  const [remaining, setRemaining] = useState(REST_DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(0 as unknown as ReturnType<typeof setInterval>);
  // Create AudioContext immediately on mount (during user tap) so iOS unlocks it
  const audioCtxRef = useRef<AudioContext | null>(null);
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
  } catch {
    // Audio not available
  }

  function playBeep() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    // Resume in case it was suspended
    ctx.resume().then(() => {
      [0, 0.15].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.12);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.12);
      });
    });
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Play beep when timer reaches 0
  const hasPlayedRef = useRef(false);
  useEffect(() => {
    if (remaining === 0 && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      playBeep();
    }
  }, [remaining]);

  const progress = (REST_DURATION - remaining) / REST_DURATION;

  return (
    <div className="flex items-center gap-3 mt-3 p-2.5 rounded-xl bg-bg border border-card-border">
      {/* Circular progress */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
          <circle cx="20" cy="20" r="17" fill="none" stroke="#2a2d35" strokeWidth="3" />
          <circle
            cx="20" cy="20" r="17" fill="none"
            stroke={remaining === 0 ? '#34d399' : '#4ecdc4'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 17}`}
            strokeDashoffset={`${2 * Math.PI * 17 * (1 - progress)}`}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-text">
          {remaining}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-xs text-text-dim">
          {remaining > 0 ? 'Pause' : 'Weiter!'}
        </span>
      </div>

      <button
        onClick={onDismiss}
        className="text-xs text-text-dim px-2 py-1 rounded-lg active:text-accent transition-colors"
      >
        {remaining > 0 ? 'Skip' : 'OK'}
      </button>
    </div>
  );
}
