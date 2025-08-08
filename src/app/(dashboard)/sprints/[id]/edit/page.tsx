"use client";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/components/providers/AuthProvider";
import { SprintFormPage } from "@/components/sprints/SprintFormPage";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function EditSprintPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const sprint = useQuery(api.sprints.getSprint, params?.id ? { id: params.id as any } : ("skip" as any));
  if (!user) return null;
  return (
    <>
      <SiteHeader user={user} />
      {sprint && <SprintFormPage sprint={sprint} />}
    </>
  );
}


