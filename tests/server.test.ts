import { describe, test, expect, vi } from 'vitest';
import SyncBot from '../src';
import { SubscribableAdaptor } from '../src/types/adaptor';
import * as server from '../src/server';

// Mock the serve function from server.ts
const serveSpy = vi.spyOn(server, 'serve').mockImplementation(() => {});

describe('Server and Listen Tests', () => {
  test('bot.listen() should call serve and register routes', async () => {
    const bot = new SyncBot('http://localhost:8888/test/');

    const mockAdaptor: SubscribableAdaptor = {
      id: 'webhook-adaptor',
      receive: vi.fn().mockResolvedValue([]), // Return empty array for simplicity
      interceptors: [],
      handlers: [],
    };

    bot.subscribe(mockAdaptor);
    bot.listen();

    // 1. Check if bot.listen() called the serve function
    expect(serveSpy).toHaveBeenCalledTimes(1);

    // @ts-expect-error - Accessing private url property for testing
    const expectedUrl = bot.url;
    expect(serveSpy).toHaveBeenCalledWith(bot.app, expectedUrl);

    // 2. Check if the route was registered on the Hono app instance
    const request = new Request(
      'http://localhost:8888/test/webhook-adaptor',
      {
        method: 'POST',
        body: JSON.stringify({ message: 'hello' }),
      }
    );

    const response = await bot.app.request(request);

    // Check that the handler was called and returned a success response
    expect(mockAdaptor.receive).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    const responseJson = await response.json();
    expect(responseJson.status).toBe('ok');

    // Cleanup spy
    serveSpy.mockRestore();
  });

  test("Mock request", () => { 
    
  })
});
