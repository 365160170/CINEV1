import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, browserLocalPersistence, setPersistence } from 'firebase/auth';
import {
  getFirestore, doc, collection, onSnapshot, runTransaction, updateDoc, deleteDoc, setDoc,
  serverTimestamp, deleteField, writeBatch, query, where, getDocs, Timestamp,
} from 'firebase/firestore';
import type { Member, Movie, Rating, Repo } from './types';

const env = import.meta.env;
export const firebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_SPACE_ID);

const ms = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : Date.now());

export function createFirebaseRepo(): Repo {
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  const auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence);
  const db = getFirestore(app);
  const spaceId = env.VITE_SPACE_ID as string;
  const spaceRef = doc(db, 'spaces', spaceId);
  const movies = collection(spaceRef, 'movies');
  const ratings = collection(spaceRef, 'ratings');
  const members = collection(spaceRef, 'members');

  return {
    mode: 'firebase',
    watchAuth: (cb) => onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email } : null)),
    signIn: async (e, p) => { await signInWithEmailAndPassword(auth, e, p); },
    signOut: () => signOut(auth),
    resetPassword: (e) => sendPasswordResetEmail(auth, e),
    watchSpace: (cb, onErr) => onSnapshot(spaceRef, (s) => {
      if (!s.exists()) return onErr(new Error('not-found'));
      const d = s.data();
      cb({ id: s.id, name: d.name, memberUids: d.memberUids, createdAt: ms(d.createdAt) });
    }, onErr),
    watchMembers: (cb, onErr) => onSnapshot(members, (q) => {
      const out: Record<string, Member> = {};
      q.forEach((d) => { out[d.id] = { uid: d.id, ...(d.data() as Omit<Member, 'uid'>) }; });
      cb(out);
    }, onErr),
    watchMovies: (cb, onErr) => onSnapshot(movies, (q) => {
      cb(q.docs.map((d) => { const x = d.data(); return { ...x, id: d.id, addedAt: ms(x.addedAt), updatedAt: ms(x.updatedAt) } as Movie; }));
    }, onErr),
    watchRatings: (cb, onErr) => onSnapshot(ratings, (q) => cb(q.docs.map((d) => d.data() as Rating)), onErr),
    async addMovie(input, uid) {
      const id = input.tmdbId ? `tmdb_${input.tmdbId}` : `manual_${crypto.randomUUID()}`;
      const ref = doc(movies, id);
      return runTransaction(db, async (tx) => {
        const cur = await tx.get(ref);
        if (cur.exists()) return { status: 'exists' as const, id };
        tx.set(ref, { ...input, status: 'pending', addedByUid: uid, addedAt: serverTimestamp(), watchedDate: null, watchedByUid: null, updatedAt: serverTimestamp() });
        return { status: 'added' as const, id };
      });
    },
    markWatched: (id, date, uid) => updateDoc(doc(movies, id), { status: 'watched', watchedDate: date, watchedByUid: uid, updatedAt: serverTimestamp() }),
    setWatchedDate: (id, date, uid) => updateDoc(doc(movies, id), { watchedDate: date, watchedByUid: uid, updatedAt: serverTimestamp() }),
    revertPending: (id) => updateDoc(doc(movies, id), { status: 'pending', watchedDate: null, watchedByUid: null, updatedAt: serverTimestamp() }),
    async removeMovie(id) {
      // Las calificaciones solo las borra su dueño; borramos la mía y la película.
      const uid = auth.currentUser?.uid;
      const batch = writeBatch(db);
      if (uid) {
        const mine = await getDocs(query(ratings, where('movieId', '==', id), where('userUid', '==', uid)));
        mine.forEach((d) => batch.delete(d.ref));
      }
      batch.delete(doc(movies, id));
      await batch.commit();
    },
    renameManual: (id, title, year) => updateDoc(doc(movies, id), { title, releaseYear: year, updatedAt: serverTimestamp() }),
    async setRating(movieId, uid, score) {
      const ref = doc(ratings, `${movieId}_${uid}`);
      if (score == null) return deleteDoc(ref);
      await setDoc(ref, { movieId, userUid: uid, score, updatedAt: serverTimestamp() });
    },
    saveMember: (uid, data) => setDoc(doc(members, uid), { ...data, updatedAt: serverTimestamp() }),
    renameSpace: (name) => updateDoc(spaceRef, { name }),
  };
}
void deleteField;
