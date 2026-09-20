import { ordinal } from '@/domain';
import { OCCASION_LABELS } from '@/lib/occasions';
import type { Serialized } from '@/lib/serialize';
import type { ProposalView } from '@/server/services/proposals';

type ProposalDTO = Serialized<ProposalView>;

/** "Mum's 60th birthday": the one line that says what a card is for. Shared by server and client. */
export function reminderHeadline(p: Pick<ProposalDTO, 'person' | 'occasionType' | 'age'>): string {
  const first = p.person.name.includes(' and ')
    ? p.person.name
    : (p.person.name.split(' ')[0] ?? p.person.name);
  const who = first.endsWith('s') ? `${first}'` : `${first}'s`;
  if (p.occasionType === 'birthday')
    return `${who} ${p.age != null ? `${ordinal(p.age)} ` : ''}birthday`;
  if (p.occasionType === 'anniversary')
    return `${who} ${p.age != null ? `${ordinal(p.age)} ` : ''}anniversary`;
  if (p.occasionType === 'leaving') return `${who} leaving card`;
  if (p.occasionType === 'thank_you') return `A thank you for ${first}`;
  if (p.occasionType === 'work_anniversary')
    return `${who} ${p.age != null ? `${ordinal(p.age)} ` : ''}work anniversary`;
  return `${OCCASION_LABELS[p.occasionType]} for ${first}`;
}
