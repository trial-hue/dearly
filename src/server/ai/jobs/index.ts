import { agentTurnJob } from './agentTurn';
import { cardFrontJob } from './cardFront';
import { cleanStaffListJob } from './cleanStaffList';
import { importPeopleJob } from './importPeople';
import { lifeEventJob } from './lifeEvent';
import { proposalsJob } from './proposals';
import { readFloristOrderJob } from './readFloristOrder';
import { rewriteMessageJob } from './rewriteMessage';

export const JOBS = {
  proposals: proposalsJob,
  rewrite_message: rewriteMessageJob,
  import_people: importPeopleJob,
  life_event: lifeEventJob,
  clean_staff_list: cleanStaffListJob,
  read_florist_order: readFloristOrderJob,
  agent_turn: agentTurnJob,
  card_front: cardFrontJob,
} as const;

export type JobName = keyof typeof JOBS;
export type JobInput<J extends JobName> = Parameters<(typeof JOBS)[J]['fallback']>[0];
export type JobOutput<J extends JobName> = ReturnType<(typeof JOBS)[J]['fallback']>;

export function isJobName(value: string): value is JobName {
  return Object.prototype.hasOwnProperty.call(JOBS, value);
}
