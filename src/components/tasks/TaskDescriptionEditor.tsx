"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EditorContent, useEditor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import Underline from "@tiptap/extension-underline";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Link from "@tiptap/extension-link";
import Heading from "@tiptap/extension-heading";
import History from "@tiptap/extension-history";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Strikethrough,
  Underline as UnderlineIcon,
  Code as CodeIcon,
  List as ListIcon,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";

interface TaskDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function TaskDescriptionEditor({ value, onChange }: TaskDescriptionEditorProps) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak,
      History,
      Bold,
      Italic,
      Strike,
      Code,
      Underline,
      ListItem,
      BulletList,
      OrderedList,
      Link.configure({ openOnClick: false }),
      Heading.configure({ levels: [1, 2] }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync when parent value changes externally
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="border rounded-md">
      <div className="border-b bg-muted/30 px-3 py-2 flex gap-1 flex-wrap">
        {/* Text formatting */}
        <Button size="sm" variant={editor?.isActive("bold") ? "secondary" : "ghost"} type="button" onClick={() => editor?.chain().focus().toggleBold().run()} aria-pressed={editor?.isActive("bold") || false}>
          <BoldIcon className="h-4 w-4" />
        </Button>
        <Button size="sm" variant={editor?.isActive("italic") ? "secondary" : "ghost"} type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} aria-pressed={editor?.isActive("italic") || false}>
          <ItalicIcon className="h-4 w-4" />
        </Button>
        <Button size="sm" variant={editor?.isActive("strike") ? "secondary" : "ghost"} type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} aria-pressed={editor?.isActive("strike") || false}>
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button size="sm" variant={editor?.isActive("underline") ? "secondary" : "ghost"} type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} aria-pressed={editor?.isActive("underline") || false}>
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button size="sm" variant={editor?.isActive("code") ? "secondary" : "ghost"} type="button" onClick={() => editor?.chain().focus().toggleCode().run()} aria-pressed={editor?.isActive("code") || false}>
          <CodeIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button size="sm" variant={editor?.isActive("bulletList") ? "secondary" : "ghost"} type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-pressed={editor?.isActive("bulletList") || false}>
          <ListIcon className="h-4 w-4" />
        </Button>
        <Button size="sm" variant={editor?.isActive("orderedList") ? "secondary" : "ghost"} type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} aria-pressed={editor?.isActive("orderedList") || false}>
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <Button size="sm" variant={editor?.isActive("heading", { level: 1 }) ? "secondary" : "ghost"} type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} aria-pressed={editor?.isActive("heading", { level: 1 }) || false}>
          H1
        </Button>
        <Button size="sm" variant={editor?.isActive("heading", { level: 2 }) ? "secondary" : "ghost"} type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} aria-pressed={editor?.isActive("heading", { level: 2 }) || false}>
          H2
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Other */}
        <Button size="sm" variant={editor?.isActive("link") ? "secondary" : "ghost"} type="button" onClick={setLink} aria-pressed={editor?.isActive("link") || false}>
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Undo/Redo */}
        <Button size="sm" variant="ghost" type="button" onClick={() => editor?.chain().focus().undo().run()} aria-label="Undo">
          <Undo className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => editor?.chain().focus().redo().run()} aria-label="Redo">
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

export default TaskDescriptionEditor;


