export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// Fecha como día de calendario: nunca se recorre al cambiar de zona horaria.
export function formatDay(iso: string | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', opts);
}
export const formatMs = (ms: number) => new Date(ms).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
export function hashHue(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

/** Días completos entre dos días de calendario «YYYY-MM-DD». */
export function daysBetween(fromISO: string, toISO: string) {
  const u = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((u(toISO) - u(fromISO)) / 86400000);
}

// Una función recién registrada enciende la marquesina y sella el boleto.
// Va por sessionStorage porque el gesto ocurre en la ficha y la celebración
// se ve en el inicio, después de navegar.
const FUNCION_NUEVA = 'cdd-funcion-nueva';

export function marcarFuncionNueva() {
  respuesta = null;
  try { sessionStorage.setItem(FUNCION_NUEVA, String(Date.now())); } catch { /* sin almacenamiento, sin fiesta */ }
}

// La respuesta se calcula una vez por carga: la marquesina y el boleto
// preguntan por separado y los dos tienen que recibir el mismo sí.
let respuesta: boolean | null = null;

/** True si acaban de registrar una función, durante esta carga de la página. */
export function tomarFuncionNueva() {
  if (respuesta !== null) return respuesta;
  try {
    const t = Number(sessionStorage.getItem(FUNCION_NUEVA));
    sessionStorage.removeItem(FUNCION_NUEVA);
    respuesta = Boolean(t) && Date.now() - t < 120000;
  } catch { respuesta = false; }
  return respuesta;
}
