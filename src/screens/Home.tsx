import { Plus } from 'lucide-react';
import { go, useApp } from '../store';
import { Avatar, Poster, RatingPair } from '../ui/components';
import { img } from '../data/tmdb';
import { useEffect, useState } from 'react';
import { useAmbient } from '../ui/ambient';
import { Summary } from '../ui/Summary';
import { formatDay, tomarFuncionNueva } from '../util';

export function Home() {
  const { me, other, movies, space, ratingsFor, members, load } = useApp();
  const pending = movies.filter((m) => m.status === 'pending').sort((a, b) => b.addedAt - a.addedAt);
  const watched = movies.filter((m) => m.status === 'watched').sort((a, b) => (b.watchedDate ?? '').localeCompare(a.watchedDate ?? ''));
  // Destacado estable del día entre pendientes
  const day = Math.floor(Date.now() / 86400000);
  const hero = pending.length ? pending[day % pending.length] : null;
  const last = watched[0];
  const latestByOther = pending.find((m) => m.addedByUid === other?.uid && Date.now() - m.addedAt < 3 * 86400000);

  useAmbient(hero?.title, img(hero?.posterPath ?? null, 'w185'));

  // El sello siempre está en el boleto, porque la función ya ocurrió; lo que
  // se anima es el golpe, y solo cuando acaban de registrarla.
  const [sellando, setSellando] = useState(false);
  useEffect(() => { if (tomarFuncionNueva()) { setSellando(true); const t = setTimeout(() => setSellando(false), 1200); return () => clearTimeout(t); } }, []);

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
              <h1 className="hero-title">{hero.title}{hero.releaseYear ? <span className="muted"> ({hero.releaseYear})</span> : null}</h1>
              <p className="muted small">La propuso {members[hero.addedByUid]?.displayName ?? '—'}</p>
              <button className="btn primary" onClick={() => go(`/peli/${hero.id}`)}>Ver ficha</button>
            </div>
          </div>
        </section>
      ) : (
        <section className="empty-hero">
          <h1 className="serif empty-hero-t">La sala está vacía</h1>
          <p className="muted">Todavía no hay nada en la cartelera. Busquen la primera que quieran ver juntos.</p>
          <button className="btn primary" onClick={() => go('/buscar')}>Agregar la primera</button>
        </section>
      )}

      {(pending.length > 0 || watched.length > 0) && (
        <p className="band">{me?.displayName} y {other?.displayName ?? 'tu compañía'} tienen {pending.length} {pending.length === 1 ? 'película pendiente' : 'películas pendientes'}.</p>
      )}

      <Summary />

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
            <span className="ticket-main">
              <span className="ticket-head">
                <span className="ticket-brand">{space?.name ?? 'Cine de Dos'}</span>
                <span className="ticket-serial">N.º {String(watched.length).padStart(3, '0')}</span>
              </span>
              <span className="ticket-body">
                <strong className="ticket-title">{last.title}</strong>
                <span className="ticket-meta">
                  {[last.releaseYear, last.runtimeMinutes && `${last.runtimeMinutes} min`].filter(Boolean).join(' · ') || 'Función registrada'}
                </span>
                <RatingPair scores={ratingsFor(last.id)} members={members} uids={space?.memberUids ?? []} />
              </span>
              <span className={`ticket-sello ${sellando ? 'is-sellando' : ''}`} aria-hidden>Vista</span>
            </span>
            <span className="ticket-stub">
              <span className="stub-label">Admite</span>
              <span className="stub-big">2</span>
              <span className="stub-date">{formatDay(last.watchedDate, { day: '2-digit', month: 'short' })}</span>
            </span>
          </button>
        </section>
      )}

      <button className="fab" onClick={() => go('/buscar')}><Plus size={18} strokeWidth={1.8} /> Agregar película</button>
    </div>
  );
}
