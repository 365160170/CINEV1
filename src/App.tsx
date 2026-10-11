import { useState } from 'react';
import { Intro } from './ui/Intro';
import { Clapperboard, Home as HomeIcon, Search as SearchIcon, Users } from 'lucide-react';
import { repo } from './data';
import { go, useApp, useRoute } from './store';
import { Denied, Login, Onboarding } from './screens/Access';
import { Home } from './screens/Home';
import { List } from './screens/List';
import { Search } from './screens/Search';
import { Detail } from './screens/Detail';
import { Us } from './screens/Us';

const NAV = [
  { path: '/', label: 'Inicio', Icon: HomeIcon },
  { path: '/lista', label: 'Nuestra lista', Icon: Clapperboard },
  { path: '/buscar', label: 'Agregar', Icon: SearchIcon },
  { path: '/nosotros', label: 'Nosotros', Icon: Users },
];

export function App() {
  const [intro, setIntro] = useState(() => { try { return !sessionStorage.getItem('cdd-intro'); } catch { return true; } });
  const endIntro = () => { try { sessionStorage.setItem('cdd-intro', '1'); } catch {} setIntro(false); };
  return <>{intro && <Intro onDone={endIntro} />}<AppBody /></>;
}

function AppBody() {
  const { user, authReady, load, me, toastMsg, online, space } = useApp();
  const route = useRoute();

  if (!authReady) return <div className="splash"><span className="wordmark">Cine de Dos</span></div>;
  if (!user) return <><header className="bars"><DemoBanner /></header><Login /></>;
  if (load === 'denied' || load === 'error') return <Denied kind={load} />;
  if (load === 'ready' && !me) return <><header className="bars"><DemoBanner /></header><Onboarding /></>;

  const detail = route.match(/^\/peli\/(.+)$/);
  const screen = detail ? <Detail id={decodeURIComponent(detail[1])} /> :
    route === '/lista' ? <List /> : route === '/buscar' ? <Search /> : route === '/nosotros' ? <Us /> : <Home />;
  const active = detail ? '/lista' : NAV.find((n) => n.path === route)?.path ?? '/';

  return (
    <div className="shell">
      <div className="ambient" aria-hidden />
      <header className="bars">
        <DemoBanner />
        {!online && <p className="offline" role="status">Sin conexión. Pueden ver la cartelera, pero no guardar cambios.</p>}
      </header>
      <nav className="nav" aria-label="Principal">
        <span className="wordmark sm nav-brand">{space?.name ?? 'Cine de Dos'}</span>
        {NAV.map(({ path, label, Icon }) => (
          <button key={path} className={`nav-item ${active === path ? 'on' : ''}`} aria-current={active === path ? 'page' : undefined} onClick={() => go(path)}>
            <Icon size={22} strokeWidth={1.5} aria-hidden /><span>{label}</span>
          </button>
        ))}
      </nav>
      <main className="main">{screen}</main>
      {toastMsg && <div className="toast" role="status" aria-live="polite">{toastMsg}</div>}
    </div>
  );
}

function DemoBanner() {
  if (repo.mode !== 'demo') return null;
  return <p className="demo-banner">Modo demostración. Los datos viven solo en este navegador.</p>;
}
