import { useMemo, useState } from 'react';
import { abrirPeli, go, useApp } from '../store';
import { Poster, SkeletonGrid } from '../ui/components';
import { formatDay } from '../util';

export function List() {
  const { movies, members, space, ratingsFor, load } = useApp();
  const [tab, setTab] = useState<'pending' | 'watched'>(() => (sessionStorage.getItem('cdd-tab') as 'watched') || 'pending');
  const [sort, setSort] = useState<'recent' | 'az'>('recent');
  const [who, setWho] = useState<string>('all');
  const uids = space?.memberUids ?? [];
  const setT = (t: 'pending' | 'watched') => { setTab(t); try { sessionStorage.setItem('cdd-tab', t); } catch {} };

  const list = useMemo(() => {
    let l = movies.filter((m) => m.status === tab);
    if (who !== 'all') l = l.filter((m) => m.addedByUid === who);
    if (tab === 'watched') return l.sort((a, b) => (b.watchedDate ?? '').localeCompare(a.watchedDate ?? ''));
    return sort === 'az' ? l.sort((a, b) => a.title.localeCompare(b.title, 'es')) : l.sort((a, b) => b.addedAt - a.addedAt);
  }, [movies, tab, sort, who]);

  const count = (s: string) => movies.filter((m) => m.status === s).length;

  return (
    <div className="page">
      <h1 className="serif page-title">Nuestra lista</h1>
      <div className="seg big" role="tablist">
        <button role="tab" aria-selected={tab === 'pending'} className={tab === 'pending' ? 'on' : ''} onClick={() => setT('pending')}>Pendientes <span className="count">{count('pending')}</span></button>
        <button role="tab" aria-selected={tab === 'watched'} className={tab === 'watched' ? 'on' : ''} onClick={() => setT('watched')}>Ya vimos <span className="count">{count('watched')}</span></button>
      </div>
      <div className="controls">
        <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filtrar por quién la agregó">
          <option value="all">Todas</option>
          {uids.map((u) => <option key={u} value={u}>Las que agregó {members[u]?.displayName ?? '—'}</option>)}
        </select>
        {tab === 'pending' && (
          <select value={sort} onChange={(e) => setSort(e.target.value as 'recent')} aria-label="Ordenar">
            <option value="recent">Más recientes</option>
            <option value="az">Alfabético</option>
          </select>
        )}
      </div>

      {load === 'loading' ? <SkeletonGrid /> : list.length === 0 ? (
        <div className="empty">
          <p className="serif empty-t">{tab === 'pending' ? 'Nada pendiente por aquí' : 'Aún no registran funciones'}</p>
          <p className="muted">{tab === 'pending' ? 'Busca una película y agrégala a la cartelera.' : 'Cuando vean una película, ábranla y toquen «Marcar como vista».'}</p>
          {tab === 'pending' && <button className="btn primary" onClick={() => go('/buscar')}>Buscar película</button>}
        </div>
      ) : (
        <div className="grid">
          {list.map((m) => {
            const sc = ratingsFor(m.id);
            return (
              <button key={m.id} className="card" onClick={(e) => abrirPeli(e, `/peli/${m.id}`)}>
                <Poster movie={m} />
                <span className="card-title">{m.title}</span>
                <span className="card-meta">
                  {m.status === 'watched'
                    ? <>{formatDay(m.watchedDate)}{uids.map((u) => <span key={u} className="mini-score" style={{ borderColor: members[u]?.accentColor }}>{sc[u] ?? '–'}</span>)}</>
                    : <>{m.releaseYear ? `${m.releaseYear}. ` : ''}La agregó {members[m.addedByUid]?.displayName ?? '—'}</>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
