import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, Undo, Redo } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type TipTapDoc = Record<string, unknown>;
type Vars = Record<string, string>;

export const EMPTY_TIPTAP_DOC: TipTapDoc = { type: 'doc', content: [{ type: 'paragraph' }] };

export function interpolateTipTapDoc(doc: unknown, vars: Vars): unknown {
  if (doc == null) return doc;
  if (Array.isArray(doc)) return doc.map((n) => interpolateTipTapDoc(n, vars));
  if (typeof doc === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc)) {
      if (k === 'text' && typeof v === 'string') {
        out[k] = v.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
      } else {
        out[k] = interpolateTipTapDoc(v, vars);
      }
    }
    return out;
  }
  return doc;
}

interface RichTextEditorProps {
  value: TipTapDoc | null | undefined;
  onChange: (value: TipTapDoc) => void;
  disabled?: boolean;
  className?: string;
}

export function RichTextEditor({ value, onChange, disabled, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false
      }),
      Underline
    ],
    content: value ?? undefined,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    }
  });

  if (!editor) return null;

  return (
    <div className={cn('rounded-md border border-input bg-background', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input p-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          aria-label="Bold">
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          aria-label="Italic">
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          disabled={disabled}
          aria-label="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Separator orientation="vertical" className="mx-0.5 h-6" />
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          aria-label="Undo">
          <Undo className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          aria-label="Redo">
          <Redo className="h-4 w-4" />
        </Toggle>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none px-3 py-2 focus-within:outline-none min-h-[150px] [&_.ProseMirror]:outline-none"
      />
    </div>
  );
}

interface RichTextDisplayProps {
  content: TipTapDoc | null | undefined;
  className?: string;
}

export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false
      }),
      Underline
    ],
    content: content ?? undefined,
    editable: false
  });

  if (!editor) return null;

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
