import { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 64;
// Create an array of image paths corresponding to the split ezgif frames
const AVATAR_FRAMES = Array.from({ length: TOTAL_FRAMES }, (_, i) => 
  `/avatar_seq/ezgif-frame-${String(i + 1).padStart(3, '0')}.png`
);

export default function IndianAvatarInterviewer({
  isSpeaking  = false,
  currentWord = '', // kept for backwards compatibility with props
  size        = 220,
}) {
  const [frameIdx, setFrameIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef(null);
  
  // Preload images to ensure smooth playback
  useEffect(() => {
    const img = new Image();
    img.src = AVATAR_FRAMES[0];
    img.onload = () => setLoaded(true);
    
    // Preload the rest in background
    AVATAR_FRAMES.forEach(src => {
      const i = new Image();
      i.src = src;
    });
  }, []);

  // Frame sequence playback
  useEffect(() => {
    if (!isSpeaking) {
      clearTimeout(frameRef.current);
      setFrameIdx(0); // return to idle frame
      return;
    }

    const playSequence = () => {
      setFrameIdx(prev => (prev + 1) % TOTAL_FRAMES);
      // Approx 30fps = ~33ms per frame
      frameRef.current = setTimeout(playSequence, 33); 
    };

    clearTimeout(frameRef.current);
    playSequence();

    return () => clearTimeout(frameRef.current);
  }, [isSpeaking]);

  const height = 'auto';
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
          background:   'transparent',
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

        <img
          src={AVATAR_FRAMES[frameIdx]}
          alt={`Avatar Frame ${frameIdx}`}
          style={{
            display:   'block',
            width:     '100%',
            height:    'auto',
            opacity:   loaded ? 1 : 0,
            objectFit: 'contain'
          }}
        />

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
