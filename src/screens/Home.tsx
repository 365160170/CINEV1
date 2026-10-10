import { Plus } from 'lucide-react';
import { go, useApp } from '../store';
import { Avatar, Poster, RatingPair } from '../ui/components';
import { img } from '../data/tmdb';
import { formatDay } from '../util';

export function Home() {
  const { me, other, movies, space, ratingsFor, members, load } = useApp();
  const pending = movies.filter((m) => m.status === 'pending').sort((a, b) => b.addedAt - a.addedAt);
  const watched = movies.filter((m) => m.status === 'watched').sort((a, b) => (b.watchedDate ?? '').localeCompare(a.watchedDate ?? ''));
  // Destacado estable del día entre pendientes
  const day = Math.floor(Date.now() / 86400000);
  const hero = pending.length ? pending[day % pending.length] : null;
  const last = watched[0];
  const latestByOther = pending.find((m) => m.addedByUid === other?.uid && Date.now() - m.addedAt < 3 * 86400000);

  return (
    <div className="page">
      <header className="home-top">
        <span className="wordmark sm">{space?.name ?? 'Cine de Dos'}</span>
        <button className="avatar-btn" onClick={() => go('/nosotros')} aria-label="Ir a Nosotros"><Avatar member={me} size={36} /></button>
      </header>
      <p className="greeting">
        Qué bueno verte, {me?.displayName}.
        {latestByOther && <> <span className="muted">{other?.displayName} agregó <button className="inline-link" onClick={() => go(`/peli/${latestByOther.id}`)}>{latestByOther.title}</button>.</span></>}
      </p>

      {load === 'loading' ? <div className="hero skel" /> : hero ? (
        <section className="hero" aria-label="Qué vemos después">
          {img(hero.backdropPath, 'w780') && <img className="hero-bg" src={img(hero.backdropPath, 'w780')!} alt="" />}
          <div className="hero-shade" />
          <div className="hero-body">
            <Poster movie={hero} size="w342" className="hero-poster" />
            <div className="hero-text">
              <h1 className="serif hero-q">¿Qué vemos después?</h1>
              <p className="hero-title">{hero.title}{hero.releaseYear ? <span className="muted"> ({hero.releaseYear})</span> : null}</p>
              <p className="muted small">La propuso {members[hero.addedByUid]?.displayName ?? '—'}</p>
              <button className="btn primary" onClick={() => go(`/peli/${hero.id}`)}>Ver ficha</button>
            </div>
          </div>
        </section>
      ) : (
        <section className="empty-hero">
          <h1 className="serif hero-q">La sala está vacía</h1>
          <p className="muted">Todavía no hay nada en su cartelera. Busquen la primera película que quieran ver juntos.</p>
          <button className="btn primary" onClick={() => go('/buscar')}>Agregar la primera</button>
        </section>
      )}

      {(pending.length > 0 || watched.length > 0) && (
        <p className="band">{me?.displayName} y {other?.displayName ?? 'tu compañía'} tienen {pending.length} {pending.length === 1 ? 'película pendiente' : 'películas pendientes'}.</p>
      )}

      {pending.length > 1 && (
        <section>
          <div className="sec-head"><h2 className="serif">En nuestra cartelera</h2><button className="link" onClick={() => go('/lista')}>Ver todas</button></div>
          <div className="lane">
            {pending.slice(0, 10).map((m) => (
              <button key={m.id} className="lane-item" onClick={() => go(`/peli/${m.id}`)}>
                <Poster movie={m} size="w185" />
                <span className="lane-title">{m.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {last && (
        <section>
          <div className="sec-head"><h2 className="serif">Última función</h2></div>
          <button className="ticket" onClick={() => go(`/peli/${last.id}`)}>
            <Poster movie={last} size="w185" className="ticket-poster" />
            <div className="ticket-body">
              <span className="ticket-no">Función nº {watched.length}</span>
              <strong className="ticket-title">{last.title}</strong>
              <span className="muted small">{formatDay(last.watchedDate, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              <RatingPair scores={ratingsFor(last.id)} members={members} uids={space?.memberUids ?? []} />
            </div>
          </button>
        </section>
      )}

      <button className="fab" onClick={() => go('/buscar')}><Plus size={18} strokeWidth={1.8} /> Agregar película</button>
    </div>
  );
}
