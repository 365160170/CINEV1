import { useEffect, useState } from 'react';

// Intro de ~3.6 s: cuenta regresiva de película → haz de proyector → CINE 10 / CASA DÍAZ.
// Se muestra una vez por sesión; tocar la pantalla la salta.
export function Intro({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  const [phase, setPhase] = useState<'count' | 'reveal' | 'out'>('count');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduced) { const t = setTimeout(onDone, 900); return () => clearTimeout(t); }
    const ts = [
      setTimeout(() => setN(2), 380),
      setTimeout(() => setN(1), 760),
      setTimeout(() => setPhase('reveal'), 1140),
      setTimeout(() => setPhase('out'), 3300),
      setTimeout(onDone, 3750),
    ];
    return () => ts.forEach(clearTimeout);
  }, [onDone, reduced]);

  return (
    <div className={`intro is-${phase} ${reduced ? 'still' : ''}`} onClick={onDone} role="img" aria-label="Cine 10, Casa Díaz">
      {phase === 'count' && !reduced && (
        <div className="leader" key={n}>
          <svg viewBox="0 0 200 200" aria-hidden>
            <circle cx="100" cy="100" r="88" className="ring" />
            <circle cx="100" cy="100" r="70" className="ring thin" />
            <line x1="100" y1="0" x2="100" y2="200" className="cross" />
            <line x1="0" y1="100" x2="200" y2="100" className="cross" />
            <circle cx="100" cy="100" r="44" className="sweep" pathLength={1} />
          </svg>
          <span className="leader-n">{n}</span>
        </div>
      )}
      {(phase !== 'count' || reduced) && (
        <div className="reveal">
          <div className="beam" />
          <div className="mark">
            <span className="mark-cine">CINE</span>
            <span className="mark-10">10</span>
          </div>
          <div className="mark-rule" />
          <span className="mark-casa">CASA DÍAZ</span>
        </div>
      )}
      <div className="grain" />
    </div>
  );
}
