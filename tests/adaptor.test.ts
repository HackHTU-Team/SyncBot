import { describe, test, expect, vi } from 'vitest';
import {
  isSyncable,
  PublishableAdaptor,
  SubscribableAdaptor,
  SyncableAdaptor,
} from '../src/types/adaptor';

describe('Adaptor Type Guard Tests', () => {
  test('isSyncable should correctly identify adaptors', () => {
    const subscribable: SubscribableAdaptor = {
      id: 'sub',
      receive: vi.fn(),
      interceptors: [],
      handlers: [],
    };

    const publishable: PublishableAdaptor = {
      id: 'pub',
      sendText: vi.fn(),
      interceptors: [],
      handlers: [],
    };

    const syncable: SyncableAdaptor = {
      id: 'sync',
      receive: vi.fn(),
      sendText: vi.fn(),
      interceptors: [],
      handlers: [],
    };

    const notAnAdaptor = { id: 'not-adaptor' };

    expect(isSyncable(subscribable)).toBe(false);
    expect(isSyncable(publishable)).toBe(false);
    expect(isSyncable(syncable)).toBe(true);
    // @ts-expect-error - testing with invalid types
    expect(isSyncable(notAnAdaptor)).toBe(false);
    // @ts-expect-error - testing with invalid types
    expect(isSyncable(null)).toBe(false);
    // @ts-expect-error - testing with invalid types
    expect(isSyncable(undefined)).toBe(false);
  });

  test("Support some not all message type")
  test("Interceptor or Handler")
  //TODO: 拦截器可以修改消息
});
