"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getApiErrorMessage } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  useLlmConfig,
  useUpdateLlmConfig,
  useEmbeddingModelHealth,
  useDeleteLlmConfig,
} from "@/features/settings";
import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelCapability,
} from "@repo/shared-types";
import {
  UpdateUserLlmConfigSchema,
  UserLlmConfigSchema,
} from "@/features/settings/schemas/settings.schemas";
import type { UpdateUserLlmConfig } from "@/features/settings/types";
import {
  AppPage,
  AppPageContent,
  AppPageDescription,
  AppPageHeader,
  AppPageHeading,
  AppPageTitle,
} from "@/components/layouts/app-page";

const PROVIDER_OPTIONS = [
  { value: MODEL_PROVIDER.OLLAMA, label: "Ollama" },
  { value: MODEL_PROVIDER.OPENAI, label: "OpenAI" },
  { value: MODEL_PROVIDER.OPENROUTER, label: "OpenRouter" },
  { value: MODEL_PROVIDER.GEMINI, label: "Google Gemini" },
];
const providerSchema = z.enum(MODEL_PROVIDER);

export default function SettingsPage() {
  const configQuery = useLlmConfig();
  const updateConfig = useUpdateLlmConfig();
  const deleteConfig = useDeleteLlmConfig();
  const healthQuery = useEmbeddingModelHealth();

  const form = useForm<UpdateUserLlmConfig>({
    resolver: zodResolver(UpdateUserLlmConfigSchema),
    defaultValues: {
      provider: MODEL_PROVIDER.OLLAMA,
      model: "",
      baseUrl: "",
      apiKey: "",
      enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
    },
  });

  useEffect(() => {
    if (!configQuery.data) return;
    const parsed = UserLlmConfigSchema.safeParse(configQuery.data);
    if (!parsed.success) return;

    form.reset({
      provider: parsed.data.provider,
      model: parsed.data.model,
      baseUrl: parsed.data.baseUrl ?? "",
      apiKey: "",
      enabledCapabilities: parsed.data.enabledCapabilities,
    });
  }, [configQuery.data, form]);

  const selectedCapabilities = form.watch("enabledCapabilities");

  const setCapability = (capability: ModelCapability, checked: boolean) => {
    const current = new Set(selectedCapabilities);
    if (checked) {
      current.add(capability);
    } else {
      current.delete(capability);
    }

    form.setValue("enabledCapabilities", Array.from(current), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleSubmit = form.handleSubmit((values) => {
    updateConfig.mutate({
      ...values,
      baseUrl:
        values.baseUrl && values.baseUrl.length > 0
          ? values.baseUrl
          : undefined,
      apiKey:
        values.apiKey && values.apiKey.length > 0 ? values.apiKey : undefined,
    });
  });

  const showHealth = !healthQuery.isLoading && !healthQuery.error;

  return (
    <AppPage width="compact">
      <AppPageHeader>
        <AppPageHeading>
          <AppPageTitle className="flex items-center gap-3">
            <Settings className="size-5 text-primary" />
            LLM Configuration
          </AppPageTitle>
          <AppPageDescription>
            Configure provider, model, API key, and capabilities per account.
          </AppPageDescription>
        </AppPageHeading>
      </AppPageHeader>
      <AppPageContent>
        {(configQuery.isLoading || healthQuery.isLoading) && (
          <PageSkeleton data-testid="settings-loading" rows={2} />
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
                <h2 className="text-base font-semibold">Provider</h2>
                <p className="text-xs text-muted-foreground">
                  Choose one provider and the model used for enabled
                  capabilities.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={form.watch("provider")}
                    onValueChange={(value) => {
                      const parsed = providerSchema.safeParse(value);
                      if (parsed.success) {
                        form.setValue("provider", parsed.data, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="provider" className="w-full">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_OPTIONS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    {...form.register("model")}
                    placeholder="e.g. gpt-4o-mini"
                  />
                  {form.formState.errors.model && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.model.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    autoComplete="new-password"
                    {...form.register("apiKey")}
                    placeholder={
                      configQuery.data.hasApiKey
                        ? "•••••••• (configured)"
                        : "sk-..."
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL (optional)</Label>
                  <Input
                    id="baseUrl"
                    {...form.register("baseUrl")}
                    placeholder="https://..."
                  />
                  {form.formState.errors.baseUrl && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.baseUrl.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 rounded-xl border bg-card">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">Capabilities</h2>
                <p className="text-xs text-muted-foreground">
                  Enable chat, embeddings, or both for this configuration.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedCapabilities.includes(
                      MODEL_CAPABILITY.CHAT,
                    )}
                    onCheckedChange={(checked) =>
                      setCapability(MODEL_CAPABILITY.CHAT, checked === true)
                    }
                  />
                  Chat / synthesis
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedCapabilities.includes(
                      MODEL_CAPABILITY.EMBEDDING,
                    )}
                    onCheckedChange={(checked) =>
                      setCapability(
                        MODEL_CAPABILITY.EMBEDDING,
                        checked === true,
                      )
                    }
                  />
                  Embeddings
                </label>
              </div>
              {form.formState.errors.enabledCapabilities && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.enabledCapabilities.message}
                </p>
              )}
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
                        ? `${healthQuery.data.provider} at ${healthQuery.data.baseUrl} is ready with model ${healthQuery.data.model}.`
                        : (healthQuery.data.reason ??
                          "Embedding capability is not currently available for this provider/model.")}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={updateConfig.isPending}>
                {updateConfig.isPending ? "Saving..." : "Save configuration"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={deleteConfig.isPending}
                onClick={() => deleteConfig.mutate()}
              >
                {deleteConfig.isPending ? "Resetting..." : "Reset to defaults"}
              </Button>
              {updateConfig.isSuccess && (
                <span className="text-xs text-emerald-600">
                  Configuration updated
                </span>
              )}
              {(updateConfig.error || deleteConfig.error) && (
                <span className="text-xs text-destructive">
                  {getApiErrorMessage(updateConfig.error ?? deleteConfig.error)}
                </span>
              )}
            </div>
          </form>
        )}
      </AppPageContent>
    </AppPage>
  );
}
