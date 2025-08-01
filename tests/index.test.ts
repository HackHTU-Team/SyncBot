import { describe, test, expect, vi, beforeEach } from 'vitest';
import SyncBot from '../src';
import {
  PublishableAdaptor,
  SubscribableAdaptor,
  SyncableAdaptor,
} from '../src/types/adaptor';
import { TextMessage } from '../src/types/Messages/textMessage';
import { MediaMessage } from '../src/types/Messages/mediaMessage';
import { LocationMessage } from '../src/types/Messages/locationMessage';
import { Content } from '../src/utils/content';
import { Processor } from '../src/types/processor';
import { Message } from '../src/types/Messages/message';

describe('SyncBot Basic Tests', () => {
  let bot: SyncBot;

  beforeEach(() => {
    bot = new SyncBot('http://localhost');
  });

  test('init', () => {
    expect(() => new SyncBot('http://localhost:8080')).not.toThrow();
    expect(() => new SyncBot('localhost:8080')).not.toThrow();
    expect(() => new SyncBot('localhost')).not.toThrow();
    expect(() => new SyncBot('google.com')).not.toThrow();

    expect(() => new SyncBot('google')).toThrow();
    expect(() => new SyncBot('google.:')).toThrow();
  });

  test('subscribe', () => {
    const subAdaptor: SubscribableAdaptor = {
      id: 'testAdaptor',
      receive: vi.fn(),
      interceptors: [],
      handlers: [],
    };
    bot.subscribe(subAdaptor);
    expect(bot.subscribersList).toContain(subAdaptor);
  });

  test('publish', () => {
    const pubAdaptor: PublishableAdaptor = {
      id: 'testAdaptor',
      sendText: vi.fn(),
      interceptors: [],
      handlers: [],
    };
    bot.publish(pubAdaptor);
    expect(bot.publishersList).toContain(pubAdaptor);
  });

  test('sync', () => {
    const syncAdaptor: SyncableAdaptor = {
      id: 'testAdaptor',
      receive: vi.fn(),
      sendText: vi.fn(),
      interceptors: [],
      handlers: [],
    };
    // Should throw because 'testAdaptor' is already registered
    expect(() => bot.sync(syncAdaptor)).toThrow();

    syncAdaptor.id = 'syncAdaptor';
    bot.sync(syncAdaptor);

    expect(bot.subscribersList).toContain(syncAdaptor);
    expect(bot.publishersList).toContain(syncAdaptor);
  });
});

describe('Dispatch and Send Logic', () => {
  let bot: SyncBot;
  const fromAdaptor: SubscribableAdaptor = {
    id: 'from-adaptor',
    receive: vi.fn(),
    interceptors: [],
    handlers: [],
  };

  const textMessage: TextMessage = {
    id: 'msg1',
    type: 'text',
    content: new Content('hello'),
    timestamp: new Date(),
    sender: { id: 'user1' },
    source: { type: 'private', userId: 'user1' },
  };

  const mediaMessageWithAlt: MediaMessage = {
    id: 'msg2',
    type: 'media',
    contents: [{ type: 'image', url: 'http://example.com/img.png' }],
    alt: new Content('this is an image'),
    timestamp: new Date(),
    sender: { id: 'user1' },
    source: { type: 'private', userId: 'user1' },
  };

  const locationMessage: LocationMessage = {
    id: 'msg3',
    type: 'location',
    content: { latitude: 10, longitude: 20 },
    timestamp: new Date(),
    sender: { id: 'user1' },
    source: { type: 'private', userId: 'user1' },
  };

  beforeEach(() => {
    bot = new SyncBot('http://localhost');
  });

  test('should call specific handler (sendMedia)', async () => {
    const mockPublisher: PublishableAdaptor = {
      id: 'p1',
      sendText: vi.fn(),
      sendMedia: vi.fn(),
      interceptors: [],
      handlers: [],
    };
    bot.publish(mockPublisher);

    // @ts-expect-error - private method access for testing
    await bot.dispatch(mediaMessageWithAlt, fromAdaptor);

    expect(mockPublisher.sendMedia).toHaveBeenCalledWith(mediaMessageWithAlt);
    expect(mockPublisher.sendText).not.toHaveBeenCalled();
  });

  test('should use alt content when specific handler is missing', async () => {
    const mockPublisher: PublishableAdaptor = {
      id: 'p2',
      sendText: vi.fn(),
      interceptors: [],
      handlers: [],
    };
    bot.publish(mockPublisher);

    // @ts-expect-error - private method access for testing
    await bot.dispatch(mediaMessageWithAlt, fromAdaptor);

    expect(mockPublisher.sendText).toHaveBeenCalled();
    const sentMessage = vi.mocked(mockPublisher.sendText).mock.calls[0][0];
    expect(sentMessage.type).toBe('text');
    expect(sentMessage.content.content).toBe('this is an image');
  });

  test('should convert message to text when no specific handler and no alt', async () => {
    const mockPublisher: PublishableAdaptor = {
      id: 'p3',
      sendText: vi.fn(),
      interceptors: [],
      handlers: [],
    };
    bot.publish(mockPublisher);

    // @ts-expect-error - private method access for testing
    await bot.dispatch(locationMessage, fromAdaptor);

    expect(mockPublisher.sendText).toHaveBeenCalled();
    const sentMessage = vi.mocked(mockPublisher.sendText).mock.calls[0][0];
    expect(sentMessage.type).toBe('text');
    expect(sentMessage.content.content).toBe('Location: (10, 20)');
  });

  test('should not dispatch message back to its sender', async () => {
    const fromAndToAdaptor: SyncableAdaptor = {
      id: 'from-and-to',
      receive: vi.fn(),
      sendText: vi.fn(),
      interceptors: [],
      handlers: [],
    };
    bot.sync(fromAndToAdaptor);

    // @ts-expect-error - private method access for testing
    await bot.dispatch(textMessage, fromAndToAdaptor);

    expect(fromAndToAdaptor.sendText).not.toHaveBeenCalled();
  });
});

describe('Processor Tests', () => {
  let bot: SyncBot;
  const fromAdaptor: SubscribableAdaptor = { id: 'from', receive: vi.fn(), interceptors: [], handlers: [] };
  const mockPublisher: PublishableAdaptor = { id: 'to', sendText: vi.fn(), interceptors: [], handlers: [] };
  
  const message: TextMessage = {
    id: 'proc-msg',
    type: 'text',
    content: new Content('processor test'),
    timestamp: new Date(),
    sender: { id: 'user1' },
    source: { type: 'private', userId: 'user1' },
  };

  beforeEach(() => {
    bot = new SyncBot('http://localhost');
    bot.publish(mockPublisher);
  });

  test('interceptors and handlers should be called in priority order', async () => {
    const callOrder: string[] = [];
    const interceptor1 = { name: 'i1', priority: 1, process: vi.fn(async () => { callOrder.push('i1'); }) };
    const interceptor2 = { name: 'i2', priority: 10, process: vi.fn(async () => { callOrder.push('i2'); }) };
    const handler1 = { name: 'h1', priority: 1, process: vi.fn(async () => { callOrder.push('h1'); }) };
    const handler2 = { name: 'h2', priority: 10, process: vi.fn(async () => { callOrder.push('h2'); }) };

    // Register in non-priority order
    bot.intercept(interceptor2, interceptor1);
    bot.handle(handler2, handler1);

    // @ts-expect-error - private method access for testing
    await bot.dispatch(message, fromAdaptor);

    expect(callOrder).toEqual(['i1', 'i2', 'h1', 'h2']);
  });
});
