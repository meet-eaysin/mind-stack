import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { render } from "@/test/test-utils";
import { server } from "@/test/msw/server";
import SettingsPage from "@/app/(app)/app/settings/page";
import { z } from "zod";
import { MODEL_PROVIDER } from "../../../../../../packages/shared-types/dist/enums";

const configSchema = z.object({
  provider: z.string(),
  model: z.string(),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  enabledCapabilities: z.array(z.string()),
});

describe("Settings Behavior", () => {
  it("renders config and updates it", async () => {
    let getCalls = 0;
    server.use(
      http.get("*/me/llm-config", () => {
        getCalls += 1;
        return HttpResponse.json({
          success: true,
          data: {
            userId: "default",
            provider: MODEL_PROVIDER.OLLAMA,
            model: getCalls === 1 ? "llama3" : "gpt-4o-mini",
            baseUrl: "http://localhost:11434",
            enabledCapabilities: ["CHAT", "EMBEDDING"],
            hasApiKey: false,
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }),
      http.put("*/me/llm-config", async ({ request }) => {
        const body = configSchema.parse(await request.json());
        return HttpResponse.json({
          success: true,
          data: {
            userId: "default",
            provider: body.provider,
            model: body.model,
            baseUrl: body.baseUrl ?? "http://localhost:11434",
            enabledCapabilities: body.enabledCapabilities,
            hasApiKey: Boolean(body.apiKey),
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }),
      http.get("*/admin/health/embedding-model", () =>
        HttpResponse.json({
          provider: MODEL_PROVIDER.OLLAMA,
          model: "llama3",
          baseUrl: "http://localhost:11434",
          available: true,
        }),
      ),
    );

    render(<SettingsPage />);

    const modelInput = await screen.findByLabelText("Model");
    expect(modelInput).toHaveValue("llama3");

    await userEvent.clear(modelInput);
    await userEvent.type(modelInput, "gpt-4o-mini");
    await userEvent.click(
      screen.getByRole("button", { name: /save configuration/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Configuration updated")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("gpt-4o-mini")).toBeInTheDocument();
    });
  });

  it("shows loading state", async () => {
    server.use(
      http.get("*/me/llm-config", async () => {
        await delay(200);
        return HttpResponse.json({
          success: true,
          data: {
            userId: "default",
            provider: MODEL_PROVIDER.OLLAMA,
            model: "llama3",
            baseUrl: "http://localhost:11434",
            enabledCapabilities: ["CHAT", "EMBEDDING"],
            hasApiKey: false,
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }),
    );

    render(<SettingsPage />);
    expect(screen.getByTestId("settings-loading")).toBeInTheDocument();
  });

  it("shows backend validation error", async () => {
    server.use(
      http.put("*/me/llm-config", () =>
        HttpResponse.json(
          { message: "Embedding model not available" },
          { status: 400 },
        ),
      ),
    );

    render(<SettingsPage />);

    const modelInput = await screen.findByLabelText("Model");
    await userEvent.clear(modelInput);
    await userEvent.type(modelInput, "missing-model");
    await userEvent.click(
      screen.getByRole("button", { name: /save configuration/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Embedding model not available"),
      ).toBeInTheDocument();
    });
  });

  it("shows network error", async () => {
    server.use(http.get("*/me/llm-config", () => HttpResponse.error()));
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("settings-error")).toBeInTheDocument();
    });
  });

  it("validates model field before submit", async () => {
    render(<SettingsPage />);

    const modelInput = await screen.findByLabelText("Model");
    await userEvent.clear(modelInput);
    await userEvent.click(
      screen.getByRole("button", { name: /save configuration/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Model is required")).toBeInTheDocument();
    });
  });

  it("refetches after mutation and handles stale cache", async () => {
    let model = "llama3";

    server.use(
      http.get("*/me/llm-config", () =>
        HttpResponse.json({
          success: true,
          data: {
            userId: "default",
            provider: MODEL_PROVIDER.OLLAMA,
            model,
            baseUrl: "http://localhost:11434",
            enabledCapabilities: ["CHAT", "EMBEDDING"],
            hasApiKey: false,
          },
          meta: { timestamp: new Date().toISOString() },
        }),
      ),
      http.put("*/me/llm-config", async ({ request }) => {
        const body = configSchema.parse(await request.json());
        model = body.model;
        return HttpResponse.json({
          success: true,
          data: {
            userId: "default",
            provider: body.provider,
            model: body.model,
            baseUrl: body.baseUrl ?? "http://localhost:11434",
            enabledCapabilities: body.enabledCapabilities,
            hasApiKey: false,
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }),
    );

    render(<SettingsPage />);

    const modelInput = await screen.findByLabelText("Model");
    expect(modelInput).toHaveValue("llama3");

    await userEvent.clear(modelInput);
    await userEvent.type(modelInput, "text-embedding-3-small");
    await userEvent.click(
      screen.getByRole("button", { name: /save configuration/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("text-embedding-3-small"),
      ).toBeInTheDocument();
    });
  });
});
