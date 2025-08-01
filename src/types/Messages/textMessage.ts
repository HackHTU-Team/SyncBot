import { Content } from '../../utils/content';
import { Message, User } from './message';

export interface TextMessage extends Message {
  type: 'text';
  content: Content;
  mentions?: User[];
}
