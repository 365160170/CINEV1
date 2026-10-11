import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { daysBetween, todayISO, tomarFuncionNueva } from '../util';

// LA MARQUESINA
// El historial de la casa no se presenta como tablero de métricas (número
// gigante, etiqueta chica, rejilla de tarjetas): eso es plantilla, no
// producto. Se presenta como la cartelera de su cine, con foquitos y las
// cifras leídas en renglones, igual que el programa de una sala.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function Summary() {
  const { movies, ratings, members, space } = useApp();
  // Las luces corren una vuelta cuando acaban de registrar una función, y
  // solo entonces: en reposo la marquesina está quieta.
  const [corriendo, setCorriendo] = useState(false);
  useEffect(() => {
    if (!tomarFuncionNueva()) return;
    setCorriendo(true);
    const t = setTimeout(() => setCorriendo(false), 3200);
    return () => clearTimeout(t);
  }, []);
  const uids = space?.memberUids ?? [];
  const watched = movies.filter((m) => m.status === 'watched');
  if (!watched.length) return null;

  // Las películas puestas a mano no traen duración, así que decimos cuántas
  // faltan en vez de dar un total corto y callado.
  const conDuracion = watched.filter((m) => m.runtimeMinutes);
  const minutos = conDuracion.reduce((a, m) => a + (m.runtimeMinutes ?? 0), 0);
  const horas = Math.floor(minutos / 60);
  const sinDuracion = watched.length - conDuracion.length;

  const ultima = watched.map((m) => m.watchedDate).filter(Boolean).sort().pop();
  const dias = ultima ? daysBetween(ultima, todayISO()) : null;

  const ambas = watched
    .map((m) => uids.map((u) => ratings.find((r) => r.movieId === m.id && r.userUid === u)?.score))
    .filter((par): par is number[] => par.length === 2 && par.every((s) => typeof s === 'number'));
  const coinciden = ambas.length
    ? Math.round(100 - (ambas.reduce((a, [x, y]) => a + Math.abs(x - y), 0) / ambas.length / 9) * 100)
    : null;

  const favorita = watched
    .map((m) => {
      const notas = uids.map((u) => ratings.find((r) => r.movieId === m.id && r.userUid === u)?.score).filter((n): n is number => typeof n === 'number');
      return { m, avg: notas.length ? notas.reduce((a, n) => a + n, 0) / notas.length : -1 };
    })
    .sort((a, b) => b.avg - a.avg)[0];

  const propuestas = uids.map((u) => ({ u, n: movies.filter((m) => m.addedByUid === u).length })).sort((a, b) => b.n - a.n);
  const lider = propuestas[0];
  const empate = propuestas.length > 1 && propuestas[0].n === propuestas[1].n;

  const porMes = new Map<number, number>();
  watched.forEach((m) => { if (m.watchedDate) { const i = Number(m.watchedDate.slice(5, 7)) - 1; porMes.set(i, (porMes.get(i) ?? 0) + 1); } });
  const mesTop = [...porMes.entries()].sort((a, b) => b[1] - a[1])[0];

  const renglones: [string, string][] = [];
  if (coinciden != null) renglones.push(['Coinciden', `${coinciden}% en ${ambas.length} ${ambas.length === 1 ? 'película' : 'películas'}`]);
  if (dias != null) renglones.push(['Última función', dias === 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`]);
  if (mesTop) renglones.push(['Su mejor mes', `${MESES[mesTop[0]]}, ${mesTop[1]} ${mesTop[1] === 1 ? 'función' : 'funciones'}`]);
  if (lider && lider.n > 0) renglones.push(['Propone más', empate ? `empate, ${lider.n} cada quien` : `${members[lider.u]?.displayName ?? '—'}, ${lider.n}`]);
  if (favorita && favorita.avg >= 0) renglones.push(['La favorita', `${favorita.m.title} · ${favorita.avg.toFixed(1)}`]);

  const cartel = horas > 0
    ? `${watched.length} ${watched.length === 1 ? 'función' : 'funciones'} · ${horas} ${horas === 1 ? 'hora' : 'horas'} juntos`
    : `${watched.length} ${watched.length === 1 ? 'función' : 'funciones'} · ${minutos} min juntos`;

  return (
    <section className={`marquee ${corriendo ? 'is-corriendo' : ''}`} aria-label="Nuestra marquesina">
      <span className="marquee-bulbs" aria-hidden />
      <div className="marquee-face">
        <p className="marquee-cartel">{cartel}</p>
        {sinDuracion > 0 && (
          <p className="marquee-pie">{sinDuracion} {sinDuracion === 1 ? 'no trae' : 'no traen'} duración, así que el tiempo va corto</p>
        )}
        <dl className="marquee-lineas">
          {renglones.map(([k, v]) => (
            <div key={k} className="marquee-linea">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
