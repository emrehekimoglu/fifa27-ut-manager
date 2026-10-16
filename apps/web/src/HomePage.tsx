import { Link } from 'react-router';

import { CardsIcon, PitchIcon, SourcesIcon } from './shell/icons';

const FEATURES = [
  {
    to: '/oyun-alani',
    title: 'Kadro deneme alanı',
    text: 'Diziliş seç, kartları yerleştir; kimya ve kadro reytingini anında gör.',
    Icon: PitchIcon,
  },
  {
    to: '/katalog',
    title: 'Kart kataloğu',
    text: 'Tüm FC 27 kartlarında isimle ve mevkiyle ara, istatistiklerini incele.',
    Icon: CardsIcon,
  },
  {
    to: '/kaynaklar',
    title: 'Veri kaynakları',
    text: 'Kart verisinin nereden geldiğini ve son senkronizasyonun durumunu gör.',
    Icon: SourcesIcon,
  },
] as const;

export function HomePage() {
  return (
    <div className="page home">
      <section className="hero">
        <p className="hero__status" role="status">
          Yapım aşamasında: v0.1 geliştiriliyor
        </p>
        <h1 className="hero__title">FC 27 UT Manager</h1>
        <p className="hero__lead">Ultimate Team kadro kurucu ve oyuncu öneri motoru.</p>
      </section>
      <ul className="feature-grid" aria-label="Bölümler">
        {FEATURES.map(({ to, title, text, Icon }) => (
          <li key={to}>
            <Link className="feature" to={to}>
              <span className="feature__icon">
                <Icon />
              </span>
              <span className="feature__title">{title}</span>
              <span className="feature__text">{text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
