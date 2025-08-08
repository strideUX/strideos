"use client";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/components/providers/AuthProvider";
import { SprintFormPage } from "@/components/sprints/SprintFormPage";

export default function NewSprintPage() {
  const { user } = useAuth();
  if (!user) return <div>Loading...</div>;
  return (
    <>
      <SiteHeader user={user} />
      <SprintFormPage />
    </>
  );
}


