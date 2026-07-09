import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pencil, Eye } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  rows?: number;
  placeholder?: string;
  className?: string;
  textareaClassName?: string;
}

/**
 * Textarea with an Edit/Preview toggle that renders markdown via react-markdown.
 * Preview state is local; it does not modify `value`.
 */
const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  id,
  rows,
  placeholder,
  className,
  textareaClassName,
}) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-end">
        <div className="inline-flex rounded-md border border-input bg-background p-0.5">
          <Button
            type="button"
            size="sm"
            variant={mode === 'edit' ? 'secondary' : 'ghost'}
            className="h-7 px-2 text-xs"
            onClick={() => setMode('edit')}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'preview' ? 'secondary' : 'ghost'}
            className="h-7 px-2 text-xs"
            onClick={() => setMode('preview')}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Preview
          </Button>
        </div>
      </div>
      {mode === 'edit' ? (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={textareaClassName}
        />
      ) : (
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
