"use client";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileWarning,
  Layers,
  Unlink,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  healthApi,
  useMissingEmbeddings,
  useOrphans,
  useFailedDocuments,
  useQueueMetrics,
} from "@/features/health";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  AppPage,
  AppPageActions,
  AppPageContent,
  AppPageDescription,
  AppPageHeader,
  AppPageHeading,
  AppPageTitle,
} from "@/components/layouts/app-page";

function StatCard({
  title,
  value,
  icon: Icon,
  status,
  description,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  status: "healthy" | "warning" | "critical";
  description: string;
}) {
  const statusConfig = {
    healthy: {
      bg: "bg-emerald-500/10 border-emerald-500/20",
      icon: "text-emerald-500",
      badge:
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    },
    warning: {
      bg: "bg-amber-500/10 border-amber-500/20",
      icon: "text-amber-500",
      badge:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    },
    critical: {
      bg: "bg-red-500/10 border-red-500/20",
      icon: "text-red-500",
      badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "rounded-xl border p-5 space-y-3 transition-colors",
        config.bg,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon className={cn("size-5", config.icon)} />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] uppercase tracking-wider font-bold",
            config.badge,
          )}
        >
          {status}
        </Badge>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function QueueCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </p>
      <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
    </div>
  );
}

export default function HealthPage() {
  const embeddings = useMissingEmbeddings();
  const orphans = useOrphans();
  const failedDocs = useFailedDocuments();
  const queue = useQueueMetrics();
  const [isExporting, setIsExporting] = React.useState(false);

  const isLoading =
    embeddings.isLoading ||
    orphans.isLoading ||
    failedDocs.isLoading ||
    queue.isLoading;
  const error =
    embeddings.error || orphans.error || failedDocs.error || queue.error;

  const missingCount = embeddings.data?.chunksWithoutEmbeddings.length ?? 0;
  const orphanChunkCount = orphans.data?.orphanChunks.length ?? 0;
  const orphanConceptCount = orphans.data?.orphanConcepts.length ?? 0;
  const failedCount = failedDocs.data?.failedDocuments.length ?? 0;

  const totalIssues =
    missingCount + orphanChunkCount + orphanConceptCount + failedCount;

  const getStatus = (count: number): "healthy" | "warning" | "critical" => {
    if (count === 0) return "healthy";
    if (count <= 5) return "warning";
    return "critical";
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await healthApi.getFullExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mind-stack-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppPage width="wide">
      <AppPageHeader>
        <AppPageHeading>
          <AppPageTitle className="flex items-center gap-3">
            <Activity className="size-7 text-primary" />
            Knowledge Health
          </AppPageTitle>
          <AppPageDescription>
            Monitor the integrity of your knowledge base.
          </AppPageDescription>
        </AppPageHeading>
        {!isLoading && !error && (
          <AppPageActions>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                Export Brain Data
              </Button>
              {totalIssues === 0 ? (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1.5 px-3 py-1">
                  <CheckCircle2 className="size-3.5" />
                  All Systems Healthy
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 gap-1.5 px-3 py-1"
                >
                  <AlertTriangle className="size-3.5" />
                  {totalIssues} Issue{totalIssues !== 1 ? "s" : ""} Found
                </Badge>
              )}
          </AppPageActions>
        )}
      </AppPageHeader>
      <AppPageContent className="gap-8">

        {/* Loading */}
        {isLoading && (
          <PageSkeleton className="max-w-5xl" rows={4} data-testid="health-loading" />
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive" data-testid="health-error">
            <AlertTriangle className="size-4" />
            <AlertTitle>Failed to load health data</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        {/* Health Cards */}
        {!isLoading && !error && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Missing Embeddings"
                value={missingCount}
                icon={Database}
                status={getStatus(missingCount)}
                description="Chunks without vector embeddings — search won't find these."
              />
              <StatCard
                title="Orphan Concepts"
                value={orphanConceptCount}
                icon={Unlink}
                status={getStatus(orphanConceptCount)}
                description="Knowledge graph nodes without any relationships."
              />
              <StatCard
                title="Failed Documents"
                value={failedCount}
                icon={FileWarning}
                status={getStatus(failedCount)}
                description="Documents that failed ingestion and need retry."
              />
            </div>

            {/* Queue Metrics */}
            {queue.data && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="size-5 text-muted-foreground" />
                    Ingestion Queue
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <QueueCard
                      title="Waiting"
                      value={queue.data.waiting}
                      color="text-muted-foreground"
                    />
                    <QueueCard
                      title="Active"
                      value={queue.data.active}
                      color="text-blue-500"
                    />
                    <QueueCard
                      title="Completed"
                      value={queue.data.completed}
                      color="text-emerald-500"
                    />
                    <QueueCard
                      title="Failed"
                      value={queue.data.failed}
                      color="text-red-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Detail Lists */}
            {failedDocs.data && failedDocs.data.failedDocuments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileWarning className="size-5 text-red-500" />
                    Failed Documents
                  </h2>
                  <div className="rounded-xl border divide-y">
                    {failedDocs.data.failedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.title}</p>
                          {doc.processingError && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {doc.processingError}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {orphans.data && orphans.data.orphanConcepts.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Unlink className="size-5 text-amber-500" />
                    Orphan Concepts
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {orphans.data.orphanConcepts.map((concept) => (
                      <Badge
                        key={concept.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {concept.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {embeddings.data &&
              embeddings.data.chunksWithoutEmbeddings.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Database className="size-5 text-amber-500" />
                      Missing Embeddings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {missingCount} chunk{missingCount !== 1 ? "s" : ""}{" "}
                      without embeddings. These won&apos;t appear in semantic
                      search results.
                    </p>
                  </div>
                </>
              )}
          </>
        )}

        {/* Refreshing indicator */}
        {(embeddings.isFetching ||
          orphans.isFetching ||
          failedDocs.isFetching) &&
          !isLoading && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="size-3 animate-spin" />
              Refreshing...
            </div>
          )}
      </AppPageContent>
    </AppPage>
  );
}
