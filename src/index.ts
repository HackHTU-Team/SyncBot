import {
  Adaptor,
  isSyncable,
  PublishableAdaptor,
  SubscribableAdaptor,
} from './types/adaptor';
import { BotConfig } from './types/botConfig';
import { Message } from './types/Messages/message';
import { Processor } from './types/processor';
import SingleOrArray from './types/singleOrArray';
import { Hono, Context } from 'hono';
import { serve } from './server';
import { SyncBotError, DuplicateAdaptorError } from './types/error';
import { TextMessage } from './types/Messages/textMessage';
import { MediaMessage } from './types/Messages/mediaMessage';
import { LocationMessage } from './types/Messages/locationMessage';
import { SystemMessage } from './types/Messages/systemMessage';
export type SyncBotPlugin = (_bot: SyncBot) => void;
/**
 * @class SyncBot
 * @description A general-purpose bot designed to facilitate message synchronization between different adaptors.
 * It allows for easy integration and communication between various systems and services.
 * @see https://github.com/HackHTU/syncbot
 */
export class SyncBot {
  /**
   * The Hono application instance used for routing incoming webhooks.
   * @public
   * @readonly
   */
  public readonly app: Hono;

  private readonly url: URL;

  private subscribers: Map<string, SubscribableAdaptor> = new Map();
  private publishers: Array<PublishableAdaptor> = [];
  private interceptors: Array<Processor> = [];
  private handlers: Array<Processor> = [];

