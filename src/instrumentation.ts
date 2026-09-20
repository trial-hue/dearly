/** Runs once when the Next.js server starts: validates the environment so bad config fails fast. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./env');
  }
}
