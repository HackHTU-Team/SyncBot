interface PrivateSource {
  type: 'private';
}

interface GroupSource {
  type: 'group';
  groupId: string;
  groupName?: string;
}

interface ChannelSource {
  type: 'channel';
  channelId: string;
  channelName?: string;
}

interface ForumSource {
  type: 'forum';
  forumId: string;
  threadId?: string;
}

export type messageSource = (
  | PrivateSource
  | GroupSource
  | ChannelSource
  | ForumSource
) &
  Record<string, unknown>;
