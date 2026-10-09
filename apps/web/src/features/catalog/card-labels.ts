import type {
  AccelerateType,
  Attributes,
  CatalogCard,
  FaceStats,
  Foot,
  GoalkeeperFaceStats,
  Position,
} from '@fc27/data-sync';

export interface StatRow {
  readonly label: string;
  readonly value: number;
}

/** A face stat with the attributes it is made of, as on the in-game card. */
export interface StatGroup extends StatRow {
  readonly attributes: readonly StatRow[];
}

const POSITION_NAMES: Record<Position, string> = {
  GK: 'Kaleci',
  RB: 'Sağ bek',
  CB: 'Stoper',
  LB: 'Sol bek',
  CDM: 'Defansif orta saha',
  RM: 'Sağ orta saha',
  CM: 'Merkez orta saha',
  LM: 'Sol orta saha',
  CAM: 'Ofansif orta saha',
  RW: 'Sağ kanat',
  ST: 'Santrafor',
  LW: 'Sol kanat',
};

const ACCELERATE_LABELS: Record<AccelerateType, string> = {
  explosive: 'Patlayıcı',
  mostly_explosive: 'Çoğunlukla patlayıcı',
  controlled_explosive: 'Kontrollü patlayıcı',
  controlled: 'Kontrollü',
  controlled_lengthy: 'Kontrollü uzun',
  mostly_lengthy: 'Çoğunlukla uzun',
  lengthy: 'Uzun',
};

/** Turkish name of a position, e.g. "Santrafor" for ST. */
export function positionName(position: Position): string {
  return POSITION_NAMES[position];
}

export function footLabel(foot: Foot): string {
  return foot === 'right' ? 'Sağ' : 'Sol';
}

export function accelerateLabel(type: AccelerateType): string {
  return ACCELERATE_LABELS[type];
}

type AttributeKey = keyof Attributes;

/** Attributes behind each outfield face stat, in in-game order. */
const OUTFIELD_GROUPS: readonly {
  readonly label: string;
  readonly face: keyof FaceStats;
  readonly attributes: readonly (readonly [string, AttributeKey])[];
}[] = [
  {
    label: 'Hız',
    face: 'pace',
    attributes: [
      ['Hızlanma', 'acceleration'],
      ['Sprint hızı', 'sprintSpeed'],
    ],
  },
  {
    label: 'Şut',
    face: 'shooting',
    attributes: [
      ['Pozisyon alma', 'positioning'],
      ['Bitiricilik', 'finishing'],
      ['Şut gücü', 'shotPower'],
      ['Uzaktan şut', 'longShots'],
      ['Vole', 'volleys'],
      ['Penaltı', 'penalties'],
    ],
  },
  {
    label: 'Pas',
    face: 'passing',
    attributes: [
      ['Vizyon', 'vision'],
      ['Orta', 'crossing'],
      ['Serbest vuruş', 'freeKickAccuracy'],
      ['Kısa pas', 'shortPassing'],
      ['Uzun pas', 'longPassing'],
      ['Falso', 'curve'],
    ],
  },
  {
    label: 'Dripling',
    face: 'dribbling',
    attributes: [
      ['Çeviklik', 'agility'],
      ['Denge', 'balance'],
      ['Reaksiyon', 'reactions'],
      ['Top kontrolü', 'ballControl'],
      ['Dripling', 'dribbling'],
      ['Soğukkanlılık', 'composure'],
    ],
  },
  {
    label: 'Defans',
    face: 'defending',
    attributes: [
      ['Top kapma', 'interceptions'],
      ['Kafa isabeti', 'headingAccuracy'],
      ['Defansif farkındalık', 'defensiveAwareness'],
      ['Ayakta müdahale', 'standingTackle'],
      ['Kayarak müdahale', 'slidingTackle'],
    ],
  },
  {
    label: 'Fizik',
    face: 'physicality',
    attributes: [
      ['Zıplama', 'jumping'],
      ['Dayanıklılık', 'stamina'],
      ['Güç', 'strength'],
      ['Agresiflik', 'aggression'],
    ],
  },
];

/** Attributes behind each goalkeeper face stat, in in-game order. */
const GOALKEEPER_GROUPS: readonly {
  readonly label: string;
  readonly face: keyof GoalkeeperFaceStats;
  readonly attributes: readonly (readonly [string, AttributeKey])[];
}[] = [
  { label: 'Plonjon', face: 'diving', attributes: [['Plonjon', 'gkDiving']] },
  { label: 'Elle kontrol', face: 'handling', attributes: [['Elle kontrol', 'gkHandling']] },
  { label: 'Vuruş', face: 'kicking', attributes: [['Vuruş', 'gkKicking']] },
  { label: 'Refleks', face: 'reflexes', attributes: [['Refleks', 'gkReflexes']] },
  {
    label: 'Hız',
    face: 'speed',
    attributes: [
      ['Hızlanma', 'acceleration'],
      ['Sprint hızı', 'sprintSpeed'],
    ],
  },
  {
    label: 'Pozisyon alma',
    face: 'positioning',
    attributes: [['Pozisyon alma', 'gkPositioning']],
  },
];

/** Face stats with their attributes: six outfield or six goalkeeper groups. */
export function statGroups(card: CatalogCard): readonly StatGroup[] {
  const rows = (attributes: readonly (readonly [string, AttributeKey])[]) =>
    attributes.map(([label, key]) => ({ label, value: card.attributes[key] }));
  const keeper = card.goalkeeperFaceStats;
  if (keeper !== null) {
    return GOALKEEPER_GROUPS.map((group) => ({
      label: group.label,
      value: keeper[group.face],
      attributes: rows(group.attributes),
    }));
  }
  const face = card.faceStats;
  if (face === null) return [];
  return OUTFIELD_GROUPS.map((group) => ({
    label: group.label,
    value: face[group.face],
    attributes: rows(group.attributes),
  }));
}

/** Turkish name of an attribute, e.g. "Hızlanma" for acceleration. */
export function attributeLabel(key: AttributeKey): string {
  const labels = Object.fromEntries(
    [...OUTFIELD_GROUPS, ...GOALKEEPER_GROUPS].flatMap((group) =>
      group.attributes.map(([label, attribute]) => [attribute, label]),
    ),
  ) as Record<AttributeKey, string>;
  return labels[key];
}
