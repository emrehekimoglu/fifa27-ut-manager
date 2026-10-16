import { Link, Outlet } from 'react-router';

import { formatBuildInfo, parseBuildInfo } from './lib/build-info';
import { LogoMark } from './shell/icons';
import { MainMenu } from './shell/MainMenu';

const buildInfo = parseBuildInfo(__BUILD_INFO__);

export function App() {
  return (
    <div className="app">
      <a className="skip-link" href="#icerik">
        İçeriğe geç
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <Link className="brand" to="/">
            <LogoMark className="brand__mark" />
            <span className="brand__name">FC 27 UT Manager</span>
          </Link>
          <MainMenu />
        </div>
      </header>
      <main id="icerik" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="footer">{formatBuildInfo(buildInfo)}</footer>
    </div>
  );
}
