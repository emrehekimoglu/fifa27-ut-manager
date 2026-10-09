import type { Position } from '@fc27/data-sync';

export interface Role {
  readonly name: string;
  /** The card position the role belongs to. */
  readonly position: Position;
  /** EA's id of the Role+ version, as stored in a card's `rolesPlus`. */
  readonly plusId: number;
  /** EA's id of the Role++ version, as stored in a card's `rolesPlusPlus`. */
  readonly plusPlusId: number;
}

/** Every FC 27 role (source: FUT.GG, `/api/fut/roles/`, 2026-10-09). */
export const ROLES: readonly Role[] = [
  { name: 'Goalkeeper', position: 'GK', plusId: 1, plusPlusId: 101 },
  { name: 'Sweeper Keeper', position: 'GK', plusId: 2, plusPlusId: 102 },
  { name: 'Fullback', position: 'RB', plusId: 3, plusPlusId: 103 },
  { name: 'Falseback', position: 'RB', plusId: 4, plusPlusId: 104 },
  { name: 'Wingback', position: 'RB', plusId: 5, plusPlusId: 105 },
  { name: 'Attacking Wingback', position: 'RB', plusId: 6, plusPlusId: 106 },
  { name: 'Fullback', position: 'LB', plusId: 7, plusPlusId: 107 },
  { name: 'Falseback', position: 'LB', plusId: 8, plusPlusId: 108 },
  { name: 'Wingback', position: 'LB', plusId: 9, plusPlusId: 109 },
  { name: 'Attacking Wingback', position: 'LB', plusId: 10, plusPlusId: 110 },
  { name: 'Defender', position: 'CB', plusId: 11, plusPlusId: 111 },
  { name: 'Stopper', position: 'CB', plusId: 12, plusPlusId: 112 },
  { name: 'Ball-Playing Defender', position: 'CB', plusId: 13, plusPlusId: 113 },
  { name: 'Holding', position: 'CDM', plusId: 14, plusPlusId: 114 },
  { name: 'Centre-Half', position: 'CDM', plusId: 15, plusPlusId: 115 },
  { name: 'Deep-Lying Playmaker', position: 'CDM', plusId: 16, plusPlusId: 116 },
  { name: 'Box-To-Box', position: 'CM', plusId: 18, plusPlusId: 118 },
  { name: 'Holding', position: 'CM', plusId: 19, plusPlusId: 119 },
  { name: 'Deep-Lying Playmaker', position: 'CM', plusId: 20, plusPlusId: 120 },
  { name: 'Playmaker', position: 'CM', plusId: 21, plusPlusId: 121 },
  { name: 'Half-Winger', position: 'CM', plusId: 22, plusPlusId: 122 },
  { name: 'Winger', position: 'RM', plusId: 23, plusPlusId: 123 },
  { name: 'Wide Midfielder', position: 'RM', plusId: 24, plusPlusId: 124 },
  { name: 'Wide Playmaker', position: 'RM', plusId: 25, plusPlusId: 125 },
  { name: 'Inside Forward', position: 'RM', plusId: 26, plusPlusId: 126 },
  { name: 'Winger', position: 'LM', plusId: 27, plusPlusId: 127 },
  { name: 'Wide Midfielder', position: 'LM', plusId: 28, plusPlusId: 128 },
  { name: 'Wide Playmaker', position: 'LM', plusId: 29, plusPlusId: 129 },
  { name: 'Inside Forward', position: 'LM', plusId: 30, plusPlusId: 130 },
  { name: 'Playmaker', position: 'CAM', plusId: 31, plusPlusId: 131 },
  { name: 'Shadow Striker', position: 'CAM', plusId: 32, plusPlusId: 132 },
  { name: 'Half-Winger', position: 'CAM', plusId: 33, plusPlusId: 133 },
  { name: 'Winger', position: 'RW', plusId: 35, plusPlusId: 135 },
  { name: 'Inside Forward', position: 'RW', plusId: 36, plusPlusId: 136 },
  { name: 'Wide Playmaker', position: 'RW', plusId: 37, plusPlusId: 137 },
  { name: 'Winger', position: 'LW', plusId: 38, plusPlusId: 138 },
  { name: 'Inside Forward', position: 'LW', plusId: 39, plusPlusId: 139 },
  { name: 'Wide Playmaker', position: 'LW', plusId: 40, plusPlusId: 140 },
  { name: 'Advanced Forward', position: 'ST', plusId: 41, plusPlusId: 141 },
  { name: 'Poacher', position: 'ST', plusId: 42, plusPlusId: 142 },
  { name: 'False 9', position: 'ST', plusId: 43, plusPlusId: 143 },
  { name: 'Target Forward', position: 'ST', plusId: 44, plusPlusId: 144 },
  { name: 'Classic 10', position: 'CAM', plusId: 34, plusPlusId: 134 },
  { name: 'Wide Half', position: 'CDM', plusId: 17, plusPlusId: 117 },
  { name: 'Ball Playing Keeper', position: 'GK', plusId: 45, plusPlusId: 145 },
  { name: 'Box Crasher', position: 'CDM', plusId: 49, plusPlusId: 149 },
  { name: 'Inverted Wingback', position: 'LB', plusId: 47, plusPlusId: 147 },
  { name: 'Inverted Wingback', position: 'RB', plusId: 46, plusPlusId: 146 },
  { name: 'Wide Back', position: 'CB', plusId: 48, plusPlusId: 148 },
];