  /**
   * Creates an instance of SyncBot.
   * @param url The base URL for the bot. Webhook paths will be relative to this URL.
   * @param config Configuration options for the bot.
   */
  constructor(url: string | URL, _config: BotConfig = {}) {
    let urlObj: URL;

    if (url instanceof URL) {
      urlObj = url;
    } else {
      try {
        urlObj = new URL(url);
      } catch {
        urlObj = new URL(`https://${url}`);
      }
    }
    // Ensure the URL has a valid protocol
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error(
        `Invalid protocol "${urlObj.protocol}". Only http and https are supported.`
      );
    }
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, '');

    this.url = urlObj;
    this.app = new Hono().basePath(this.url.pathname);

    // add default routes
    this.app.get('/ping', (c) => c.text('pong'));
    this.app.notFound((c) =>
      c.json({ error: 'Not Found' }, 404)
    );
    this.app.get("/", (c) => c.html("<h1>Welcome to SyncBot</h1>"));
    this.app.onError((err, c) => {
      console.error('[SyncBot] An error occurred:', err);
      if (err instanceof SyncBotError) {
        return c.json({ error: err.message, name: err.name }, 400);
      }
      return c.json({ error: 'Internal Server Error' }, 500);
    });
  }

  /**
   * Registers one or more subscribable adaptors.
   * These adaptors can receive messages from external services.
   * @param newSubscribers The subscribable adaptors to add.
   * @returns The SyncBot instance for chaining.
   * @throws If an adaptor with the same ID is already registered.
   */
  subscribe(...newSubscribers: SingleOrArray<SubscribableAdaptor>[]): this {
    for (const adaptor of newSubscribers.flat()) {
      this.validateAdaptorId(adaptor.id);
      if (this.subscribers.has(adaptor.id)) {
        throw new DuplicateAdaptorError(adaptor.id);
      }
      this.subscribers.set(adaptor.id, adaptor);
      this.registerAdaptorRoute(adaptor);
    }
    return this;
  }

  /**
   * Registers one or more publishable adaptors.
   * These adaptors can send messages to external services.
   * @param newPublishers The publishable adaptors to add.
   * @throws If an adaptor with the same ID is already registered.
   */
  publish(...newPublishers: SingleOrArray<PublishableAdaptor>[]): this {
    for (const adaptor of newPublishers.flat()) {
      this.validateAdaptorId(adaptor.id);
      if (this.publishers.some(p => p.id === adaptor.id)) {
        throw new DuplicateAdaptorError(adaptor.id);
      }
      this.publishers.push(adaptor);
    }
    return this;
  }

  /**
   * Registers adaptors that can both subscribe and publish.
   * This is a convenience method for two-way communication.
   * @param adaptors The syncable adaptors to add.
   */
  sync(...adaptors: SingleOrArray<Adaptor>[]): this {
    for (const adaptor of adaptors.flat()) {
      if (!isSyncable(adaptor)) {
        throw new SyncBotError(
          'Sync adaptor must implement both send and receive methods.'
        );
      }
      this.subscribe(adaptor);
      this.publish(adaptor);
    }
    return this;
  }

  get subscribersList(): SubscribableAdaptor[] {
    return Array.from(this.subscribers.values());
  }

  get publishersList(): PublishableAdaptor[] {
    return this.publishers;
  }

  /**
   * Adds message interceptors.
   * Interceptors are processed in order of priority before a message is dispatched.
   * @param newInterceptors The interceptors to add.
   */
  intercept(...newInterceptors: SingleOrArray<Processor>[]): this {
    this.interceptors.push(...newInterceptors.flat());
    this.interceptors.sort((a, b) => a.priority - b.priority);
    return this;
  }

  /**
   * Adds message handlers.
   * Handlers are processed in order of priority after a message has been dispatched.
   * @param newHandlers The handlers to add.
   */
  handle(...newHandlers: SingleOrArray<Processor>[]): this {
    this.handlers.push(...newHandlers.flat());
    this.handlers.sort((a, b) => a.priority - b.priority);
    return this;
  }

  get interceptorsList(): Processor[] {
    return this.interceptors;
  }
  get handlersList(): Processor[] {
    return this.handlers;
  }

  /**
   * Applies one or more plugins to the bot instance.
   * @param plugins The plugins to apply.
   */
  use(...plugins: SingleOrArray<SyncBotPlugin>[]): this {
    for (const plugin of plugins.flat()) {
      plugin(this);
    }
    return this;
  }

  /**
   * Starts a persistent server to listen for incoming webhooks.
   * This is suitable for long-running Node.js applications.
   */
  listen(): void {
    this.validate();
    serve(this.app, this.url);
  }

  /**
   * Returns the Hono fetch function for use in serverless environments (e.g., Cloudflare Workers).
   * @returns The Hono fetch function.
   */
  fire(): (_request: Request) => Response | Promise<Response> {
    this.validate();
    return this.app.fetch;
  }

  /**
   * Gets the full webhook URL for a given adaptor ID.
   * @param adaptorId The ID of the adaptor.
   * @returns The full webhook URL.
   */
  //TODO
  getWebhookUrl(adaptorId: string): URL {
    const baseUrlString = this.url.toString();
    const base = baseUrlString.endsWith('/')
      ? baseUrlString
      : `${baseUrlString}/`;
    return new URL(adaptorId, base);
  }

  //TODO
  private validate(): void {
    if (!this.url) {
      throw new SyncBotError(
        'A valid URL must be provided to the SyncBot constructor.'
      );
    }
  }

  private validateAdaptorId(id: string): void {
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new SyncBotError(
        `Invalid adaptor ID: '${id}'. IDs must be alphanumeric with dashes or underscores.`
      );
    }
  }

  private registerAdaptorRoute(adaptor: SubscribableAdaptor): void {
    this.app.post(`/${adaptor.id}`, async (c: Context) => {
      try {
        const messages = await adaptor.receive(c.req.raw);
        if (messages) {
          const processingPromises = messages.map(message =>
            this.dispatch(message, adaptor)
          );
          await Promise.all(processingPromises);
        }
        return c.json({ status: 'ok', message: 'Request processed' }, 200);
      } catch (error) {
        console.error(
          `[SyncBot] Error processing webhook for ${adaptor.id}:`,
          error
        );
        return c.json({ error: 'Failed to process webhook' }, 500);
      }
    });

    if (adaptor.setWebhookURL) {
      const webhookUrl = this.getWebhookUrl(adaptor.id);
      adaptor.setWebhookURL(webhookUrl.toString()).catch(console.error);
    }
  }

  private async dispatch(
    message: Message,
    from: SubscribableAdaptor
  ): Promise<void> {
    // First, process the message with interceptors
    await this.processWith(this.interceptors, message);

    // Then, sync the message with all publishers except the one it came from
    const dispatchPromises = this.publishers
      .filter(publisher => publisher.id !== from.id)
      .map(publisher => {
        // Adaptor in the same way
        this.processWith(publisher.interceptors, message);

        this.sendMessage(publisher, message);

        this.processWith(publisher.handlers, message);
      });

    await Promise.all(dispatchPromises);

    // Finally, process the message with handlers
    await this.processWith(this.handlers, message);
  }

  private async sendMessage(
    publisher: PublishableAdaptor,
    message: Message
  ): Promise<boolean> {
    // Use a type-safe switch to find the specific handler
    switch (message.type) {
      case 'text':
        if (publisher.sendText) {
          return publisher.sendText(message as TextMessage);
        }
        break;
      case 'media':
        if (publisher.sendMedia) {
          return publisher.sendMedia(message as MediaMessage);
        }
        break;
      case 'location':
        if (publisher.sendLocation) {
          return publisher.sendLocation(message as LocationMessage);
        }
        break;
      case 'system':
        if (publisher.sendSystem) {
          return publisher.sendSystem(message as SystemMessage);
        }
        break;
    }

    // If no specific handler was found or called, check for fallback 'alt' content to TextMessage
    if (message.alt) {
      const altMessage: TextMessage = {
        id: message.id,
        timestamp: message.timestamp,
        sender: message.sender,
        source: message.source,
        type: 'text',
        content: message.alt,
      };
      // Try to send the alt message using a specific text handler if available
      if (publisher.sendText) {
        return publisher.sendText(altMessage);
      }

      // Otherwise, return false
      return false;
    }

    return false;
  }

  private async processWith(
    processors: Processor[],
    message: Message
  ): Promise<void> {
    for (const processor of processors) {
      try {
        await processor.process(message);
      } catch (error) {
        console.error(`[SyncBot] Processor '${processor.name}' failed:`, error);
      }
    }
  }
}

export default SyncBot;
