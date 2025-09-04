"use client";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { insertOrUpdateBlock, BlockNoteEditor } from "@blocknote/core";
import { Info, Table, FileText, Calendar } from "lucide-react";
import { customSchema } from "./custom-schema";

// Get all custom slash menu items including defaults
export const getCustomSlashMenuItems = (
  editor: BlockNoteEditor<typeof customSchema.blockSchema, typeof customSchema.inlineContentSchema, typeof customSchema.styleSchema>
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  
  // Single Alert block
  {
    title: "Alert",
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: "alert",
        props: { type: "info" },
        content: [{
          type: "text",
          text: "Alert",
          styles: {},
        }],
      });
    },
    aliases: ["alert", "info", "warning", "error", "success"],
    group: "Custom Blocks",
    icon: <Info size={18} className="text-blue-600" />,
    subtext: "Insert an alert message block",
  },

  // Project Tasks block
  {
    title: "Project Tasks",
    onItemClick: () => {
      type EditorWithComments = { options?: { comments?: { threadStore?: { docId?: string } } } };
      const docId = ((editor as unknown as EditorWithComments).options?.comments?.threadStore?.docId) ?? "";
      insertOrUpdateBlock(editor, {
        type: "datatable",
        props: { docId },
      });
    },
    aliases: ["datatable", "table", "tasks", "project tasks"],
    group: "Custom Blocks",
    icon: <Table size={18} className="text-green-600" />,
    subtext: "Insert a table of tasks for this project",
  },

  // Project Details block
  {
    title: "Project Details",
    onItemClick: () => {
      type EditorWithComments = { options?: { comments?: { threadStore?: { docId?: string } } } };
      const docId = ((editor as unknown as EditorWithComments).options?.comments?.threadStore?.docId) ?? "";
      insertOrUpdateBlock(editor, {
        type: "metadata",
        props: { docId },
      });
    },
    aliases: ["metadata", "project details", "details"],
    group: "Custom Blocks",
    icon: <FileText size={18} className="text-purple-600" />,
    subtext: "Insert a project details table",
  },

  // Weekly Update block
  {
    title: "Weekly Update",
    onItemClick: () => {
      type EditorWithComments = { options?: { comments?: { threadStore?: { docId?: string } } } };
      const docId = ((editor as unknown as EditorWithComments).options?.comments?.threadStore?.docId) ?? "";
      insertOrUpdateBlock(editor, {
        type: "weeklyupdate",
        props: { docId },
      });
    },
    aliases: ["weekly", "status", "update"],
    group: "Custom Blocks",
    icon: <Calendar size={18} className="text-orange-600" />,
    subtext: "Insert weekly updates list for this page",
  },
];
