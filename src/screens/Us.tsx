import { useState } from 'react';
import { repo } from '../data';
import { resetDemo } from '../data/demoRepo';
import { tmdbEnabled } from '../data/tmdb';
import { useApp } from '../store';
import { Avatar, Sheet } from '../ui/components';
import { formatMs } from '../util';
import { ProfileForm } from './Access';

export function Us() {
  const { space, members, movies, user, ratings, toast } = useApp();
  const [edit, setEdit] = useState(false);
  const [rename, setRename] = useState(false);
  const [name, setName] = useState(space?.name ?? '');
  const uids = space?.memberUids ?? [];

  return (
    <div className="page">
      <h1 className="serif page-title">Nosotros</h1>
      <p className="muted">Nuestro cine desde el {space ? formatMs(space.createdAt) : '—'}.</p>

      <div className="duo">
        {uids.map((u) => {
          const m = members[u] ?? null;
          const proposed = movies.filter((x) => x.addedByUid === u).length;
          const mine = ratings.filter((r) => r.userUid === u);
          const avg = mine.length ? (mine.reduce((a, r) => a + r.score, 0) / mine.length).toFixed(1) : null;
          const lastRated = mine.map((r) => movies.find((mv) => mv.id === r.movieId)).filter(Boolean).slice(-1)[0];
          return (
            <div key={u} className="person">
              <Avatar member={m} size={64} />
              <strong className="serif person-name">{m?.displayName ?? 'Aún no entra'}</strong>
              <span className="small muted">Propuso {proposed} {proposed === 1 ? 'película' : 'películas'}</span>
              {avg && <span className="small muted">Nota media <b className="amber">{avg}</b></span>}
              {lastRated && <span className="small muted">Última nota: {lastRated.title}</span>}
              {u === user?.uid && <button className="link" onClick={() => setEdit(true)}>Editar mi perfil</button>}
            </div>
          );
        })}
      </div>

      <section className="settings">
        <h2 className="serif">Ajustes</h2>
        <button className="setting" onClick={() => { setName(space?.name ?? ''); setRename(true); }}><span>Nombre del cine</span><span className="muted">{space?.name}</span></button>
        {repo.mode === 'demo' && <button className="setting" onClick={() => { if (confirm('¿Borrar todos los datos de demostración?')) { resetDemo(); repo.signOut(); } }}><span>Borrar datos de demostración</span></button>}
        <button className="setting" onClick={() => repo.signOut()}><span>Cerrar sesión</span></button>
        <details className="help">
          <summary>Ayuda</summary>
          <p className="small muted">Busca una película y tócala para agregarla. Cuando la vean, ábrela y toca «Marcar como vista». Cada quien pone su propia nota desde su cuenta.</p>
        </details>
        {tmdbEnabled && <p className="credit">Datos e imágenes de películas: TMDB. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.</p>}
      </section>

      <Sheet open={edit} onClose={() => setEdit(false)} title="Mi perfil"><ProfileForm onDone={() => setEdit(false)} /></Sheet>
      <Sheet open={rename} onClose={() => setRename(false)} title="Nombre del cine">
        <form className="stack" onSubmit={async (e) => { e.preventDefault(); try { await repo.renameSpace(name.trim().slice(0, 40)); toast('Nombre actualizado'); setRename(false); } catch { toast('No se guardó.'); } }}>
          <input value={name} maxLength={40} required onChange={(e) => setName(e.target.value)} aria-label="Nombre del cine" />
          <p className="small muted">Ambas personas pueden cambiarlo.</p>
          <button className="btn primary wide" disabled={!name.trim()}>Guardar nombre</button>
        </form>
      </Sheet>
    </div>
  );
}
