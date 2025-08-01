import { Content } from '../../utils/content';
import { messageSource } from './messageSource';

export interface User {
  id: string;
  name?: string;

  username?: string;

  avatarUrl?: string;
}

export type MessageType =
  | 'text' // Text message
  | 'media' // Media message ('sticker' | 'image' | 'video' | 'audio' | 'file')
  | 'location' // Location message
  | 'system'; // System event message

/**
 * Message Base interface
 * Represents a generic message structure.
 */
export interface Message {
  id: string;
  timestamp: Date;

  /**
   * Fallback text for messages that may not render properly in some clients.
   * This is useful for accessibility and for clients that do not support rich media.
   */
  alt?: Content;

  /**
   * The sender of the message.
   */
  sender: User | 'system' | 'bot' | 'unknown';

  /**
   * The source of the message.
   * This indicates where the message originated, such as a private chat, group, channel, or forum.
   */
  source: messageSource;

  type: MessageType;

  _extra?: Record<string, unknown>;
}
