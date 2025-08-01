// content.test.ts
import { describe, it, expect } from 'vitest';
import { Content, MessageEntity } from '../src/utils/content';

describe('Content Tests', () => {
  it('Init', () => {
    const md = new Content('hello **world**', 'md');
    expect(md.content).toBe('hello **world**');
    expect(md.format).toBe('md');

    const html = new Content('<p>foo</p>', 'html');
    expect(html.content).toBe('<p>foo</p>');
    expect(html.format).toBe('html');
  });

  it('toMarkdown', () => {
    const fromMd = new Content('**bold** and _italic_', 'md');
    expect(fromMd.toMarkdown()).toBe('**bold** and _italic_');

    const fromHtml = new Content(
      '<strong>bold</strong> and <em>italic</em>',
      'html'
    );
    const md = fromHtml.toMarkdown();
    expect(md).toContain('**bold**');
    expect(md).toMatch(/[_*]italic[_*]/);
  });

  it('toHTML', () => {
    const md = new Content('**bold** and _italic_', 'md');
    const html = md.toHTML();
    // marked 产出的 html 里应包含 <strong> 和 <em>
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');

    const rawHtml = new Content('<div>plain</div>', 'html');
    expect(rawHtml.toHTML()).toBe('<div>plain</div>');
  });

  it('toMessageEntities', () => {
    const c = new Content('Hello **bold** and `code`', 'md');
    const { content, entities } = c.toMessageEntities();

    expect(content).toBe('Hello bold and code');

    // 应该捕获到粗体和 code 两种 entity
    expect(entities).toEqual(
      expect.arrayContaining<MessageEntity>([
        expect.objectContaining({
          type: 'bold',
          offset: 6,
          length: 4,
        }),
        expect.objectContaining({
          type: 'code',
          offset: 15,
          length: 4,
        }),
      ])
    );
  });

  it('toPlainText', () => {
    const c = new Content('Hello **bold** and `code`', 'md');
    expect(c.toPlainText()).toBe('Hello bold and code');
  });
});
