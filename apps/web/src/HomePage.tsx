import { Link } from 'react-router';

export function HomePage() {
  return (
    <main className="hero">
      <h1 className="hero__title">FC 27 UT Manager</h1>
      <p className="hero__lead">Ultimate Team kadro kurucu ve oyuncu öneri motoru.</p>
      <p className="hero__status" role="status">
        Yapım aşamasında: v0.1 geliştiriliyor
      </p>
      <Link className="hero__link" to="/kaynaklar">
        Veri kaynakları
      </Link>
    </main>
  );
}
