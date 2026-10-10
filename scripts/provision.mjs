// Crea el espacio privado con exactamente dos miembros. Se ejecuta UNA vez, en tu computadora.
// Uso:
//   npm i -D firebase-admin
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/provision.mjs <spaceId> <uidA> <uidB> ["Nombre del cine"]
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const [spaceId, uidA, uidB, name = 'CINE DE DOS'] = process.argv.slice(2);
if (!spaceId || !uidA || !uidB || uidA === uidB) {
  console.error('Uso: node scripts/provision.mjs <spaceId> <uidA> <uidB> ["Nombre"]');
  process.exit(1);
}
initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const ref = db.doc(`spaces/${spaceId}`);
if ((await ref.get()).exists) { console.error(`El espacio "${spaceId}" ya existe. No se modificó.`); process.exit(1); }
await ref.set({ name, memberUids: [uidA, uidB], createdByUid: uidA, createdAt: FieldValue.serverTimestamp() });
console.log(`Listo: spaces/${spaceId} con miembros ${uidA} y ${uidB}.`);
