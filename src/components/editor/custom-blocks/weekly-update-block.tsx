"use client";
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { useMemo, type ReactElement, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type WeeklyUpdateProps = {
  docId?: string;
  textAlignment?: (typeof defaultProps.textAlignment)["default"];
};

type BlockProps = { docId?: string; textAlignment?: (typeof defaultProps.textAlignment)["default"] };
type RenderBlock = { props?: BlockProps };
type RenderProps = { block: RenderBlock } & Record<string, unknown>;

interface WeeklyUpdateRow { _id: string; createdAt: number; authorId?: string; accomplished?: string; focus?: string; blockers?: string }

function WeeklyUpdateBlockComponent(renderProps: RenderProps): ReactElement {
  const props = (renderProps.block.props as WeeklyUpdateProps) ?? {};
  const docId = props.docId ?? "";

  const updates = useQuery(api.documents.listWeeklyUpdates, docId ? { docId } : "skip") as WeeklyUpdateRow[] | undefined;
  const createUpdate = useMutation(api.documents.createWeeklyUpdate);

  const rows = useMemo(() => updates ?? [], [updates]);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [accomplished, setAccomplished] = useState("");
  const [focus, setFocus] = useState("");
  const [blockers, setBlockers] = useState("");

  const handleAdd = useCallback(async (): Promise<void> => {
    setAccomplished("");
    setFocus("");
    setBlockers("");
    setOpen(true);
  }, []);

  const handleCreate = useCallback(async (): Promise<void> => {
    if (!docId) return;
    try {
      await createUpdate({ docId, accomplished, focus, blockers });
      setOpen(false);
    } catch {}
  }, [docId, createUpdate, accomplished, focus, blockers]);

  return (
    <div className="weekly-update-block w-full" style={{ border: "1px solid var(--wu-border, #e5e7eb)", borderRadius: 8, padding: 12, margin: "8px 0", background: "var(--wu-bg, #fff)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontWeight: 600 }}>Weekly Updates</div>
        <div contentEditable={false}>
          <button 
            type="button" 
            onClick={handleAdd}
            style={{
              backgroundColor: '#312C85',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2470';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#312C85';
            }}
          >
            Add Update
          </button>
        </div>
      </div>
      {rows.length === 0 ? (
        <div style={{ color: "var(--wu-muted, #6b7280)" }}>No updates yet. Click Add Update to create the first one.</div>
      ) : (
        <div style={{ display: "grid", rowGap: 10 }}>
          {rows.map((r: WeeklyUpdateRow) => (
            <div key={String(r._id)} style={{ border: "1px solid var(--wu-item-border, #f3f4f6)", borderRadius: 6, padding: 10, background: "var(--wu-item-bg, transparent)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>{new Date(r.createdAt).toLocaleString()}</div>
                {r.authorId ? <div style={{ color: "var(--wu-muted, #6b7280)" }}>by {r.authorId}</div> : null}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", rowGap: 6, columnGap: 12 }}>
                <div style={{ color: "var(--wu-label, #6b7280)", fontWeight: 500 }}>Accomplished this week</div>
                <div>{r.accomplished || "-"}</div>
                <div style={{ color: "var(--wu-label, #6b7280)", fontWeight: 500 }}>Next week&apos;s focus</div>
                <div>{r.focus || "-"}</div>
                <div style={{ color: "var(--wu-label, #6b7280)", fontWeight: 500 }}>Blockers</div>
                <div>{r.blockers || "-"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Weekly Update Dialog */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add weekly update</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1">
              <Label>What did you accomplish this week?</Label>
              <Textarea value={accomplished} onChange={(e) => setAccomplished(e.target.value)} rows={3} />
            </div>
            <div className="grid gap-1">
              <Label>What is next week&apos;s focus?</Label>
              <Textarea value={focus} onChange={(e) => setFocus(e.target.value)} rows={3} />
            </div>
            <div className="grid gap-1">
              <Label>Do you have any blockers?</Label>
              <Textarea value={blockers} onChange={(e) => setBlockers(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const WeeklyUpdate = createReactBlockSpec(
  {
    type: "weeklyupdate",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      docId: { default: "" as const },
    },
    content: "none",
  },
  {
    render: (props): ReactElement => {
      return <WeeklyUpdateBlockComponent {...(props as unknown as RenderProps)} />;
    },
    toExternalHTML: (_props): ReactElement => {
      return (
        <div className="weekly-update-block" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <strong>Weekly Updates</strong>
        </div>
      );
    },
  }
);

export type WeeklyUpdateType = "weeklyupdate";
