"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconPlayerPlay, IconSquareCheck } from "@tabler/icons-react";
import { SprintOverviewTab } from "@/components/sprints/SprintOverviewTab";
import { SprintTasksTab } from "@/components/sprints/SprintTasksTab";
import { toast } from "sonner";

export default function SprintDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const sprint = useQuery(api.sprints.getSprint, params?.id ? { id: params.id as any } : ("skip" as any));
  const startSprint = useMutation(api.sprints.startSprint);
  const completeSprint = useMutation(api.sprints.completeSprint);

  if (!user) return null;
  if (!sprint) return null;

  const canManage = user.role === "admin" || user.role === "pm";

  const handleStart = async () => {
    try {
      await startSprint({ id: sprint._id });
      toast.success("Sprint started");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to start sprint");
    }
  };

  const handleComplete = async () => {
    try {
      await completeSprint({ id: sprint._id });
      toast.success("Sprint completed");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to complete sprint");
    }
  };

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/sprints")}> 
              <IconArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{sprint.name}</h1>
              <p className="text-muted-foreground">{sprint.department?.name} • {sprint.client?.name}</p>
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              {sprint.status === "planning" && (
                <Button onClick={handleStart}>
                  <IconPlayerPlay className="w-4 h-4 mr-2" /> Start Sprint
                </Button>
              )}
              {sprint.status === "active" && (
                <Button onClick={handleComplete}>
                  <IconSquareCheck className="w-4 h-4 mr-2" /> Complete Sprint
                </Button>
              )}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Capacity, timeline, and status</CardDescription>
          </CardHeader>
          <CardContent>
            <SprintOverviewTab sprint={sprint as any} />
          </CardContent>
        </Card>

        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks">
            <SprintTasksTab sprint={sprint as any} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}


