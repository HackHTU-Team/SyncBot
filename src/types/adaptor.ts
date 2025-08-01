import { Message } from './Messages/message';
import { Processor } from './processor';
import { TextMessage } from './Messages/textMessage';
import { MediaMessage } from './Messages/mediaMessage';
import { LocationMessage } from './Messages/locationMessage';
import { SystemMessage } from './Messages/systemMessage';

interface Subscribable {
  setWebhookURL?(_webhookURL: string): Promise<boolean>;
  receive(_request: Request): Promise<Message[] | null>;
}

/**
 * Defines the contract for adaptors that can publish (send) messages.
 */
export interface Publishable {
  /**
   * A specific handler for sending text messages.
   * If implemented, this will be called for messages of type 'text'.
   * It can be called when a more specific handler (e.g., `sendText`) is not available.
   * @param message The text message to send.
   * @returns A promise that resolves to true if the message was sent successfully.
   */
  sendText(_message: TextMessage): Promise<boolean>;

  /**
   * Optional: A specific handler for sending media messages.
   * If implemented, this will be called for messages of type 'media'.
   * @param message The media message to send.
   * @returns A promise that resolves to true if the message was sent successfully.
   */
  sendMedia?(_message: MediaMessage): Promise<boolean>;

  /**
   * Optional: A specific handler for sending location messages.
   * If implemented, this will be called for messages of type 'location'.
   * @param message The location message to send.
   * @returns A promise that resolves to true if the message was sent successfully.
   */
  sendLocation?(_message: LocationMessage): Promise<boolean>;

  /**
   * Optional: A specific handler for sending system messages.
   * If implemented, this will be called for messages of type 'system'.
   * @param message The system message to send.
   * @returns A promise that resolves to true if the message was sent successfully.
   */
  sendSystem?(_message: SystemMessage): Promise<boolean>;
}

export interface AdaptorBase {
  /**
   * The unique identifier for the adaptor.
   * Used for routing and identification.
   */
  id: string;

  /**
   * List of interceptors for the Adaptor.
   * Interceptors handle messages before they are synced.
   */
  interceptors: Array<Processor>;

  /**
   * List of handlers for the Adaptor.
   * Handlers process messages after they are synced.
   */
  handlers: Array<Processor>;
}

export function isSubscribable(
  adaptor: Adaptor
): adaptor is SubscribableAdaptor {
  try {
    return 'receive' in adaptor && typeof adaptor.receive === 'function';
  } catch {
    return false;
  }
}
export function isPublishable(adaptor: Adaptor): adaptor is PublishableAdaptor {
  try {
    return (
      'sendText' in adaptor &&
      typeof adaptor.sendText === 'function' &&
      (adaptor.sendMedia === undefined || typeof adaptor.sendMedia === 'function') &&
      (adaptor.sendLocation === undefined || typeof adaptor.sendLocation === 'function') &&
      (adaptor.sendSystem === undefined || typeof adaptor.sendSystem === 'function')
    );
  } catch {
    return false;
  }
}

export function isSyncable(adaptor: Adaptor): adaptor is SyncableAdaptor {
  return isSubscribable(adaptor) && isPublishable(adaptor);
}

/**
 * An adaptor that can receive messages from a source.
 */
export interface SubscribableAdaptor extends AdaptorBase, Subscribable {}

/**
 * An adaptor that can publish messages to a destination.
 */
export interface PublishableAdaptor extends AdaptorBase, Publishable {}

/**
 * An adaptor that can both subscribe and publish messages.
 */
export interface SyncableAdaptor
  extends SubscribableAdaptor,
    PublishableAdaptor {}

/**
 * An Adaptor connects to an external system to send and/or receive messages.
 *
 * It can be a `SubscribableAdaptor` for receiving messages, a `PublishableAdaptor` for sending messages,
 * or a `SyncableAdaptor` for two-way communication.
 */
export type Adaptor =
  | SubscribableAdaptor
  | PublishableAdaptor
  | SyncableAdaptor;
