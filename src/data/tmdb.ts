// Cliente TMDB. Usa proxy propio si existe; si no, token v4 (visible en el frontend).
const TOKEN = import.meta.env.VITE_TMDB_TOKEN as string | undefined;
const PROXY = import.meta.env.VITE_TMDB_PROXY_URL as string | undefined;
export const tmdbEnabled = Boolean(TOKEN || PROXY);

export interface TmdbResult {
  tmdbId: number; title: string; originalTitle: string | null; releaseYear: number | null;
  posterPath: string | null; backdropPath: string | null; overview: string | null;
}

async function get<T>(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const base = (PROXY || 'https://api.themoviedb.org/3').replace(/\/$/, '');
  const qs = new URLSearchParams({ language: 'es-MX', ...params });
  const res = await fetch(`${base}${path}?${qs}`, { signal, headers: TOKEN && !PROXY ? { Authorization: `Bearer ${TOKEN}` } : {} });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

export async function searchMovies(q: string, signal?: AbortSignal): Promise<TmdbResult[]> {
  const data = await get<{ results: any[] }>('/search/movie', { query: q, include_adult: 'false', region: 'MX' }, signal);
  return data.results.slice(0, 20).map((r) => ({
    tmdbId: r.id,
    title: r.title || r.original_title,
    originalTitle: r.original_title && r.original_title !== r.title ? r.original_title : null,
    releaseYear: r.release_date ? Number(r.release_date.slice(0, 4)) : null,
    posterPath: r.poster_path ?? null,
    backdropPath: r.backdrop_path ?? null,
    overview: r.overview ? String(r.overview).slice(0, 1200) : null,
  }));
}

export async function movieRuntime(id: number): Promise<number | null> {
  try { const d = await get<{ runtime?: number }>(`/movie/${id}`, {}); return d.runtime || null; } catch { return null; }
}

export async function movieTrailer(id: number): Promise<string | null> {
  try {
    const d = await get<{ results: { site: string; type: string; key: string }[] }>(`/movie/${id}/videos`, { language: 'es-MX,en-US' });
    const v = d.results.find((x) => x.site === 'YouTube' && x.type === 'Trailer');
    return v ? `https://www.youtube.com/watch?v=${v.key}` : null;
  } catch { return null; }
}

export const img = (path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'w1280') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
