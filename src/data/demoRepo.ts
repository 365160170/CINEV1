// MODO DEMOSTRACIÓN: datos guardados solo en este navegador (localStorage).
// Cada pestaña puede tener una sesión distinta (sessionStorage) para probar A ↔ B en tiempo real.
import type { AuthUser, Member, Movie, NewMovie, Rating, Repo, Space } from './types';

const KEY = 'cdd-demo-v1';
const SESSION = 'cdd-demo-session';
export const DEMO_USERS = [
  { uid: 'demo-a', email: 'persona.a@demo.local', label: 'Persona A' },
  { uid: 'demo-b', email: 'persona.b@demo.local', label: 'Persona B' },
];

interface DB { space: Space; members: Record<string, Member>; movies: Record<string, Movie>; ratings: Record<string, Rating> }

function fresh(): DB {
  return { space: { id: 'demo', name: 'CINE DE DOS', memberUids: DEMO_USERS.map((u) => u.uid), createdAt: Date.now() }, members: {}, movies: {}, ratings: {} };
}
function load(): DB {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : fresh(); } catch { return fresh(); }
}
const listeners = new Set<() => void>();
function save(db: DB) { localStorage.setItem(KEY, JSON.stringify(db)); listeners.forEach((l) => l()); }
function sub(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) fn(); };
  window.addEventListener('storage', onStorage);
  queueMicrotask(fn);
  return () => { listeners.delete(fn); window.removeEventListener('storage', onStorage); };
}
const authListeners = new Set<(u: AuthUser | null) => void>();
function currentUser(): AuthUser | null {
  const uid = sessionStorage.getItem(SESSION);
  const u = DEMO_USERS.find((d) => d.uid === uid);
  return u ? { uid: u.uid, email: u.email } : null;
}
const mutate = async (fn: (db: DB) => void) => { const db = load(); fn(db); save(db); };

export const demoRepo: Repo = {
  mode: 'demo',
  watchAuth(cb) { authListeners.add(cb); queueMicrotask(() => cb(currentUser())); return () => authListeners.delete(cb); },
  async signIn(email) {
    const u = DEMO_USERS.find((d) => d.email === email) ?? DEMO_USERS[0];
    sessionStorage.setItem(SESSION, u.uid);
    authListeners.forEach((l) => l(currentUser()));
  },
  async signOut() { sessionStorage.removeItem(SESSION); authListeners.forEach((l) => l(null)); },
  async resetPassword() {},
  watchSpace(cb) { return sub(() => cb(load().space)); },
  watchMembers(cb) { return sub(() => cb(load().members)); },
  watchMovies(cb) { return sub(() => cb(Object.values(load().movies))); },
  watchRatings(cb) { return sub(() => cb(Object.values(load().ratings))); },
  async addMovie(input: NewMovie, uid) {
    const id = input.tmdbId ? `tmdb_${input.tmdbId}` : `manual_${crypto.randomUUID()}`;
    const db = load();
    if (db.movies[id]) return { status: 'exists', id };
    const now = Date.now();
    db.movies[id] = { ...input, id, status: 'pending', addedByUid: uid, addedAt: now, watchedDate: null, watchedByUid: null, updatedAt: now };
    save(db);
    return { status: 'added', id };
  },
  markWatched: (id, date, uid) => mutate((db) => { const m = db.movies[id]; if (m) Object.assign(m, { status: 'watched', watchedDate: date, watchedByUid: uid, updatedAt: Date.now() }); }),
  setWatchedDate: (id, date, uid) => mutate((db) => { const m = db.movies[id]; if (m) Object.assign(m, { watchedDate: date, watchedByUid: uid, updatedAt: Date.now() }); }),
  revertPending: (id) => mutate((db) => { const m = db.movies[id]; if (m) Object.assign(m, { status: 'pending', watchedDate: null, watchedByUid: null, updatedAt: Date.now() }); }),
  removeMovie: (id) => mutate((db) => { delete db.movies[id]; Object.keys(db.ratings).forEach((k) => { if (db.ratings[k].movieId === id) delete db.ratings[k]; }); }),
  renameManual: (id, title, year) => mutate((db) => { const m = db.movies[id]; if (m && m.source === 'manual') Object.assign(m, { title, releaseYear: year, updatedAt: Date.now() }); }),
  setRating: (movieId, uid, score) => mutate((db) => { const k = `${movieId}_${uid}`; if (score == null) delete db.ratings[k]; else db.ratings[k] = { movieId, userUid: uid, score }; }),
  saveMember: (uid, data) => mutate((db) => { db.members[uid] = { uid, ...data }; }),
  renameSpace: (name) => mutate((db) => { db.space.name = name; }),
};

export function resetDemo() { localStorage.removeItem(KEY); listeners.forEach((l) => l()); }
