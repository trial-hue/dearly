export interface MessagingAdapter {
  readonly simulated: boolean;
  send(
    to: string,
    channel: 'email' | 'sms' | 'link',
    subject: string,
    body: string,
  ): Promise<{ messageId: string }>;
}

/** Simulated email and SMS: nothing leaves the server; the decision log records the intent. */
export class SimulatedMessaging implements MessagingAdapter {
  readonly simulated = true;
  async send(to: string, channel: 'email' | 'sms' | 'link') {
    return { messageId: `msg_${channel}_${Buffer.from(to).toString('base64url').slice(0, 6)}` };
  }
}

export function getMessaging(): MessagingAdapter {
  return new SimulatedMessaging();
}
