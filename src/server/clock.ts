/** The server's notion of today. DEARLY_FAKE_TODAY (YYYY-MM-DD) pins it for demos and tests. */
export function now(): Date {
  const fake = process.env.DEARLY_FAKE_TODAY;
  if (fake) {
    const [y, m, d] = fake.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d, 9, 0, 0);
  }
  return new Date();
}
