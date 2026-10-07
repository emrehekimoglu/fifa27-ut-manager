import { Outlet } from 'react-router';

import { formatBuildInfo, parseBuildInfo } from './lib/build-info';

const buildInfo = parseBuildInfo(__BUILD_INFO__);

export function App() {
  return (
    <div className="app">
      <Outlet />
      <footer className="footer">{formatBuildInfo(buildInfo)}</footer>
    </div>
  );
}
