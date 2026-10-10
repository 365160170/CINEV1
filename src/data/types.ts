export type Unsub = () => void;
export type MovieStatus = 'pending' | 'watched';

export interface Movie {
  id: string;
  tmdbId: number | null;
  title: string;
  originalTitle: string | null;
  releaseYear: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  runtimeMinutes: number | null;
  source: 'tmdb' | 'manual';
  status: MovieStatus;
  addedByUid: string;
  addedAt: number; // ms
  watchedDate: string | null; // "YYYY-MM-DD", día de calendario canónico
  watchedByUid: string | null;
  updatedAt: number;
}

export type NewMovie = Pick<Movie, 'tmdbId' | 'title' | 'originalTitle' | 'releaseYear' | 'posterPath' | 'backdropPath' | 'overview' | 'runtimeMinutes' | 'source'>;

export interface Rating { movieId: string; userUid: string; score: number }

export interface Member { uid: string; displayName: string; avatarPreset: string; accentColor: string }

export interface Space { id: string; name: string; memberUids: string[]; createdAt: number }

export interface AuthUser { uid: string; email: string | null }

export interface Repo {
  mode: 'demo' | 'firebase';
  watchAuth(cb: (u: AuthUser | null) => void): Unsub;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  watchSpace(cb: (s: Space) => void, onErr: (e: Error) => void): Unsub;
  watchMembers(cb: (m: Record<string, Member>) => void, onErr: (e: Error) => void): Unsub;
  watchMovies(cb: (m: Movie[]) => void, onErr: (e: Error) => void): Unsub;
  watchRatings(cb: (r: Rating[]) => void, onErr: (e: Error) => void): Unsub;
  addMovie(input: NewMovie, uid: string): Promise<{ status: 'added' | 'exists'; id: string }>;
  markWatched(id: string, date: string, uid: string): Promise<void>;
  setWatchedDate(id: string, date: string, uid: string): Promise<void>;
  revertPending(id: string): Promise<void>;
  removeMovie(id: string): Promise<void>;
  renameManual(id: string, title: string, year: number | null): Promise<void>;
  setRating(movieId: string, uid: string, score: number | null): Promise<void>;
  saveMember(uid: string, data: Omit<Member, 'uid'>): Promise<void>;
  renameSpace(name: string): Promise<void>;
}

export class DuplicateError extends Error {}
