import { createServer } from 'vite';

process.env.VITE_DISABLE_TAILWIND = '1';

const server = await createServer({
  configFile: 'vite.config.ts',
  configLoader: 'native',
  server: {
    host: '127.0.0.1',
    port: 4174,
  },
});

await server.listen();
server.printUrls();

const shutdown = async () => {
  await server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await new Promise(() => {});
