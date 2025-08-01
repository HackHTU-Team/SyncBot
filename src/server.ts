import { Hono } from 'hono';
import { serve as honoServe } from '@hono/node-server';

/**
 * Starts a server to listen for incoming webhooks.
 * @param app The Hono application instance.
 * @param url The base URL for the server.
 */
export function serve(app: Hono, url: URL): void {
  const port = url.port
    ? parseInt(url.port, 10)
    : url.protocol === 'https:'
      ? 443
      : 80;

  honoServe({
    fetch: app.fetch,
    port,
  });

  console.log(`Webhook server running at ${url.toString()}`);
}
