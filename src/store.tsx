import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { repo, type AuthUser, type Member, type Movie, type Rating, type Space } from './data';

type Load = 'loading' | 'ready' | 'denied' | 'error';
interface Ctx {
  user: AuthUser | null; authReady: boolean;
  space: Space | null; members: Record<string, Member>; movies: Movie[]; ratings: Rating[];
  load: Load; retry: () => void;
  me: Member | null; other: Member | null; otherUid: string | null;
  nameOf: (uid: string | null) => string;
  ratingsFor: (movieId: string) => Record<string, number>;
  toast: (msg: string) => void; toastMsg: string | null;
  online: boolean;
}
const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [space, setSpace] = useState<Space | null>(null);
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [movies, setMovies] = useState<Movie[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [load, setLoad] = useState<Load>('loading');
  const [nonce, setNonce] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => repo.watchAuth((u) => { setUser(u); setAuthReady(true); }), []);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener('online', on); addEventListener('offline', off);
    return () => { removeEventListener('online', on); removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (!user) { setSpace(null); setMovies([]); setRatings([]); setMembers({}); return; }
    setLoad('loading');
    const onErr = (e: Error & { code?: string }) => setLoad(e.code === 'permission-denied' || e.message === 'not-found' ? 'denied' : 'error');
    let got = 0;
    const tick = () => { got++; if (got >= 4) setLoad('ready'); };
    const once = <T,>(set: (v: T) => void) => { let first = true; return (v: T) => { set(v); if (first) { first = false; tick(); } }; };
    const subs = [
      repo.watchSpace(once(setSpace), onErr),
      repo.watchMembers(once(setMembers), onErr),
      repo.watchMovies(once(setMovies), onErr),
      repo.watchRatings(once(setRatings), onErr),
    ];
    return () => subs.forEach((u) => u());
  }, [user, nonce]);

  const toast = useCallback((m: string) => { setToastMsg(m); setTimeout(() => setToastMsg((c) => (c === m ? null : c)), 2600); }, []);

  const value = useMemo<Ctx>(() => {
    const me = user ? members[user.uid] ?? null : null;
    const otherUid = space && user ? space.memberUids.find((u) => u !== user.uid) ?? null : null;
    const other = otherUid ? members[otherUid] ?? null : null;
    const byMovie: Record<string, Record<string, number>> = {};
    ratings.forEach((r) => { (byMovie[r.movieId] ||= {})[r.userUid] = r.score; });
    return {
      user, authReady, space, members, movies, ratings, load, retry: () => setNonce((n) => n + 1),
      me, other, otherUid,
      nameOf: (uid) => (uid && members[uid]?.displayName) || (uid === user?.uid ? 'Tú' : 'Tu compañía de cine'),
      ratingsFor: (id) => byMovie[id] ?? {},
      toast, toastMsg, online,
    };
  }, [user, authReady, space, members, movies, ratings, load, toast, toastMsg, online]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useRoute() {
  const [hash, setHash] = useState(location.hash || '#/');
  useEffect(() => { const f = () => { setHash(location.hash || '#/'); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return hash.replace(/^#/, '') || '/';
}
export const go = (path: string) => { location.hash = path; };
