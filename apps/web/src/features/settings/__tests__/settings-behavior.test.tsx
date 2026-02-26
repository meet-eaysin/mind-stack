import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { render } from "@/test/test-utils";
import { server } from "@/test/msw/server";
import SettingsPage from "@/app/(app)/app/settings/page";
import { z } from "zod";

const configSchema = z.object({
  embeddingProvider: z.string(),
  embeddingModel: z.string(),
  generationProvider: z.string(),
  generationModel: z.string(),
});

describe("Settings Behavior", () => {
  it("renders config and updates it", async () => {
    let getCalls = 0;
    server.use(
      http.get("*/settings/llm", () => {
        getCalls += 1;
        return HttpResponse.json({
          userId: "default",
          embeddingProvider: "OLLAMA",
          embeddingModel: getCalls === 1 ? "nomic-embed-text" : "bge-small",
          generationProvider: "OLLAMA",
          generationModel: "llama3",
        });
      }),
      http.put("*/settings/llm", async ({ request }) => {
        const body = configSchema.parse(await request.json());
        return HttpResponse.json({ userId: "default", ...body });
      }),
      http.get("*/admin/health/embedding-model", () =>
        HttpResponse.json({
          provider: "OLLAMA",
          model: "nomic-embed-text",
          baseUrl: "http://localhost:11434",
          available: true,
        }),
      ),
    );

    render(<SettingsPage />);

    const embeddingInput = await screen.findByLabelText("Embedding model");
    expect(embeddingInput).toHaveValue("nomic-embed-text");

    await userEvent.clear(embeddingInput);
    await userEvent.type(embeddingInput, "bge-small");
    await userEvent.click(
      screen.getByRole("button", { name: /save configuration/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Configuration updated")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("bge-small")).toBeInTheDocument();
    });
  });

  it("shows loading state", async () => {
    server.use(
      http.get("*/settings/llm", async () => {
        await delay(200);
        return HttpResponse.json({
          userId: "default",
          embeddingProvider: "OLLAMA",
          embeddingModel: "nomic-embed-text",
          generationProvider: "OLLAMA",
          generationModel: "llama3",
        });
      }),
    );

    render(<SettingsPage />);
    expect(screen.getByTestId("settings-loading")).toBeInTheDocument();
  });

  it("shows backend validation error", async () => {
    server.use(
      http.put("*/settings/llm", () =>
        HttpResponse.json(
          { message: "Embedding model not available" },
          { status: 400 },
        ),
      ),
    );

    render(<SettingsPage />);

    const embeddingInput = await screen.findByLabelText("Embedding model");
    await userEvent.clear(embeddingInput);
    await userEvent.type(embeddingInput, "missing-model");
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
    server.use(http.get("*/settings/llm", () => HttpResponse.error()));
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("settings-error")).toBeInTheDocument();
    });
  });

  it("refetches after mutation and handles stale cache", async () => {
    let embeddingModel = "nomic-embed-text";

    server.use(
      http.get("*/settings/llm", () =>
        HttpResponse.json({
          userId: "default",
          embeddingProvider: "OLLAMA",
          embeddingModel,
          generationProvider: "OLLAMA",
          generationModel: "llama3",
        }),
      ),
      http.put("*/settings/llm", async ({ request }) => {
        const body = configSchema.parse(await request.json());
        embeddingModel = body.embeddingModel;
        return HttpResponse.json({ userId: "default", ...body });
      }),
    );

    render(<SettingsPage />);

    const embeddingInput = await screen.findByLabelText("Embedding model");
    expect(embeddingInput).toHaveValue("nomic-embed-text");

    await userEvent.clear(embeddingInput);
    await userEvent.type(embeddingInput, "text-embedding-3");
    await userEvent.click(
      screen.getByRole("button", { name: /save configuration/i }),
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("text-embedding-3")).toBeInTheDocument();
    });
  });
});
