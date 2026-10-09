import type { CatalogCard } from '@fc27/data-sync';
import { FORMATIONS, stylesFor } from '@fc27/domain';
import { useState } from 'react';
import { Link } from 'react-router';

import { CardImage } from '../catalog/CardImage';
import { positionName, statGroups } from '../catalog/card-labels';
import { CardPicker } from './CardPicker';
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

interface SlotCardProps {
  readonly index: number;
  readonly slot: EvaluatedSlot;
  readonly onPick: () => void;
  readonly onRemove: () => void;
  readonly onStyle: (styleId: number | null) => void;
}

function SlotStats({ card, slot }: { readonly card: CatalogCard; readonly slot: EvaluatedSlot }) {
  if (!slot.stats) return null;
  const groups = statGroups({ ...card, ...slot.stats });
  return (
    <ul className="slot__stats" aria-label="İstatistikler">
      {groups.map((group) => (
        <li key={group.label}>
          {group.label} {group.value}
        </li>
      ))}
    </ul>
  );
}

function SlotCard({ index, slot, onPick, onRemove, onStyle }: SlotCardProps) {
  const titleId = `slot-${index}`;
  const { card } = slot;
  return (
    <li>
      <section className="slot" aria-labelledby={titleId}>
        <h3 id={titleId} className="slot__title">
          {slot.code} · {positionName(slot.position)}
        </h3>
        {card === null ? (
          <>
            <p className="panel__note">Boş</p>
            <button type="button" onClick={onPick}>
              Kart seç
            </button>
          </>
        ) : (
          <>
            <div className="slot__card">
              <CardImage card={card} size={48} />
              <span className="sample__name">
                {card.name} {card.overall}
              </span>
            </div>
            <dl className="source__facts">
              <div>
                <dt>Kimya</dt>
                <dd className={slot.inPosition ? undefined : 'status status--error'}>
                  {slot.inPosition ? `${slot.chemistry} / 3` : 'Mevki dışı'}
                </dd>
              </div>
            </dl>
            <label className="catalog-filters__field">
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
            <SlotStats card={card} slot={slot} />
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
    </li>
  );
}

export function PlaygroundPage() {
  const [playground, setPlayground] = useState(newPlayground);
  const [picking, setPicking] = useState<number | null>(null);
  const evaluation = evaluate(playground);
  const pickingSlot = picking === null ? undefined : evaluation.slots[picking];

  return (
    <main className="page">
      <nav className="page__nav">
        <Link to="/">← Ana sayfa</Link>
      </nav>
      <h1 className="page__title">Kadro deneme alanı</h1>
      <p className="page__lead">
        Diziliş seç ve kartları yerleştir. Kimya ve kadro reytingi anında hesaplanır.
      </p>

      <label className="catalog-filters__field playground__formation">
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

      <section className="panel source" aria-labelledby="playground-summary-title">
        <h2 id="playground-summary-title">Kadro özeti</h2>
        <dl className="source__facts">
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

      <ul className="slots" aria-label="Kadro">
        {evaluation.slots.map((slot, index) => (
          <SlotCard
            key={slot.code}
            index={index}
            slot={slot}
            onPick={() => {
              setPicking(index);
            }}
            onRemove={() => {
              setPlayground((current) => removeCard(current, index));
            }}
            onStyle={(styleId) => {
              setPlayground((current) => chooseStyle(current, index, styleId));
            }}
          />
        ))}
      </ul>

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
    </main>
  );
}
