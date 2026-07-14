import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pencil, Eye, BookOpen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  rows?: number;
  placeholder?: string;
  className?: string;
  textareaClassName?: string;
  /** Optional content rendered on the left of the toolbar row (e.g. a Label). */
  toolbarLeft?: React.ReactNode;
}

type Mode = 'edit' | 'guide' | 'preview';

const SYNTAX_ROWS: Array<{ feature: string; syntax: React.ReactNode }> = [
  { feature: 'Hyperlink', syntax: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">[text](https://url/)</code> },
  { feature: 'Image', syntax: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">![alt text](https://url/image.png)</code> },
  { feature: 'Italics', syntax: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">*text*</code> },
  { feature: 'Bold', syntax: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">**text**</code> },
  { feature: 'Heading 1', syntax: <code className="text-xs bg-muted px-1.5 py-0.5 rounded"># text</code> },
  { feature: 'Heading 2', syntax: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">## text</code> },
  {
    feature: 'List',
    syntax: (
      <>
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">- item 1</code>
        <br />
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">- item 2</code>
      </>
    ),
  },
  { feature: 'Quote', syntax: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">&gt; text</code> },
  { feature: 'Code', syntax: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">`code`</code> },
];

/**
 * Textarea with an Edit / Syntax Guide / Preview toggle.
 * Guide and Preview are local view states; they never mutate `value`.
 */
const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  id,
  rows,
  placeholder,
  className,
  textareaClassName,
  toolbarLeft,
}) => {
  const [mode, setMode] = useState<Mode>('edit');

  const toggleButton = (target: Mode, label: string, Icon: React.ComponentType<{ className?: string }>) => (
    <Button
      type="button"
      size="sm"
      variant={mode === target ? 'secondary' : 'ghost'}
      className="h-7 px-2 text-xs"
      onClick={() => setMode(target)}
    >
      <Icon className="h-3.5 w-3.5 mr-1" />
      {label}
    </Button>
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">{toolbarLeft}</div>
        <div className="inline-flex rounded-md border border-input bg-background p-0.5">
          {toggleButton('edit', 'Edit', Pencil)}
          {toggleButton('guide', 'Syntax Guide', BookOpen)}
          {toggleButton('preview', 'Preview', Eye)}
        </div>
      </div>
      {mode === 'edit' && (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={textareaClassName}
        />
      )}
      {mode === 'guide' && (
        <div
          className={cn(
            'rounded-md border border-input bg-background px-3 py-2 text-sm overflow-auto',
            textareaClassName,
          )}
        >
          <p className="text-xs text-muted-foreground mb-3">
            Basic markdown is supported. Images must be referenced by absolute URL — the editor
            does not upload local files — and should include descriptive alt text for accessibility.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Syntax</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SYNTAX_ROWS.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="font-medium">{row.feature}</TableCell>
                  <TableCell>{row.syntax}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {mode === 'preview' && (
        <div
          className={cn(
            'rounded-md border border-input bg-background px-3 py-2 text-sm overflow-auto',
            textareaClassName,
          )}
        >
          {value.trim() ? (
            <div className="markdown-preview text-sm text-muted-foreground break-words [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:list-decimal [&_ol]:pl-8 [&_li]:my-0.5 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2 [&_p]:my-2 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_hr]:my-3 [&_hr]:border-border">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground italic">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
