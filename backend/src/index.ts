import { createApp } from './app.js';
import { env } from './config/env.js';
import { normalizeLegacyBookedStatuses } from './lib/booking-lifecycle.js';
import { prisma } from './lib/prisma.js';

await normalizeLegacyBookedStatuses(prisma);
const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Travela API listening on http://localhost:${env.PORT}`);
});
