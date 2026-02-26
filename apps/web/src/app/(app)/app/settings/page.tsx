"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  useLlmConfig,
  useUpdateLlmConfig,
  useEmbeddingModelHealth,
} from "@/features/settings";
import {
  UpdateUserLlmConfigSchema,
  UserLlmConfigSchema,
} from "@/features/settings/schemas/settings.schemas";
import type { UpdateUserLlmConfig } from "@/features/settings/types";
import { MODEL_PROVIDER } from "@repo/shared-types";

export default function SettingsPage() {
  const configQuery = useLlmConfig();
  const updateConfig = useUpdateLlmConfig();
  const healthQuery = useEmbeddingModelHealth();

  const form = useForm<UpdateUserLlmConfig>({
    resolver: zodResolver(UpdateUserLlmConfigSchema),
    defaultValues: {
      embeddingProvider: MODEL_PROVIDER.OLLAMA,
      embeddingModel: "",
      generationProvider: MODEL_PROVIDER.OLLAMA,
      generationModel: "",
    },
  });

  useEffect(() => {
    if (!configQuery.data) return;
    const parsed = UserLlmConfigSchema.safeParse(configQuery.data);
    if (!parsed.success) return;
    form.reset({
      embeddingProvider: parsed.data.embeddingProvider,
      embeddingModel: parsed.data.embeddingModel,
      generationProvider: parsed.data.generationProvider,
      generationModel: parsed.data.generationModel,
    });
  }, [configQuery.data, form]);

  const handleSubmit = form.handleSubmit((values) => {
    updateConfig.mutate(values);
  });

  const showHealth = !healthQuery.isLoading && !healthQuery.error;

  return (
          <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Settings className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Model Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure your embedding and generation models for this account.
            </p>
          </div>
        </div>

        {(configQuery.isLoading || healthQuery.isLoading) && (
          <div className="space-y-3" data-testid="settings-loading">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        )}

        {(configQuery.error || healthQuery.error) && (
          <Alert variant="destructive" data-testid="settings-error">
            <AlertTitle>Unable to load settings</AlertTitle>
            <AlertDescription>
              {getApiErrorMessage(configQuery.error ?? healthQuery.error)}
            </AlertDescription>
          </Alert>
        )}

        {configQuery.data && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-6 space-y-5 rounded-xl border bg-card">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">
                  Embedding Configuration
                </h2>
                <p className="text-xs text-muted-foreground">
                  Controls semantic search, retrieval, and document indexing.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="embeddingProvider">Provider</Label>
                  <Input
                    id="embeddingProvider"
                    value={configQuery.data.embeddingProvider}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="embeddingModel">Embedding model</Label>
                  <Input
                    id="embeddingModel"
                    {...form.register("embeddingModel")}
                    placeholder="e.g. nomic-embed-text"
                  />
                  {form.formState.errors.embeddingModel && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.embeddingModel.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 rounded-xl border bg-card">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">
                  Generation Configuration
                </h2>
                <p className="text-xs text-muted-foreground">
                  Used for answers, summaries, and extracted insights.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="generationProvider">Provider</Label>
                  <Input
                    id="generationProvider"
                    value={configQuery.data.generationProvider}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generationModel">Generation model</Label>
                  <Input
                    id="generationModel"
                    {...form.register("generationModel")}
                    placeholder="e.g. llama3"
                  />
                  {form.formState.errors.generationModel && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.generationModel.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {showHealth && healthQuery.data && (
              <Alert
                variant={healthQuery.data.available ? "default" : "destructive"}
                data-testid="settings-health"
              >
                <div className="flex items-start gap-2">
                  {healthQuery.data.available ? (
                    <CheckCircle2 className="size-4 text-emerald-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="size-4 text-destructive mt-0.5" />
                  )}
                  <div>
                    <AlertTitle>
                      {healthQuery.data.available
                        ? "Embedding model available"
                        : "Embedding model unavailable"}
                    </AlertTitle>
                    <AlertDescription>
                      {healthQuery.data.available
                        ? `Ollama at ${healthQuery.data.baseUrl} has ${healthQuery.data.model} ready.`
                        : (healthQuery.data.reason ??
                          "The selected embedding model is not available on the Ollama server.")}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={updateConfig.isPending}>
                {updateConfig.isPending ? "Saving..." : "Save configuration"}
              </Button>
              {updateConfig.isSuccess && (
                <span className="text-xs text-emerald-600">
                  Configuration updated
                </span>
              )}
              {updateConfig.error && (
                <span className="text-xs text-destructive">
                  {getApiErrorMessage(updateConfig.error)}
                </span>
              )}
            </div>
          </form>
        )}
      </div>
  );
}
