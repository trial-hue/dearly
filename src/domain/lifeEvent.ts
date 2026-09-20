import { firstName } from './templates';

export interface LifeEventPerson {
  id: string;
  name: string;
  relationship: string;
}

export interface LifeEventResult {
  personId: string | null;
  action: 'pause' | 'none';
  reason: string;
}

const PAUSE_PATTERNS: Array<[RegExp, string]> = [
  [/passed away|passed on|died|death|funeral|bereave|lost (?:his|her|their|my)/i, 'Bereavement'],
  [/split up|separated|broke up|divorc|no longer together/i, 'Separated'],
  [/fell out|not speaking|estranged/i, 'Estranged'],
  [/moved abroad|emigrat/i, 'Moved abroad'],
];

/** Keyword rules plus a name or relationship match. Never pauses without a matching person. */
export function detectLifeEvent(text: string, people: readonly LifeEventPerson[]): LifeEventResult {
  const lower = text.toLowerCase();
  let reason: string | null = null;
  for (const [re, label] of PAUSE_PATTERNS) {
    if (re.test(text)) {
      reason = label;
      break;
    }
  }
  const byName = people.filter((p) => {
    const first = firstName(p.name).toLowerCase();
    const full = p.name.toLowerCase();
    return (first.length > 2 && new RegExp(`\\b${first}\\b`).test(lower)) || lower.includes(full);
  });
  const byRelationship = people.filter((p) =>
    new RegExp(`\\b${p.relationship.toLowerCase()}\\b`).test(lower),
  );
  const target =
    byName.length === 1
      ? byName[0]
      : byName.length > 1
        ? (byName.find((p) => byRelationship.includes(p)) ?? byName[0])
        : byRelationship.length === 1
          ? byRelationship[0]
          : null;

  if (!target)
    return {
      personId: null,
      action: 'none',
      reason: reason ? `${reason}: no matching person` : 'No life event found',
    };
  if (!reason) return { personId: target.id, action: 'none', reason: 'No pause needed' };
  return { personId: target.id, action: 'pause', reason };
}
