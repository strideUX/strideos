"use client";
import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import type { ReactElement } from "react";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProjectTasksTab } from "@/components/projects/ProjectTasksTab";

type BlockProps = { projectId?: string };

function TasksTableInner({ projectIdProp }: { projectIdProp?: string }): ReactElement {
  const params = useParams();
  const urlDocumentId = (params?.documentId as string) || "";

  const docList = (useQuery as any)(api.documents.list as any, {} as any) as any[] | undefined;
  const projectIdFromDoc = useMemo(() => {
    if (!urlDocumentId || !Array.isArray(docList)) return "";
    const match = docList.find((d) => String(d._id) === String(urlDocumentId));
    return (match?.projectId as string) || (match?.metadata?.projectId as string) || "";
  }, [docList, urlDocumentId]);
  const effectiveProjectId = (projectIdProp && String(projectIdProp)) || projectIdFromDoc || "";

  const project = (useQuery as any)(
    (api.projects.getProject as any),
    effectiveProjectId ? ({ projectId: effectiveProjectId as any } as any) : ("skip" as any)
  ) as any | null | undefined;

  const tasks = (useQuery as any)(
    api.tasks.getTasksByProject as any,
    effectiveProjectId ? ({ projectId: effectiveProjectId as any } as any) : ("skip" as any)
  ) as any[] | undefined;

  if (!effectiveProjectId) {
    return (
      <div className="my-4" contentEditable={false}>
        <div className="text-sm text-muted-foreground">
          Link this document to a project to display tasks.
        </div>
      </div>
    );
  }

  return (
    <div className="my-4" contentEditable={false}>
      <ProjectTasksTab
        projectId={effectiveProjectId as any}
        clientId={project?.clientId as any}
        departmentId={project?.departmentId as any}
        tasks={(tasks || []) as any}
      />
    </div>
  );
}

export const TasksTable: any = (createReactBlockSpec as any)(
  ({
    type: "tasksTable",
    propSchema: {
      textAlignment: (defaultProps as any).textAlignment,
      // Persist projectId from document context; keep as string per BlockNote rules
      projectId: { default: "" },
    },
    content: "none",
  } as any),
  ({
    render: (props: any): ReactElement => {
      const blockProps = (props.block.props as unknown as BlockProps) || {};
      return <TasksTableInner projectIdProp={blockProps.projectId} />;
    },
    parse: () => undefined,
    toExternalHTML: (_props: any): ReactElement => {
      // Render a simple placeholder for external serialization
      return (
        <div className="my-2">[Project Tasks]</div>
      );
    },
  } as any)
);

