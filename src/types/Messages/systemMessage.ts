import { Message, User } from './message';
export type SystemType =
  /** A user has joined the chat or channel */
  | 'user_joined'

  /** A user has left the chat or channel */
  | 'user_left'

  /** A user has been banned from the chat or channel */
  | 'user_banned'

  /** A previously banned user has been unbanned */
  | 'user_unbanned'

  /** The name of the source has been changed */
  | 'source_name_changed'

  /** The topic or description of the source has been changed */
  | 'source_topic_changed'

  /** The avatar or profile image of the source has been updated */
  | 'source_avatar_changed'

  /** A message has been pinned to the chat or channel */
  | 'message_pinned'

  /** A previously pinned message has been unpinned */
  | 'message_unpinned'

  /** A message has been redacted or deleted for moderation or privacy */
  | 'message_redacted'

  /** A message has been edited after being sent */
  | 'message_edited'

  /** A message is a reply to another message */
  | 'reply'

  /** A reaction has been added to a message */
  | 'reaction_added'

  /** A previously added reaction has been removed from a message */
  | 'reaction_removed'

  /** A voice or video call has been started */
  | 'call_started'

  /** A voice or video call has ended */
  | 'call_ended'

  /** A server or channel has received a boost or support event */
  | 'boost_added'

  /** A new thread has been created in a discussion */
  | 'thread_created'

  /** An invitation has been sent to another user to join a channel */
  | 'invite_sent'

  /** An unknown system message type (used as fallback) */
  | 'unknown';


export interface SystemMessagePayloads {
  user_joined: { user: User };
  user_left: { user: User };
  user_banned: { user: User; reason?: string };
  user_unbanned: { user: User };

  source_name_changed: { oldName: string; newName: string };
  source_topic_changed: { oldTopic: string; newTopic: string };
  source_avatar_changed: { oldAvatarUrl?: string; newAvatarUrl: string };

  message_pinned: { message: Message };
  message_unpinned: { message: Message };
  message_redacted: { messageId: string; reason?: string };
  message_edited: { messageId: string; oldContent: string; newContent: string };

  reply: { message: Message };
  reaction_added: { messageId: string; reaction: string };
  reaction_removed: { messageId: string; reaction: string };

  call_started: { callId: string; participants: User[] };
  call_ended: { callId: string; durationMs: number };

  boost_added: { user: User; level: number };

  thread_created: { threadId: string; creator: User; parentId: string };
  invite_sent: { inviter: User; invitee: User; sourceId: string };

  unknown: { raw: unknown };
}

interface BaseSystemMessage<K extends SystemType> extends Message {
  type: 'system'
  systemType: K
  payload: SystemMessagePayloads[K]
}

/**
 * A system message that represents events or notifications within the chat or channel.
 */
export type SystemMessage =
  | BaseSystemMessage<'user_joined'>
  | BaseSystemMessage<'user_left'>
  | BaseSystemMessage<'user_banned'>
  | BaseSystemMessage<'user_unbanned'>
  | BaseSystemMessage<'source_name_changed'>
  | BaseSystemMessage<'source_topic_changed'>
  | BaseSystemMessage<'source_avatar_changed'>
  | BaseSystemMessage<'message_pinned'>
  | BaseSystemMessage<'message_unpinned'>
  | BaseSystemMessage<'message_redacted'>
  | BaseSystemMessage<'message_edited'>
  | BaseSystemMessage<'reply'>
  | BaseSystemMessage<'reaction_added'>
  | BaseSystemMessage<'reaction_removed'>
  | BaseSystemMessage<'call_started'>
  | BaseSystemMessage<'call_ended'>
  | BaseSystemMessage<'boost_added'>
  | BaseSystemMessage<'thread_created'>
  | BaseSystemMessage<'invite_sent'>
  | BaseSystemMessage<'unknown'>