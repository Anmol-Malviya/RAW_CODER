/**
 * IndianAvatarInterviewer.jsx  — v3.0 Ultra-Realistic Photo Edition
 * ─────────────────────────────────────────────────────────────────────────────
 * Photo-quality Indian female interviewer avatar system.
 *
 * Architecture:
 *  - 4 pre-generated photorealistic images (one per mouth state)
 *  - Smooth cross-fade transition between states via CSS opacity layering
 *  - Blink animation via CSS keyframes on a dark overlay rect
 *  - Subtle head-bob via CSS transform
 *  - Phoneme → mouth-state mapping
 *  - Animated pulse ring while speaking
 *
 * Mouth states (images):
 *  closed  → neutral smile
 *  open    → mid-speech, teeth slightly visible
 *  wide    → wide open speech
 *  round   → O-shape lips
 *
 * Future scalability:
 *  — Swap static images for Azure TTS viseme frames (60fps)
 *  — Use WebGL shader blending for real-time morph between states
 *  — Live2D rigging overlay on top of photo texture
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Letter → Viseme State Mapping (7 Frames) ──────────────────────
const VISEME_MAP = {
  a: 'open', e: 'wide', i: 'wide', o: 'round', u: 'pucker',
  c: 'teeth', d: 'teeth', g: 'teeth', k: 'teeth', n: 'teeth', s: 'teeth', t: 'teeth', x: 'teeth', z: 'teeth',
  f: 'parted', v: 'parted', h: 'parted',
  m: 'closed', b: 'closed', p: 'closed',
  w: 'pucker', q: 'pucker',
  j: 'teeth', r: 'round', l: 'teeth', y: 'wide'
};

// Returns an array of frames representing the syllables of the word
function detectVisemeSequence(word = '') {
  const letters = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!letters) return ['closed', 'parted'];
  
  const seq = [];
  let last = '';
  // Compress consecutive identical letters/frames
  for (const ch of letters) {
    const frame = VISEME_MAP[ch] || 'parted';
    if (frame !== last) {
      seq.push(frame);
      last = frame;
    }
  }
  // Ensure we minimum have some frames and end on a relaxed state
  if (seq.length === 1) seq.push('parted');
  return seq;
}

// ── Image paths (served from /public/avatar/) ─────────────────────
const AVATAR_IMGS = {
  closed: '/avatar/mouth_closed.png',
  open:   '/avatar/mouth_open.png',
  wide:   '/avatar/mouth_wide.png',
  round:  '/avatar/mouth_round.png',
  teeth:  '/avatar/mouth_teeth.png',
  pucker: '/avatar/mouth_pucker.png',
  parted: '/avatar/mouth_parted.png',
};

const preloadImages = () => {
  Object.values(AVATAR_IMGS).forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

export default function IndianAvatarInterviewer({
  isSpeaking  = false,
  currentWord = '',
  size        = 220,
}) {
  const [mouthState, setMouthState] = useState('closed');
  const [loaded,     setLoaded]     = useState(false);
  const [loadCount,  setLoadCount]  = useState(0);

  const mouthRef    = useRef(null);
  const totalImages = Object.keys(AVATAR_IMGS).length;

  useEffect(() => { preloadImages(); }, []);

  const handleImageLoad = useCallback(() => {
    setLoadCount(c => {
      const next = c + 1;
      if (next >= totalImages) setLoaded(true);
      return next;
    });
  }, [totalImages]);

  // ── Lip sync: 7-frame multi-state merging ───────────────────────
  useEffect(() => {
    if (!isSpeaking) {
      clearTimeout(mouthRef.current);
      setMouthState('closed');
      return;
    }

    if (currentWord) {
      // 1. Convert word to a sequence of visual frames
      const sequence = detectVisemeSequence(currentWord);
      let step = 0;
      
      // 2. Play through the frames at ~70ms per frame
      const playSequence = () => {
        if (step < sequence.length) {
          setMouthState(sequence[step]);
          step++;
          mouthRef.current = setTimeout(playSequence, 70);
        } else {
          // 3. Relax slightly when word finishes
          setMouthState('parted');
          mouthRef.current = setTimeout(() => setMouthState('closed'), 100);
        }
      };
      clearTimeout(mouthRef.current);
      playSequence();
      
    } else {
      // Fallback breathing cycle if talking but word is missed
      const fallbackSeq = ['parted', 'teeth', 'closed', 'open', 'parted'];
      let fStep = 0;
      const cycle = () => {
        setMouthState(fallbackSeq[fStep % fallbackSeq.length]);
        fStep++;
        mouthRef.current = setTimeout(cycle, 150 + Math.random() * 50);
      };
      clearTimeout(mouthRef.current);
      cycle();
    }
    
    return () => clearTimeout(mouthRef.current);
  }, [isSpeaking, currentWord]);


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
            Loading...
          </div>
        )}

        {/* ── 4 Layers rendered exactly on top of each other ── */}
        {Object.entries(AVATAR_IMGS).map(([state, src]) => (
          <img
            key={state}
            src={src}
            alt={`Avatar ${state}`}
            onLoad={handleImageLoad}
            style={{
              position:  'absolute',
              inset:     0,
              width:     '100%',
              height:    '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              opacity:   mouthState === state ? 1 : 0,
              // Extremely quick 60ms crossfade for seamless lip blending
              transition: 'opacity 0.06s ease-in-out',
            }}
          />
        ))}

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
