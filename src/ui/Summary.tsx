import { useApp } from '../store';
import { daysBetween, todayISO } from '../util';

// RESUMEN DE LA CASA
// Siete cifras sueltas no son una gráfica: son un número protagonista
// (el tiempo juntos) y una fila de indicadores. Sin ejes, sin colores de
// serie; el valor va en tinta y el acento se reserva para el protagonista.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <strong className="tile-value">{value}</strong>
      {note && <span className="tile-note">{note}</span>}
    </div>
  );
}

export function Summary() {
  const { movies, ratings, members, space } = useApp();
  const uids = space?.memberUids ?? [];
  const watched = movies.filter((m) => m.status === 'watched');
  if (!watched.length) return null;

  // Tiempo juntos. Las películas agregadas a mano no traen duración, así que
  // avisamos cuántas faltan en vez de presentar un total que se queda corto.
  const conDuracion = watched.filter((m) => m.runtimeMinutes);
  const minutos = conDuracion.reduce((a, m) => a + (m.runtimeMinutes ?? 0), 0);
  const horas = Math.floor(minutos / 60);
  const sinDuracion = watched.length - conDuracion.length;
  // Con menos de una hora acumulada, «0h» no dice nada: mejor los minutos.
  const [cifra, unidad] = horas > 0 ? [horas, 'h'] : [minutos, 'min'];

  const anio = new Date().getFullYear();
  const esteAnio = watched.filter((m) => m.watchedDate?.startsWith(String(anio))).length;

  const ultima = watched.map((m) => m.watchedDate).filter(Boolean).sort().pop();
  const dias = ultima ? daysBetween(ultima, todayISO()) : null;

  // Qué tanto coinciden: solo cuenta donde los dos pusieron nota.
  const ambas = watched
    .map((m) => uids.map((u) => ratings.find((r) => r.movieId === m.id && r.userUid === u)?.score))
    .filter((par): par is number[] => par.length === 2 && par.every((s) => typeof s === 'number'));
  const coinciden = ambas.length
    ? Math.round(100 - (ambas.reduce((a, [x, y]) => a + Math.abs(x - y), 0) / ambas.length / 9) * 100)
    : null;

  // La favorita: mejor promedio entre las notas que existan.
  const favorita = watched
    .map((m) => {
      const notas = uids.map((u) => ratings.find((r) => r.movieId === m.id && r.userUid === u)?.score).filter((n): n is number => typeof n === 'number');
      return { m, avg: notas.length ? notas.reduce((a, n) => a + n, 0) / notas.length : -1 };
    })
    .sort((a, b) => b.avg - a.avg)[0];

  // Quién propone más.
  const propuestas = uids.map((u) => ({ u, n: movies.filter((m) => m.addedByUid === u).length })).sort((a, b) => b.n - a.n);
  const lider = propuestas[0];
  const empate = propuestas.length > 1 && propuestas[0].n === propuestas[1].n;

  // Mes con más funciones.
  const porMes = new Map<number, number>();
  watched.forEach((m) => { if (m.watchedDate) { const i = Number(m.watchedDate.slice(5, 7)) - 1; porMes.set(i, (porMes.get(i) ?? 0) + 1); } });
  const mesTop = [...porMes.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <section className="resumen" aria-label="Nuestro resumen">
      <div className="res-hero">
        <span className="tile-label">Tiempo juntos</span>
        <strong className="res-n">{cifra}<span className="res-u">{unidad}</span></strong>
        <span className="tile-note">
          en {watched.length} {watched.length === 1 ? 'función' : 'funciones'}
          {sinDuracion > 0 && ` · ${sinDuracion} sin duración registrada`}
        </span>
      </div>

      <div className="res-grid">
        <Tile label="Este año" value={String(esteAnio)} note={esteAnio === 1 ? 'función' : 'funciones'} />
        {dias != null && <Tile label="Última función" value={dias === 0 ? 'Hoy' : dias === 1 ? 'Ayer' : String(dias)} note={dias > 1 ? 'días atrás' : undefined} />}
        {coinciden != null && <Tile label="Coinciden" value={`${coinciden}%`} note={`en ${ambas.length} ${ambas.length === 1 ? 'película' : 'películas'}`} />}
        {mesTop && <Tile label="Su mejor mes" value={MESES[mesTop[0]]} note={`${mesTop[1]} ${mesTop[1] === 1 ? 'función' : 'funciones'}`} />}
        {lider && lider.n > 0 && (
          <Tile
            label="Propone más"
            value={empate ? 'Empate' : members[lider.u]?.displayName ?? '—'}
            note={empate ? `${lider.n} cada quien` : `${lider.n} ${lider.n === 1 ? 'película' : 'películas'}`}
          />
        )}
        {favorita && favorita.avg >= 0 && (
          <Tile label="La favorita" value={favorita.m.title} note={`${favorita.avg.toFixed(1)} de 10`} />
        )}
      </div>
    </section>
  );
}
