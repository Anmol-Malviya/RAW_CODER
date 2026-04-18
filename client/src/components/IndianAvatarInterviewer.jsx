/**
 * IndianAvatarInterviewer.jsx  — v4.0 Frame Sequence Edition
 * ─────────────────────────────────────────────────────────────────────────────
 * Plays through 64 sequential PNG frames (exported from a GIF) for a
 * smooth, realistic speaking animation.
 *
 * Architecture:
 *  - 64 frames served from /public/avatar_seq/ezgif-frame-001.png … 064.png
 *  - Idle  → frozen on frame 001 (neutral)
 *  - Speaking → cycles through all frames at ~25fps (40ms/frame)
 *  - Blink shimmer / speaking glow via CSS box-shadow
 */

import { useEffect, useRef, useState } from 'react';

// Total number of frames available
const TOTAL_FRAMES = 64;

// Build the frame path list (001 → 064)
const FRAMES = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const n = String(i + 1).padStart(3, '0');
  return `/avatar_seq/ezgif-frame-${n}.png`;
});

// Preload all frames up-front to avoid flicker
const preloadAll = () => {
  FRAMES.forEach(src => {
    const img = new window.Image();
    img.src = src;
  });
};

export default function IndianAvatarInterviewer({
  isSpeaking  = false,
  currentWord = '',   // kept for API compatibility (unused in frame mode)
  size        = 220,
}) {
  const [frameIdx, setFrameIdx]   = useState(0);   // current frame index (0-based)
  const [loaded,   setLoaded]     = useState(false);
  const timerRef                  = useRef(null);

  // Preload on first mount
  useEffect(() => { preloadAll(); }, []);

  // ── Frame animation loop ──────────────────────────────────────────
  useEffect(() => {
    clearInterval(timerRef.current);

    if (isSpeaking) {
      // Cycle through all 64 frames at ~25 fps
      timerRef.current = setInterval(() => {
        setFrameIdx(prev => (prev + 1) % TOTAL_FRAMES);
      }, 40);
    } else {
      // Return to neutral (frame 0)
      setFrameIdx(0);
    }

    return () => clearInterval(timerRef.current);
  }, [isSpeaking]);

  const height = size * 1.35;
  const radius = size * 0.08;

  return (
    <div
      style={{
        position:       'relative',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        userSelect:     'none',
      }}
    >
      <div
        style={{
          position:     'relative',
          width:        size,
          height:       height,
          borderRadius: radius,
          overflow:     'hidden',
          boxShadow:    isSpeaking
            ? '0 0 0 3px #7c3aed, 0 12px 40px rgba(109,40,217,0.35), 0 4px 20px rgba(0,0,0,0.25)'
            : '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
          transition:   'box-shadow 0.4s ease',
          background:   '#d4c5b0',
        }}
      >
        {/* Loading shimmer */}
        {!loaded && (
          <div
            style={{
              position:       'absolute',
              inset:          0,
              background:     'linear-gradient(135deg, #d4c5b0 0%, #e8ddd0 50%, #d4c5b0 100%)',
              backgroundSize: '200% 200%',
              animation:      'avShimmer 1.4s ease infinite',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       13,
              color:          '#8b7355',
              fontFamily:     'Inter, sans-serif',
              letterSpacing:  '0.05em',
            }}
          >
            Loading…
          </div>
        )}

        {/* Current frame */}
        <img
          key={FRAMES[frameIdx]}
          src={FRAMES[frameIdx]}
          alt="Interviewer"
          onLoad={() => setLoaded(true)}
          style={{
            position:       'absolute',
            inset:          0,
            width:          '100%',
            height:         '100%',
            objectFit:      'cover',
            objectPosition: 'center top',
            opacity:        loaded ? 1 : 0,
            transition:     'opacity 0.15s ease',
          }}
        />

        {/* Subtle vignette */}
        <div
          style={{
            position:   'absolute',
            inset:      0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.18) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <style>{`
        @keyframes avShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
