import { URL } from 'url';
import { Message, User } from './message';
import { Content } from '../../utils/content';

export type MediaType = 'sticker' | 'image' | 'video' | 'audio' | 'file';

export interface MediaMessage extends Message {
  type: 'media';

  contents: {
    type: MediaType;
    url: string | URL;
  }[];

  /**
   * Size of the media in bytes.
   */
  size?: number;

  captions?: Content;
  mentions?: User[];
}
