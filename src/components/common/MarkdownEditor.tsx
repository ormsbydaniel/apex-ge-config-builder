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
            <div className="prose prose-sm max-w-none dark:prose-invert break-words">
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
