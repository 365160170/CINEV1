// Pruebas de autorización con Firebase Emulator Suite.
// Ejecutar: npm run test:rules  (requiere Java y firebase-tools: npm i -g firebase-tools)
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;
const S = 'spaces/cine';
const movie = (uid: string) => ({
  tmdbId: 157336, title: 'Interstellar', originalTitle: null, releaseYear: 2014, posterPath: null, backdropPath: null,
  overview: null, runtimeMinutes: 169, source: 'tmdb', status: 'pending', addedByUid: uid,
  addedAt: serverTimestamp(), watchedDate: null, watchedByUid: null, updatedAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'cine-de-dos-test', firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
});
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), S), { name: 'CINE DE DOS', memberUids: ['A', 'B'], createdByUid: 'A', createdAt: new Date() });
  });
});
const db = (uid?: string) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();

describe('acceso', () => {
  it('no autenticado no lee', () => assertFails(getDoc(doc(db(), S))));
  it('tercero autenticado no lee aunque conozca el spaceId', () => assertFails(getDoc(doc(db('C'), S))));
  it('miembro lee', () => assertSucceeds(getDoc(doc(db('A'), S))));
  it('nadie modifica memberUids', () => assertFails(updateDoc(doc(db('A'), S), { memberUids: ['A', 'C'] })));
  it('miembro renombra el cine', () => assertSucceeds(updateDoc(doc(db('B'), S), { name: 'Nuestro cine' })));
});

describe('películas', () => {
  it('A agrega con su uid', () => assertSucceeds(setDoc(doc(db('A'), `${S}/movies/tmdb_157336`), movie('A'))));
  it('A no suplanta a B', () => assertFails(setDoc(doc(db('A'), `${S}/movies/tmdb_157336`), movie('B'))));
  it('id debe coincidir con tmdbId', () => assertFails(setDoc(doc(db('A'), `${S}/movies/tmdb_1`), movie('A'))));
  it('tercero no agrega', () => assertFails(setDoc(doc(db('C'), `${S}/movies/tmdb_157336`), movie('C'))));
  it('no se sobrescribe la autoría', async () => {
    await setDoc(doc(db('A'), `${S}/movies/tmdb_157336`), movie('A'));
    await assertFails(setDoc(doc(db('B'), `${S}/movies/tmdb_157336`), movie('B')));
    await assertFails(updateDoc(doc(db('B'), `${S}/movies/tmdb_157336`), { addedByUid: 'B', updatedAt: serverTimestamp() }));
  });
  it('B marca vista con fecha', async () => {
    await setDoc(doc(db('A'), `${S}/movies/tmdb_157336`), movie('A'));
    await assertSucceeds(updateDoc(doc(db('B'), `${S}/movies/tmdb_157336`), { status: 'watched', watchedDate: '2026-10-10', watchedByUid: 'B', updatedAt: serverTimestamp() }));
  });
  it('fecha inválida falla', async () => {
    await setDoc(doc(db('A'), `${S}/movies/tmdb_157336`), movie('A'));
    await assertFails(updateDoc(doc(db('B'), `${S}/movies/tmdb_157336`), { status: 'watched', watchedDate: 'ayer', watchedByUid: 'B', updatedAt: serverTimestamp() }));
  });
});

describe('calificaciones', () => {
  const r = (uid: string, score: number) => ({ movieId: 'tmdb_157336', userUid: uid, score, updatedAt: serverTimestamp() });
  it('A califica la suya', () => assertSucceeds(setDoc(doc(db('A'), `${S}/ratings/tmdb_157336_A`), r('A', 9))));
  it('A no escribe la nota de B', () => assertFails(setDoc(doc(db('A'), `${S}/ratings/tmdb_157336_B`), r('B', 1))));
  it('fuera de rango falla', () => assertFails(setDoc(doc(db('A'), `${S}/ratings/tmdb_157336_A`), r('A', 11))));
  it('B no borra la nota de A', async () => {
    await setDoc(doc(db('A'), `${S}/ratings/tmdb_157336_A`), r('A', 9));
    await assertFails(deleteDoc(doc(db('B'), `${S}/ratings/tmdb_157336_A`)));
  });
});

describe('perfiles', () => {
  const p = { displayName: 'Alex', avatarPreset: 'round', accentColor: '#E64D42', updatedAt: serverTimestamp() };
  it('A edita su perfil', () => assertSucceeds(setDoc(doc(db('A'), `${S}/members/A`), p)));
  it('A no edita el de B', () => assertFails(setDoc(doc(db('A'), `${S}/members/B`), p)));
  it('colecciones fuera del espacio cerradas', () => assertFails(getDoc(doc(db('A'), 'users/A'))));
});
