import { demoRepo } from './demoRepo';
import { createFirebaseRepo, firebaseConfigured } from './firebaseRepo';
export const repo = firebaseConfigured ? createFirebaseRepo() : demoRepo;
export * from './types';
