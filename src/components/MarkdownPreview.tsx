import { marked } from 'marked';

type Props = { value: string };

export function MarkdownPreview({ value }: Props) {
  if (!value.trim()) {
    return <p className="muted empty-copy">No notes yet. Add a little context about what you are building.</p>;
  }

  return <div className="markdown" dangerouslySetInnerHTML={{ __html: marked.parse(value, { breaks: true }) as string }} />;
}
