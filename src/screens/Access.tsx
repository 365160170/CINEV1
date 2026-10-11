import { useState } from 'react';
import { repo } from '../data';
import { DEMO_USERS, resetDemo } from '../data/demoRepo';
import { useApp } from '../store';
import { Avatar } from '../ui/components';

export function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const demo = repo.mode === 'demo';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try { await repo.signIn(email.trim(), pw); }
    catch (x: any) {
      const c = x?.code ?? '';
      setErr(c.includes('invalid') || c.includes('wrong') || c.includes('user-not-found') ? 'El correo o la contraseña no coinciden.' : c.includes('too-many') ? 'Demasiados intentos. Espera unos minutos.' : 'No pudimos entrar. Revisa tu conexión e inténtalo otra vez.');
    } finally { setBusy(false); }
  };
  const reset = async () => {
    if (!email.trim()) { setErr('Escribe tu correo arriba y vuelve a tocar «Olvidé mi contraseña».'); return; }
    try { await repo.resetPassword(email.trim()); setInfo('Te enviamos un correo para restablecer tu contraseña.'); setErr(null); }
    catch { setErr('No pudimos enviar el correo. Revisa que esté bien escrito.'); }
  };

  return (
    <main className="access">
      <div className="access-card">
        <p className="ticket-no">Función privada</p>
        <h1 className="wordmark">Cine de Dos</h1>
        <p className="tagline">Nuestra cartelera, nuestras historias.</p>
        {demo ? (
          <div className="stack">
            <p className="note">Modo demostración: los datos se guardan solo en este navegador. Abre otra pestaña con la otra persona para ver la sincronización.</p>
            {DEMO_USERS.map((u) => (
              <button key={u.uid} className="btn ghost wide" onClick={() => repo.signIn(u.email, '')}>Entrar como {u.label}</button>
            ))}
            <button className="link" onClick={() => { if (confirm('¿Borrar todos los datos de demostración?')) resetDemo(); }}>Borrar datos de demostración</button>
          </div>
        ) : (
          <form className="stack" onSubmit={submit}>
            <label className="field"><span>Correo</span><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="field"><span>Contraseña</span><input type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
            {err && <p className="error" role="alert">{err}</p>}
            {info && <p className="note" role="status">{info}</p>}
            <button className="btn primary wide" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
            <button type="button" className="link" onClick={reset}>Olvidé mi contraseña</button>
          </form>
        )}
      </div>
    </main>
  );
}

export function Denied({ kind }: { kind: 'denied' | 'error' }) {
  const { retry } = useApp();
  return (
    <main className="access">
      <div className="access-card">
        <h1 className="serif big">{kind === 'denied' ? 'Esta sala es privada' : 'Se cortó la proyección'}</h1>
        <p className="muted">{kind === 'denied' ? 'Esta cuenta no tiene entrada para este cine. Si debería tenerla, pídele a la otra persona que la agregue.' : 'No pudimos cargar la cartelera. Revisa tu conexión.'}</p>
        <div className="row">
          {kind === 'error' && <button className="btn primary" onClick={retry}>Reintentar</button>}
          <button className="btn ghost" onClick={() => repo.signOut()}>Cerrar sesión</button>
        </div>
      </div>
    </main>
  );
}

// Colores de la casa: vivos, claros y con la inicial oscura encima.
export const COLORS = ['#FF6F91', '#FFC56E', '#5CE1C6', '#A78BFA', '#7FC8F8', '#FF9F6E'];
export const PRESETS = [{ id: 'round', label: 'Círculo' }, { id: 'ticket', label: 'Boleto' }, { id: 'frame', label: 'Cuadro' }];

export function ProfileForm({ onDone, first }: { onDone?: () => void; first?: boolean }) {
  const { user, me, toast } = useApp();
  const [name, setName] = useState(me?.displayName ?? '');
  const [color, setColor] = useState(me?.accentColor ?? COLORS[0]);
  const [preset, setPreset] = useState(me?.avatarPreset ?? 'round');
  const [busy, setBusy] = useState(false);
  const preview = { uid: user!.uid, displayName: name || '?', accentColor: color, avatarPreset: preset };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return; setBusy(true);
    try { await repo.saveMember(user!.uid, { displayName: name.trim().slice(0, 30), accentColor: color, avatarPreset: preset }); toast(first ? `Qué bueno verte, ${name.trim()}` : 'Perfil guardado'); onDone?.(); }
    catch { toast('No se guardó. Necesitas conexión.'); }
    finally { setBusy(false); }
  };
  return (
    <form className="stack" onSubmit={save}>
      <div className="profile-preview"><Avatar member={preview} size={72} /></div>
      <label className="field"><span>¿Cómo quieres que te vean?</span>
        <input value={name} maxLength={30} required placeholder="Tu nombre" onChange={(e) => setName(e.target.value)} autoFocus={first} /></label>
      <fieldset className="field"><legend>Tu color</legend>
        <div className="swatches">{COLORS.map((c) => <button type="button" key={c} className={`swatch ${c === color ? 'on' : ''}`} style={{ background: c }} aria-label={`Color ${c}`} aria-pressed={c === color} onClick={() => setColor(c)} />)}</div>
      </fieldset>
      <fieldset className="field"><legend>Forma del avatar</legend>
        <div className="seg">{PRESETS.map((p) => <button type="button" key={p.id} className={preset === p.id ? 'on' : ''} aria-pressed={preset === p.id} onClick={() => setPreset(p.id)}>{p.label}</button>)}</div>
      </fieldset>
      <button className="btn primary wide" disabled={busy || !name.trim()}>{first ? 'Entrar al cine' : 'Guardar perfil'}</button>
    </form>
  );
}

export function Onboarding() {
  return (
    <main className="access">
      <div className="access-card">
        <p className="ticket-no">Primera función</p>
        <h1 className="serif big">Antes de entrar</h1>
        <p className="muted">Elige cómo te verá la otra persona. Puedes cambiarlo después.</p>
        <ProfileForm first />
      </div>
    </main>
  );
}
