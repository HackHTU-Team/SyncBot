import { marked } from 'marked';
import TurndownService from 'turndown';
import { parse, HTMLElement, Node, TextNode } from 'node-html-parser';

export type MessageEntity = {
  type:
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'code'
    | 'pre'
    | 'text_link';
  offset: number;
  length: number;
  url?: string;
  language?: string;
};

const turndownService = new TurndownService();

export class Content {
  content: string;
  format: 'html' | 'md';

  constructor(content: string, format: 'html' | 'md' = 'md') {
    this.content = content;
    this.format = format;
  }

  toHTML(): string {
    if (this.format === 'html') {
      return this.content;
    }
    const html = marked.parse(this.content, { async: false });
    if (html && typeof html !== 'string') {
      throw new Error('Markdown parsing failed');
    }
    return html.trim();
  }

  toMarkdown(): string {
    if (this.format === 'md') {
      return this.content;
    }
    const md = turndownService.turndown(this.content);
    if (md && typeof md !== 'string') {
      throw new Error('HTML to Markdown conversion failed');
    }
    return md.trim();
  }

  toMessageEntities(): {
    content: string;
    entities: MessageEntity[];
  } {
    const html = this.toHTML();
    const root = parse(html);

    let plainText = '';
    const entities: MessageEntity[] = [];

    function traverse(node: Node): void {
      if (node instanceof TextNode) {
        plainText += node.text;
        return;
      }

      if (node instanceof HTMLElement) {
        const currentOffset = plainText.length;
        const tagName = node.tagName?.toLowerCase();

        const childTextBefore = plainText;
        node.childNodes.forEach(traverse);
        const childTextAfter = plainText;
        const contentLength = childTextAfter.length - childTextBefore.length;

        if (contentLength > 0) {
          let entity: MessageEntity | null = null;
          switch (tagName) {
            case 'strong':
            case 'b':
              entity = {
                type: 'bold',
                offset: currentOffset,
                length: contentLength,
              };
              break;
            case 'em':
            case 'i':
              entity = {
                type: 'italic',
                offset: currentOffset,
                length: contentLength,
              };
              break;
            case 'u':
              entity = {
                type: 'underline',
                offset: currentOffset,
                length: contentLength,
              };
              break;
            case 'del':
            case 's':
              entity = {
                type: 'strikethrough',
                offset: currentOffset,
                length: contentLength,
              };
              break;
            case 'code':
              entity = {
                type: 'code',
                offset: currentOffset,
                length: contentLength,
                language: node.getAttribute('lang') || '',
              };
              break;
            case 'pre':
              entity = {
                type: 'pre',
                offset: currentOffset,
                length: contentLength,
                language: '',
              };
              break;
            case 'a': {
              const href = node.getAttribute('href');
              if (href) {
                entity = {
                  type: 'text_link',
                  offset: currentOffset,
                  length: contentLength,
                  url: href,
                };
              }
              break;
            }
          }
          if (entity) {
            entities.push(entity);
          }
        }
      }
    }

    traverse(root);
    return {
      content: plainText.trim(),
      entities: entities.sort((a, b) => a.offset - b.offset),
    };
  }

  toPlainText(): string {
    const { content } = this.toMessageEntities();
    return content.trim();
  }
}
