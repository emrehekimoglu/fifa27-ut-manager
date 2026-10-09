import type { CatalogCard } from '@fc27/data-sync';
import { FORMATIONS, stylesFor } from '@fc27/domain';
import type { CardStats } from '@fc27/domain';
import { useState } from 'react';

import { CardImage } from '../catalog/CardImage';
import { positionName } from '../catalog/card-labels';
import { CardPicker } from './CardPicker';
import { pitchSpot } from './pitch';
import {
  changeFormation,
  chooseStyle,
  evaluate,
  formationLabel,
  newPlayground,
  placeCard,
  removeCard,
} from './playground';
import type { EvaluatedSlot } from './playground';
import { statChanges } from './stat-changes';
import type { StatChange } from './stat-changes';

const slotTitle = (slot: EvaluatedSlot) => `${slot.code} · ${positionName(slot.position)}`;

/** The spot's name for screen readers, e.g. "ST · Santrafor, Pelé 95". */
function spotLabel(slot: EvaluatedSlot): string {
  if (slot.card === null) return `${slotTitle(slot)}, boş`;
  const card = `${slot.card.name} ${slot.card.overall}`;
  return `${slotTitle(slot)}, ${card}${slot.inPosition ? '' : ', mevki dışı'}`;
}

/** The surname the in-game card prints, e.g. "Courtois" for Thibaut Courtois. */
const shortName = (card: CatalogCard) => card.name.split(' ').at(-1) ?? card.name;

function ChemistryPips({ chemistry }: { readonly chemistry: number }) {
  return (
    <span className="pips" aria-hidden="true">
      {[1, 2, 3].map((level) => (
        <span key={level} className={level <= chemistry ? 'pip pip--on' : 'pip'} />
      ))}
    </span>
  );
}

interface PitchProps {
  readonly slots: readonly EvaluatedSlot[];
  readonly selected: number | null;
  readonly onSelect: (index: number) => void;
}

