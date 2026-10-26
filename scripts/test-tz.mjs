// Preloaded by `npm test` (node --import). Pins the timezone before any test
// module evaluates, so the week-boundary tests run against real US DST
// transitions (Nov 1 / Mar 8 2026) on any machine or CI runner.
process.env.TZ = 'America/Chicago';
