import { Link, Outlet } from 'react-router';

import { formatBuildInfo, parseBuildInfo } from './lib/build-info';
import { AccessGate, AccountMenu } from './shell/AccessGate';
import { LogoMark } from './shell/icons';
import { MainMenu } from './shell/MainMenu';
import { useAccess } from './shell/use-access';

const buildInfo = parseBuildInfo(__BUILD_INFO__);

export function App() {
  const { access, refresh } = useAccess();
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
          {access.status === 'allowed' && (
            <>
              <MainMenu />
              <AccountMenu email={access.email} />
            </>
          )}
        </div>
      </header>
      <main id="icerik" className="app-main" tabIndex={-1}>
        <AccessGate access={access} refresh={refresh}>
          <Outlet />
        </AccessGate>
      </main>
      <footer className="footer">{formatBuildInfo(buildInfo)}</footer>
    </div>
  );
}