/** The XI in its formation, attack at the top (SQD-8). */
function Pitch({ slots, selected, onSelect }: PitchProps) {
  return (
    <div className="pitch">
      <div className="pitch__markings" aria-hidden="true">
        <span className="pitch__halfway" />
        <span className="pitch__circle" />
        <span className="pitch__box pitch__box--top" />
        <span className="pitch__box pitch__box--bottom" />
      </div>
      <ol className="pitch__spots" aria-label="Saha">
        {slots.map((slot, index) => {
          const { x, y } = pitchSpot(slot);
          const { card } = slot;
          const classes = [
            'pitch-card',
            card === null ? 'pitch-card--empty' : '',
            card !== null && !slot.inPosition ? 'pitch-card--off' : '',
          ].join(' ');
          return (
            <li key={slot.code} className="pitch__spot" style={{ left: `${x}%`, top: `${y}%` }}>
              <button
                type="button"
                className={classes.trim()}
                aria-label={spotLabel(slot)}
                aria-pressed={selected === index}
                onClick={() => {
                  onSelect(index);
                }}
              >
                {card === null ? (
                  <span className="pitch-card__add" aria-hidden="true">
                    +
                  </span>
                ) : (
                  <>
                    <span className="pitch-card__rating">{card.overall}</span>
                    <span className="pitch-card__name">{shortName(card)}</span>
                    {slot.inPosition ? (
                      <ChemistryPips chemistry={slot.chemistry} />
                    ) : (
                      <span className="pitch-card__off" aria-hidden="true">
                        !
                      </span>
                    )}
                  </>
                )}
                <span className="pitch-card__code">{slot.code}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Change({ change }: { readonly change: number }) {
  if (change === 0) return null;
  return (
    <>
      {' '}
      <span className="stat-change">{change > 0 ? `+${change}` : String(change)}</span>
    </>
  );
}

function StatLine({ stat }: { readonly stat: StatChange }) {
  return (
    <li className={stat.change === 0 ? 'stat-line' : 'stat-line stat-line--changed'}>
      <span className="stat-line__label">{stat.label}</span>{' '}
      <span className="stat-line__value">{stat.value}</span>
      <Change change={stat.change} />
    </li>
  );
}

function SlotStats({ card, stats }: { readonly card: CatalogCard; readonly stats: CardStats }) {
  const groups = statChanges(card, stats);
  if (groups.length === 0) return null;
  return (
    <>
      <ul className="face-stats" aria-label="İstatistikler">
        {groups.map((group) => (
          <StatLine key={group.label} stat={group} />
        ))}
      </ul>
      <details className="all-stats">
        <summary>Tüm statlar</summary>
        <div className="all-stats__groups">
          {groups.map((group) => (
            <section key={group.label} className="all-stats__group" aria-label={group.label}>
              <h4 className="all-stats__title">
                {group.label} <span className="stat-group__value">{group.value}</span>
                <Change change={group.change} />
              </h4>
              <ul className="all-stats__rows">
                {group.attributes.map((row) => (
                  <StatLine key={row.label} stat={row} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </details>
    </>
  );
}

interface SlotPanelProps {
  readonly slot: EvaluatedSlot;
  readonly onPick: () => void;
  readonly onRemove: () => void;
  readonly onStyle: (styleId: number | null) => void;
}

function SlotPanel({ slot, onPick, onRemove, onStyle }: SlotPanelProps) {
  const { card, stats } = slot;
  return (
    <section className="slot-panel" aria-labelledby="slot-panel-title">
      <h2 id="slot-panel-title" className="slot__title">
        {slotTitle(slot)}
      </h2>
      {card === null ? (
        <>
          <p className="slot__empty">Boş</p>
          <button type="button" className="button--primary" onClick={onPick}>
            Kart seç
          </button>
        </>
      ) : (
        <>
          <div className="slot__card">
            <CardImage card={card} size={56} />
            <span className="sample__name">
              {card.name} <span className="rating-chip">{card.overall}</span>
            </span>
          </div>
          <dl className="facts">
            <div>
              <dt>Kimya</dt>
              <dd className={slot.inPosition ? undefined : 'status status--error'}>
                {slot.inPosition ? `${slot.chemistry} / 3` : 'Mevki dışı'}
              </dd>
            </div>
          </dl>
          <label className="field">
            <span>Kimya stili</span>
            <select
              value={slot.styleId ?? ''}
              onChange={(event) => {
                const { value } = event.target;
                onStyle(value === '' ? null : Number(value));
              }}
            >
              <option value="">Stil yok</option>
              {stylesFor(card).map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </label>
          {stats && <SlotStats card={card} stats={stats} />}
          <div className="slot__actions">
            <button type="button" onClick={onPick}>
              Değiştir
            </button>
            <button type="button" onClick={onRemove}>
              Çıkar
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export function PlaygroundPage() {
  const [playground, setPlayground] = useState(newPlayground);
  const [selected, setSelected] = useState<number | null>(null);
  const [picking, setPicking] = useState<number | null>(null);
  const evaluation = evaluate(playground);
  const selectedSlot = selected === null ? undefined : evaluation.slots[selected];
  const pickingSlot = picking === null ? undefined : evaluation.slots[picking];

  return (
    <div className="page">
      <h1 className="page__title">Kadro deneme alanı</h1>
      <p className="page__lead">
        Diziliş seç ve kartları sahaya yerleştir. Kimya ve kadro reytingi anında hesaplanır.
      </p>

      <label className="field playground__formation">
        <span>Diziliş</span>
        <select
          value={playground.formationId}
          onChange={(event) => {
            setPlayground((current) => changeFormation(current, Number(event.target.value)));
          }}
        >
          {FORMATIONS.map((formation) => (
            <option key={formation.id} value={formation.id}>
              {formationLabel(formation.name)}
            </option>
          ))}
        </select>
      </label>

      <section className="summary" aria-labelledby="playground-summary-title">
        <h2 id="playground-summary-title" className="visually-hidden">
          Kadro özeti
        </h2>
        <dl className="summary__stats">
          <div>
            <dt>Kadro reytingi</dt>
            <dd>{evaluation.rating}</dd>
          </div>
          <div>
            <dt>Takım kimyası</dt>
            <dd>{evaluation.chemistry} / 33</dd>
          </div>
        </dl>
      </section>

      <div className="board">
        <Pitch
          slots={evaluation.slots}
          selected={selected}
          onSelect={(index) => {
            setSelected(index);
            if (evaluation.slots[index]?.card === null) setPicking(index);
          }}
        />
        <div className="board__panel">
          {selected !== null && selectedSlot ? (
            <SlotPanel
              slot={selectedSlot}
              onPick={() => {
                setPicking(selected);
              }}
              onRemove={() => {
                setPlayground((current) => removeCard(current, selected));
              }}
              onStyle={(styleId) => {
                setPlayground((current) => chooseStyle(current, selected, styleId));
              }}
            />
          ) : (
            <p className="board__hint">Ayrıntıları görmek için sahadaki bir oyuncuya dokun.</p>
          )}
        </div>
      </div>

      {picking !== null && pickingSlot && (
        <CardPicker
          slotCode={pickingSlot.code}
          position={pickingSlot.position}
          onPick={(card) => {
            setPlayground((current) => placeCard(current, picking, card));
            setPicking(null);
          }}
          onClose={() => {
            setPicking(null);
          }}
        />
      )}
    </div>
  );
}
