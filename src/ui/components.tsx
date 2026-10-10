import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Member, Movie } from '../data';
import { img } from '../data/tmdb';
import { hashHue, initials } from '../util';

const GROUNDS = ['#2a2224', '#1f2a2a', '#2b2619', '#22222f', '#2a1d1b', '#1d2620'];

export function Poster({ movie, size = 'w342', className = '' }: { movie: Pick<Movie, 'title' | 'posterPath' | 'releaseYear'>; size?: 'w185' | 'w342' | 'w500'; className?: string }) {
  const [broken, setBroken] = useState(false);
  const src = img(movie.posterPath, size);
  if (src && !broken) {
    return <div className={`poster ${className}`}><img src={src} alt={`Póster de ${movie.title}`} loading="lazy" decoding="async" onError={() => setBroken(true)} /></div>;
  }
  const bg = GROUNDS[hashHue(movie.title) % GROUNDS.length];
  return (
    <div className={`poster poster-type ${className}`} style={{ background: bg }} role="img" aria-label={`Sin póster: ${movie.title}`}>
      <span className="pt-rule" />
      <span className="pt-title">{movie.title}</span>
      {movie.releaseYear && <span className="pt-year">{movie.releaseYear}</span>}
    </div>
  );
}

export function Avatar({ member, size = 32 }: { member: Member | null; size?: number }) {
  const name = member?.displayName ?? '?';
  return (
    <span className={`avatar av-${member?.avatarPreset ?? 'round'}`} style={{ width: size, height: size, fontSize: size * 0.4, background: member?.accentColor ?? '#39383C' }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    ref.current?.querySelector<HTMLElement>('button, input')?.focus();
    return () => removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 className="serif">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} strokeWidth={1.6} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ScorePicker({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
  return (
    <div className="score-grid" role="radiogroup" aria-label="Calificación del 1 al 10">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button key={n} role="radio" aria-checked={value === n} className={`score ${value === n ? 'on' : ''}`} onClick={() => onChange(n)}>{n}</button>
      ))}
    </div>
  );
}

export function RatingPair({ scores, members, uids }: { scores: Record<string, number>; members: Record<string, Member>; uids: string[] }) {
  return (
    <div className="rating-pair">
      {uids.map((u) => (
        <span key={u} className="rp">
          <i style={{ background: members[u]?.accentColor ?? '#39383C' }} />
          <span className="rp-name">{members[u]?.displayName ?? '—'}</span>
          <b className={scores[u] ? 'amber' : 'muted'}>{scores[u] ?? 'Sin calificar'}</b>
        </span>
      ))}
    </div>
  );
}

export function SkeletonGrid({ n = 6 }: { n?: number }) {
  return <div className="grid">{Array.from({ length: n }, (_, i) => <div key={i} className="skel poster" />)}</div>;
}
