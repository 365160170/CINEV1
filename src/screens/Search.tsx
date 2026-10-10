import { useEffect, useRef, useState } from 'react';
import { Check, Plus, Search as SearchIcon } from 'lucide-react';
import { repo } from '../data';
import { movieRuntime, searchMovies, tmdbEnabled, type TmdbResult } from '../data/tmdb';
import { go, useApp } from '../store';
import { Poster, Sheet } from '../ui/components';

export function Search() {
  const { user, movies, members, toast, online } = useApp();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [manual, setManual] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const existing = new Map(movies.filter((m) => m.tmdbId).map((m) => [m.tmdbId!, m]));

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (!tmdbEnabled || q.trim().length < 2) { setResults([]); setState('idle'); return; }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setState('loading');
      try { setResults(await searchMovies(q.trim(), ctl.signal)); setState('done'); }
      catch (e: any) { if (e.name !== 'AbortError') setState('error'); }
    }, 380);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  const add = async (r: TmdbResult) => {
    if (!online) { toast('Necesitas conexión para agregar.'); return; }
    setBusyId(r.tmdbId);
    try {
      const runtimeMinutes = await movieRuntime(r.tmdbId);
      const res = await repo.addMovie({ ...r, runtimeMinutes, source: 'tmdb' }, user!.uid);
      if (res.status === 'exists') {
        const m = existing.get(r.tmdbId);
        toast(m ? `Ya está en ${m.status === 'watched' ? '«Ya vimos»' : 'su lista'}. La agregó ${members[m.addedByUid]?.displayName ?? '—'}.` : 'Ya está en su lista.');
      } else toast(`«${r.title}» agregada a su lista`);
    } catch { toast('No se pudo agregar. Revisa tu conexión.'); }
    finally { setBusyId(null); }
  };

  return (
    <div className="page">
      <h1 className="serif page-title">Agregar película</h1>
      <label className="search-box">
        <SearchIcon size={20} strokeWidth={1.6} aria-hidden />
        <input ref={inputRef} type="search" placeholder={tmdbEnabled ? 'Busca una película…' : 'El catálogo no está conectado'} value={q} onChange={(e) => setQ(e.target.value)} disabled={!tmdbEnabled} aria-label="Buscar película" enterKeyHint="search" />
      </label>

      {!tmdbEnabled && <p className="note">El buscador de TMDB aún no está configurado. Puedes agregar películas a mano mientras tanto.</p>}
      {state === 'error' && <p className="error" role="alert">El catálogo no respondió. Intenta otra vez o agrégala a mano.</p>}
      {state === 'loading' && results.length === 0 && <ul className="results">{[0, 1, 2].map((i) => <li key={i} className="result skel-row" />)}</ul>}
      {state === 'done' && results.length === 0 && <p className="muted">No encontramos «{q}». Revisa la ortografía o agrégala a mano.</p>}

      <ul className="results">
        {results.map((r) => {
          const ex = existing.get(r.tmdbId);
          return (
            <li key={r.tmdbId} className="result">
              <Poster movie={r} size="w185" className="result-poster" />
              <div className="result-text">
                <strong>{r.title}</strong>
                <span className="muted small">{[r.releaseYear, r.originalTitle].filter(Boolean).join('. ')}</span>
                {ex && <span className="amber small">{ex.status === 'watched' ? 'Ya la vieron' : `Agregada por ${members[ex.addedByUid]?.displayName ?? '—'}`}</span>}
              </div>
              {ex ? (
                <button className="icon-btn done" onClick={() => go(`/peli/${ex.id}`)} aria-label={`Ver ficha de ${r.title}`}><Check size={20} strokeWidth={1.8} /></button>
              ) : (
                <button className="icon-btn add" disabled={busyId === r.tmdbId} onClick={() => add(r)} aria-label={`Agregar ${r.title} a nuestra lista`}><Plus size={20} strokeWidth={1.8} /></button>
              )}
            </li>
          );
        })}
      </ul>

      <button className="btn ghost wide" onClick={() => setManual(true)}>¿No aparece? Agregar a mano</button>
      {tmdbEnabled && <p className="credit">Datos e imágenes de TMDB. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.</p>}
      <ManualSheet open={manual} onClose={() => setManual(false)} initial={q} />
    </div>
  );
}

function ManualSheet({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: string }) {
  const { user, toast, online } = useApp();
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  useEffect(() => { if (open) { setTitle(initial); setYear(''); } }, [open, initial]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!online) { toast('Necesitas conexión para agregar.'); return; }
    const y = Number(year);
    try {
      await repo.addMovie({ tmdbId: null, title: title.trim().slice(0, 200), originalTitle: null, releaseYear: y >= 1888 && y <= 2100 ? y : null, posterPath: null, backdropPath: null, overview: null, runtimeMinutes: null, source: 'manual' }, user!.uid);
      toast(`«${title.trim()}» agregada a su lista`); onClose();
    } catch { toast('No se pudo agregar. Revisa tu conexión.'); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Agregar a mano">
      <form className="stack" onSubmit={save}>
        <label className="field"><span>Título</span><input required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="field"><span>Año (opcional)</span><input inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))} /></label>
        <button className="btn primary wide" disabled={!title.trim()}>Agregar a nuestra lista</button>
      </form>
    </Sheet>
  );
}
