import { NavLink } from 'react-router';

import { CardsIcon, HomeIcon, PitchIcon, SourcesIcon } from './icons';

/** The app's sections. The playground becomes the squad builder in M4, under the same entry. */
const SECTIONS = [
  { to: '/', label: 'Ana sayfa', Icon: HomeIcon, end: true },
  { to: '/katalog', label: 'Katalog', Icon: CardsIcon, end: false },
  { to: '/oyun-alani', label: 'Kadro', Icon: PitchIcon, end: false },
  { to: '/kaynaklar', label: 'Kaynaklar', Icon: SourcesIcon, end: false },
] as const;

/** A bottom tab bar on phones, a row of links in the header from 768 px (ADR-0007). */
export function MainMenu() {
  return (
    <nav className="main-menu" aria-label="Ana menü">
      <ul className="main-menu__list">
        {SECTIONS.map(({ to, label, Icon, end }) => (
          <li key={to}>
            <NavLink className="main-menu__link" to={to} end={end}>
              <Icon className="main-menu__icon" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
