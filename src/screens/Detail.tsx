import { useEffect, useState } from 'react';
import { ArrowLeft, MoreHorizontal, Play } from 'lucide-react';
import { repo } from '../data';
import { img, movieTrailer } from '../data/tmdb';
import { go, useApp } from '../store';
import { Avatar, Poster, ScorePicker, Sheet } from '../ui/components';
import { useAmbient } from '../ui/ambient';
import { formatDay, formatMs, todayISO } from '../util';

export function Detail({ id }: { id: string }) {
  const { movies, members, user, space, ratingsFor, toast, load, online } = useApp();
  const movie = movies.find((m) => m.id === id);
  const [sheet, setSheet] = useState<null | 'watch' | 'date' | 'rate' | 'menu' | 'rename'>(null);
  const [trailer, setTrailer] = useState<string | null>(null);

  useEffect(() => { if (movie?.tmdbId) movieTrailer(movie.tmdbId).then(setTrailer); }, [movie?.tmdbId]);
  useAmbient(movie?.title, img(movie?.posterPath ?? null, 'w185'));

  if (!movie) {
    return (
      <div className="page"><div className="empty">
        <p className="serif empty-t">{load === 'loading' ? 'Cargando…' : 'Esta película ya no está en su lista'}</p>
        {load !== 'loading' && <button className="btn ghost" onClick={() => go('/lista')}>Volver a la lista</button>}
      </div></div>
    );
  }
  const scores = ratingsFor(movie.id);
  const uids = space?.memberUids ?? [];
  const backdrop = img(movie.backdropPath, 'w1280');
  const guard = async (fn: () => Promise<void>, ok: string) => {
    if (!online) { toast('Necesitas conexión para guardar.'); return; }
    try { await fn(); toast(ok); setSheet(null); } catch { toast('No se guardó. Inténtalo otra vez.'); }
  };

  return (
    <div className="detail">
      <div className={`backdrop ${backdrop ? "" : "no-img"}`}>
        {backdrop && <img src={backdrop} alt="" />}
        <div className="backdrop-shade" />
        <div className="detail-bar">
          <button className="icon-btn on-img" onClick={() => (history.length > 1 ? history.back() : go('/lista'))} aria-label="Volver"><ArrowLeft size={22} strokeWidth={1.6} /></button>
          <button className="icon-btn on-img" onClick={() => setSheet('menu')} aria-label="Más opciones"><MoreHorizontal size={22} strokeWidth={1.6} /></button>
        </div>
      </div>
      <div className="detail-body page">
        <div className="detail-head">
          <Poster movie={movie} size="w342" className="detail-poster" />
          <div>
            <h1 className="serif detail-title">{movie.title}</h1>
            <p className="muted small">{[movie.releaseYear, movie.runtimeMinutes && `${movie.runtimeMinutes} min`, movie.originalTitle].filter(Boolean).join('. ')}</p>
          </div>
        </div>
        <p className="added-by"><Avatar member={members[movie.addedByUid] ?? null} size={22} /> Agregada por {members[movie.addedByUid]?.displayName ?? '—'} el {formatMs(movie.addedAt)}</p>
        {movie.overview && <p className="overview">{movie.overview}</p>}
        {trailer && <a className="btn ghost" href={trailer} target="_blank" rel="noopener noreferrer"><Play size={16} strokeWidth={1.8} /> Ver tráiler</a>}

        {movie.status === 'pending' ? (
          <button className="btn primary wide sticky-cta" onClick={() => setSheet('watch')}>Marcar como vista</button>
        ) : (
          <section className="watched-box">
            <div className="wb-head">
              <span className="ticket-no">Vista el {formatDay(movie.watchedDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <button className="link" onClick={() => setSheet('date')}>Corregir fecha</button>
            </div>
            <div className="score-cards">
              {uids.map((u) => (
                <div key={u} className="score-card" style={{ borderTopColor: members[u]?.accentColor }}>
                  <span className="small muted">{members[u]?.displayName ?? 'Aún no entra'}</span>
                  <span className={`score-big ${scores[u] ? 'amber' : 'muted'}`}>{scores[u] ?? '–'}</span>
                  {u === user?.uid ? <button className="link" onClick={() => setSheet('rate')}>{scores[u] ? 'Cambiar mi nota' : 'Calificar'}</button> : <span className="small muted">{scores[u] ? 'de 10' : 'Sin calificar'}</span>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <WatchSheet open={sheet === 'watch'} onClose={() => setSheet(null)} onSave={(date, score) => guard(async () => {
        await repo.markWatched(movie.id, date, user!.uid);
        if (score) await repo.setRating(movie.id, user!.uid, score);
      }, 'Una más para nuestra historia')} />

      <Sheet open={sheet === 'date'} onClose={() => setSheet(null)} title="¿Cuándo la vieron?">
        <DateForm initial={movie.watchedDate ?? todayISO()} onSave={(d) => guard(() => repo.setWatchedDate(movie.id, d, user!.uid), 'Fecha corregida')} />
      </Sheet>

      <Sheet open={sheet === 'rate'} onClose={() => setSheet(null)} title="¿Qué nota le das?">
        <RateForm initial={scores[user!.uid] ?? null} onSave={(s) => guard(() => repo.setRating(movie.id, user!.uid, s), s ? 'Nota guardada' : 'Nota quitada')} />
      </Sheet>

      <Sheet open={sheet === 'rename'} onClose={() => setSheet(null)} title="Editar película">
        <RenameForm title={movie.title} year={movie.releaseYear} onSave={(t, y) => guard(() => repo.renameManual(movie.id, t, y), 'Cambios guardados')} />
      </Sheet>

      <Sheet open={sheet === 'menu'} onClose={() => setSheet(null)} title="Opciones">
        <div className="menu">
          {movie.source === 'manual' && <button onClick={() => setSheet('rename')}>Editar nombre y año</button>}
          {movie.status === 'watched' && <button onClick={() => { if (confirm('¿Devolver a pendientes? Se borrará la fecha de la función; las notas se conservan.')) guard(() => repo.revertPending(movie.id), 'De vuelta en pendientes'); }}>Devolver a pendientes</button>}
          <button className="danger" onClick={() => { if (confirm(`¿Quitar «${movie.title}» de su lista? Esto la quita para ambos.`)) guard(async () => { await repo.removeMovie(movie.id); go('/lista'); }, 'Película quitada'); }}>Quitar de la lista</button>
        </div>
      </Sheet>
    </div>
  );
}

function WatchSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (date: string, score: number | null) => void }) {
  const [date, setDate] = useState(todayISO());
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => { if (open) { setDate(todayISO()); setScore(null); } }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title="Registrar función">
      <div className="stack">
        <label className="field"><span>¿Cuándo la vieron?</span><input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required /></label>
        <div className="field"><span>¿Qué nota le das?</span><ScorePicker value={score} onChange={(n) => setScore(n === score ? null : n)} /></div>
        <p className="small muted">{score ? `Tu nota: ${score} de 10. La otra persona califica desde su cuenta.` : 'Puedes calificar ahora o después.'}</p>
        <button className="btn primary wide" disabled={!date} onClick={() => onSave(date, score)}>Guardar función</button>
      </div>
    </Sheet>
  );
}

function DateForm({ initial, onSave }: { initial: string; onSave: (d: string) => void }) {
  const [d, setD] = useState(initial);
  return <div className="stack"><input type="date" value={d} max={todayISO()} onChange={(e) => setD(e.target.value)} aria-label="Fecha" /><button className="btn primary wide" disabled={!d} onClick={() => onSave(d)}>Guardar fecha</button></div>;
}
function RateForm({ initial, onSave }: { initial: number | null; onSave: (s: number | null) => void }) {
  const [s, setS] = useState<number | null>(initial);
  return (
    <div className="stack">
      <ScorePicker value={s} onChange={setS} />
      <button className="btn primary wide" disabled={!s} onClick={() => onSave(s)}>Guardar nota</button>
      {initial && <button className="link" onClick={() => onSave(null)}>Quitar mi nota</button>}
    </div>
  );
}
function RenameForm({ title, year, onSave }: { title: string; year: number | null; onSave: (t: string, y: number | null) => void }) {
  const [t, setT] = useState(title); const [y, setY] = useState(year ? String(year) : '');
  return (
    <div className="stack">
      <label className="field"><span>Título</span><input value={t} maxLength={200} onChange={(e) => setT(e.target.value)} /></label>
      <label className="field"><span>Año</span><input inputMode="numeric" maxLength={4} value={y} onChange={(e) => setY(e.target.value.replace(/\D/g, ''))} /></label>
      <button className="btn primary wide" disabled={!t.trim()} onClick={() => { const n = Number(y); onSave(t.trim(), n >= 1888 && n <= 2100 ? n : null); }}>Guardar cambios</button>
    </div>
  );
}
