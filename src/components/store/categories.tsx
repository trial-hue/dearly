import { designsFor } from '@/catalogue';
import { CardMock } from '@/components/card/CardMock';
import { TITLES, type OccasionType } from '@/domain';
import { OCCASION_LABELS, OCCASION_SLUGS } from '@/lib/occasions';

import type { Category } from './CategoryNav';

function feature(occasion: OccasionType) {
  const d = designsFor(occasion)[0];
  return d ? (
    <CardMock design={d} title={TITLES[occasion]} name="" tint={d.tint} hover={false} />
  ) : null;
}

function columnsFor(occasion: OccasionType) {
  const base = `/cards/${OCCASION_SLUGS[occasion]}`;
  return [
    {
      heading: 'Shop by',
      links: [
        { label: 'For her', href: `${base}?tag=for+her` },
        { label: 'For him', href: `${base}?tag=for+him` },
        { label: 'For kids', href: `${base}?tag=for+kids` },
        { label: 'Milestones', href: `${base}?tag=milestone` },
      ],
    },
    {
      heading: 'Styles',
      links: [
        { label: 'Funny', href: `${base}?tag=funny` },
        { label: 'Cute', href: `${base}?tag=cute` },
        { label: 'Floral', href: `${base}?tag=floral` },
        { label: 'Minimal', href: `${base}?tag=minimal` },
        { label: 'Photo upload', href: `${base}?tag=photo+upload` },
      ],
    },
  ];
}

/** The category row: the big occasions get mega-menus; the rest are direct links. */
export function storeCategories(): Category[] {
  const seasonal: OccasionType[] = ['eid', 'diwali', 'hanukkah', 'christmas', 'womens_day'];
  return [
    {
      label: 'Birthday',
      href: `/cards/${OCCASION_SLUGS.birthday}`,
      columns: columnsFor('birthday'),
      feature: feature('birthday'),
    },
    {
      label: 'Anniversary',
      href: `/cards/${OCCASION_SLUGS.anniversary}`,
      columns: columnsFor('anniversary'),
      feature: feature('anniversary'),
    },
    {
      label: "Mother's Day",
      href: `/cards/${OCCASION_SLUGS.mothers_day}`,
      columns: columnsFor('mothers_day'),
      feature: feature('mothers_day'),
    },
    { label: 'Thank you', href: `/cards/${OCCASION_SLUGS.thank_you}` },
    {
      label: 'Celebrations',
      href: '/cards',
      columns: [
        {
          heading: 'Occasions',
          links: seasonal.map((o) => ({
            label: OCCASION_LABELS[o],
            href: `/cards/${OCCASION_SLUGS[o]}`,
          })),
        },
      ],
      feature: feature('diwali'),
    },
    {
      label: 'Work',
      href: `/cards/${OCCASION_SLUGS.leaving}`,
      columns: [
        {
          heading: 'Occasions',
          links: [
            { label: 'Leaving', href: `/cards/${OCCASION_SLUGS.leaving}` },
            { label: 'Work anniversary', href: `/cards/${OCCASION_SLUGS.work_anniversary}` },
            { label: 'Dearly for Business', href: '/business' },
          ],
        },
      ],
    },
    { label: 'eCards', href: '/ecards' },
    { label: 'All cards', href: '/cards' },
  ];
}
