import { formatBuildInfo, parseBuildInfo } from './lib/build-info';

const buildInfo = parseBuildInfo(__BUILD_INFO__);

export function App() {
  return (
    <div className="app">
      <main className="hero">
        <h1 className="hero__title">FC 27 UT Manager</h1>
        <p className="hero__lead">Ultimate Team kadro kurucu ve oyuncu öneri motoru.</p>
        <p className="hero__status" role="status">
          Yapım aşamasında: v0.1 geliştiriliyor
        </p>
      </main>
      <footer className="footer">{formatBuildInfo(buildInfo)}</footer>
    </div>
  );
}
