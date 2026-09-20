import { TITLES, type OccasionType } from '@/domain';

/** URL slugs for occasions, used by /cards/[occasion] and the category navigation. */
export const OCCASION_SLUGS: Record<OccasionType, string> = {
  birthday: 'birthday',
  anniversary: 'anniversary',
  mothers_day: 'mothers-day',
  womens_day: 'womens-day',
  eid: 'eid',
  diwali: 'diwali',
  hanukkah: 'hanukkah',
  christmas: 'christmas',
  thank_you: 'thank-you',
  leaving: 'leaving',
  work_anniversary: 'work-anniversary',
};

export const OCCASION_LABELS: Record<OccasionType, string> = {
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  mothers_day: "Mother's Day",
  womens_day: "Women's Day",
  eid: 'Eid',
  diwali: 'Diwali',
  hanukkah: 'Hanukkah',
  christmas: 'Christmas',
  thank_you: 'Thank you',
  leaving: 'Leaving',
  work_anniversary: 'Work anniversary',
};

export const OCCASION_TINTS: Record<OccasionType, 'blush' | 'butter' | 'mint' | 'sky' | 'lilac'> = {
  birthday: 'butter',
  anniversary: 'blush',
  mothers_day: 'blush',
  womens_day: 'lilac',
  eid: 'mint',
  diwali: 'butter',
  hanukkah: 'sky',
  christmas: 'mint',
  thank_you: 'sky',
  leaving: 'lilac',
  work_anniversary: 'sky',
};

export const ALL_OCCASIONS = Object.keys(TITLES) as OccasionType[];

export function occasionFromSlug(slug: string): OccasionType | null {
  const found = (Object.entries(OCCASION_SLUGS) as [OccasionType, string][]).find(
    ([, s]) => s === slug,
  );
  return found ? found[0] : null;
}
