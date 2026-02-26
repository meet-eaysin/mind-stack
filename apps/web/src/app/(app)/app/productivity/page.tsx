"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Target,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  BookOpen,
  Folder,
  CheckCircle2,
  Brain,
  Eye,
  GraduationCap,
  HelpCircle,
  Loader2,
} from "lucide-react";
import {
  useTopicMastery,
  useLearningGoals,
  useCreateLearningGoal,
  useDeleteLearningGoal,
} from "@/features/productivity";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function MasteryRing({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div
        className={cn(
          "relative flex size-16 items-center justify-center rounded-full border-4",
          color,
        )}
      >
        <span className="text-lg font-bold tabular-nums">{value}</span>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground">{percent}%</span>
    </div>
  );
}

export default function ProductivityPage() {
  const mastery = useTopicMastery();
  const goals = useLearningGoals();
  const createGoal = useCreateLearningGoal();
  const deleteGoal = useDeleteLearningGoal();

  const [goalName, setGoalName] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateGoal = () => {
    if (!goalName.trim()) return;
    createGoal.mutate(
      {
        name: goalName.trim(),
        deadline: goalDeadline || undefined,
      },
      {
        onSuccess: () => {
          setGoalName("");
          setGoalDeadline("");
          setDialogOpen(false);
        },
      },
    );
  };

  return (
          <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <TrendingUp className="size-7 text-primary" />
              Learning Productivity
            </h1>
            <p className="text-muted-foreground">
              Track your mastery, set goals, and measure progress.
            </p>
          </div>
        </div>

        {/* Topic Mastery Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="size-5 text-muted-foreground" />
            Topic Mastery
          </h2>

          {mastery.isLoading && (
            <div
              className="grid gap-4 sm:grid-cols-2"
              data-testid="mastery-loading"
            >
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          )}

          {mastery.error && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {getApiErrorMessage(mastery.error)}
            </div>
          )}

          {mastery.data && (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Coverage Card */}
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Knowledge Coverage
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] uppercase tracking-wider font-bold",
                      mastery.data.coverage.percent >= 70
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : mastery.data.coverage.percent >= 40
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
                    )}
                  >
                    {mastery.data.coverage.percent}%
                  </Badge>
                </div>
                <Progress
                  value={mastery.data.coverage.percent}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {mastery.data.coverage.reviewedConcepts} of{" "}
                  {mastery.data.coverage.totalConcepts} concepts reviewed
                </div>
              </div>

              {/* Mastery Levels */}
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <span className="text-sm font-semibold">
                  Concept Mastery Levels
                </span>
                <div className="flex items-center justify-around">
                  <MasteryRing
                    label="Mastered"
                    value={mastery.data.levels.mastered}
                    total={mastery.data.coverage.totalConcepts}
                    color="border-emerald-500"
                  />
                  <MasteryRing
                    label="Consolidating"
                    value={mastery.data.levels.consolidating}
                    total={mastery.data.coverage.totalConcepts}
                    color="border-blue-500"
                  />
                  <MasteryRing
                    label="Learning"
                    value={mastery.data.levels.learning}
                    total={mastery.data.coverage.totalConcepts}
                    color="border-amber-500"
                  />
                  <MasteryRing
                    label="Unseen"
                    value={mastery.data.levels.unseen}
                    total={mastery.data.coverage.totalConcepts}
                    color="border-muted-foreground/30"
                  />
                </div>
              </div>

              {/* Learning Status Distribution */}
              {Object.keys(mastery.data.learningStatusDistribution).length >
                0 && (
                <div className="rounded-xl border bg-card p-6 space-y-3 sm:col-span-2">
                  <span className="text-sm font-semibold">
                    Document Status Distribution
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(
                      mastery.data.learningStatusDistribution,
                    ).map(([status, count]) => {
                      const iconMap: Record<string, React.ReactNode> = {
                        COMPLETED: (
                          <CheckCircle2 className="size-3.5 text-emerald-500" />
                        ),
                        IN_PROGRESS: (
                          <BookOpen className="size-3.5 text-blue-500" />
                        ),
                        REVIEW: <Eye className="size-3.5 text-purple-500" />,
                        UPCOMING: (
                          <Calendar className="size-3.5 text-amber-500" />
                        ),
                        TO_WATCH: <Eye className="size-3.5 text-orange-500" />,
                        TO_READ: (
                          <BookOpen className="size-3.5 text-cyan-500" />
                        ),
                      };
                      return (
                        <div
                          key={status}
                          className="flex items-center gap-2 rounded-lg border px-3 py-2"
                        >
                          {iconMap[status] ?? (
                            <HelpCircle className="size-3.5" />
                          )}
                          <span className="text-xs font-medium">
                            {status.replaceAll("_", " ")}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {count}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Weak Areas */}
              {mastery.data.weakAreas.length > 0 && (
                <div className="rounded-xl border bg-card p-6 space-y-3 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <span className="text-sm font-semibold">Weak Areas</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mastery.data.weakAreas.map((area) => (
                      <Badge
                        key={area.id}
                        variant="outline"
                        className="bg-amber-500/5 text-xs gap-1"
                      >
                        {area.label}
                        <span className="text-muted-foreground">
                          (EF: {area.easeFactor.toFixed(1)})
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <Separator />

        {/* Learning Goals Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="size-5 text-muted-foreground" />
              Learning Goals
            </h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Learning Goal</DialogTitle>
                  <DialogDescription>
                    Add a measurable learning objective with an optional
                    deadline.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="goal-name">Goal Name</Label>
                    <Input
                      id="goal-name"
                      placeholder="e.g. Master distributed systems"
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-deadline">Deadline (optional)</Label>
                    <Input
                      id="goal-deadline"
                      type="date"
                      value={goalDeadline}
                      onChange={(e) => setGoalDeadline(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreateGoal}
                    disabled={!goalName.trim() || createGoal.isPending}
                  >
                    {createGoal.isPending && (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    )}
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {goals.isLoading && (
            <div className="space-y-3" data-testid="goals-loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          )}

          {goals.error && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {getApiErrorMessage(goals.error)}
            </div>
          )}

          {goals.data && goals.data.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="p-4 rounded-full bg-muted">
                <GraduationCap className="size-10 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No learning goals yet</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Create a goal to track your learning journey and measure
                progress toward mastery.
              </p>
            </div>
          )}

          {goals.data && goals.data.length > 0 && (
            <div className="space-y-3">
              {goals.data.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-xl border bg-card p-5 space-y-3 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {goal.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {goal.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {new Date(goal.deadline).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Folder className="size-3" />
                          {goal.itemCount} item{goal.itemCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold",
                          goal.progress >= 100
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            : goal.progress > 0
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {Math.round(goal.progress)}%
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteGoal.mutate(goal.id)}
                        disabled={deleteGoal.isPending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={goal.progress} className="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
  );
}
