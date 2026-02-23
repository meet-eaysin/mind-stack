import { describe, it, expect } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { render } from "@/test/test-utils";
import { server } from "@/test/msw/server";
import { CollectionList } from "../components/collection-list";

describe("Collections Behavior", () => {
  it(
    "renders collection list and supports create with refetch",
    async () => {
    let listCalls = 0;
    const collections = [
      {
        id: "col-1",
        name: "Systems Basics",
        description: "Foundational systems documents",
        itemCount: 1,
        progress: 40,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ];

    server.use(
      http.get("*/collections", () => {
        listCalls += 1;
        return HttpResponse.json(collections);
      }),
      http.post("*/collections", async ({ request }) => {
        const body = (await request.json()) as {
          name?: string;
          description?: string;
          goal?: string;
        };
        collections.push({
          id: "col-2",
          name: body.name ?? "New Collection",
          description: body.description ?? "",
          itemCount: 0,
          progress: 0,
          createdAt: "2026-01-03T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
        });
        return HttpResponse.json({
          id: "col-2",
          name: body.name ?? "New Collection",
          description: body.description ?? null,
          goal: body.goal ?? null,
          items: [],
          createdAt: "2026-01-03T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
        });
      }),
    );

    render(<CollectionList onSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Systems Basics")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /new collection/i }));
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Fresh Collection" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^create collection$/i }));

    await waitFor(() => {
      expect(screen.getByText("Fresh Collection")).toBeInTheDocument();
    });

    expect(listCalls).toBeGreaterThan(1);
    },
    15000,
  );

  it("renders loading and empty states", async () => {
    server.use(
      http.get("*/collections", async () => {
        await delay(120);
        return HttpResponse.json([]);
      }),
    );

    render(<CollectionList onSelect={() => {}} />);
    expect(screen.queryByText("No collections found matching your search.")).toBeNull();

    await waitFor(() => {
      expect(
        screen.getByText("No collections found matching your search."),
      ).toBeInTheDocument();
    });
  });

  it("shows backend and network errors", async () => {
    server.use(
      http.get("*/collections", () =>
        HttpResponse.json({ message: "Invalid collection filter" }, { status: 400 }),
      ),
    );
    render(<CollectionList onSelect={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Invalid collection filter")).toBeInTheDocument();
    });

    server.use(
      http.get("*/collections", () => HttpResponse.error()),
    );
    render(<CollectionList onSelect={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });
});
