import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Bold,
  Italic,
  Link,
  ListOrdered,
  ListChecks
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder
}: RichTextEditorProps) {
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  const handleFormat = (format: string) => {
    let newText = value;
    const prefix = {
      bold: '**',
      italic: '_',
      link: '[',
      orderedList: '1. ',
      checklist: '- [ ] '
    }[format];

    const suffix = format === 'link' ? '](url)' : format === 'bold' || format === 'italic' ? prefix : '';

    newText = 
      value.substring(0, selection.start) +
      prefix +
      value.substring(selection.start, selection.end) +
      suffix +
      value.substring(selection.end);

    onChange(newText);
  };

  return (
    <Card className="p-2">
      <div className="flex gap-2 mb-2 border-b pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFormat('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFormat('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFormat('link')}
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFormat('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFormat('checklist')}
          title="Checklist"
        >
          <ListChecks className="h-4 w-4" />
        </Button>
      </div>

      <Textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setSelection({
            start: e.target.selectionStart,
            end: e.target.selectionEnd
          });
        }}
        onSelect={(e) => {
          const target = e.target as HTMLTextAreaElement;
          setSelection({
            start: target.selectionStart,
            end: target.selectionEnd
          });
        }}
        placeholder={placeholder}
        className="min-h-[200px] resize-none"
      />
    </Card>
  );
}
