import { describe, it, expect } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/msw/server";
import { render } from "@/test/test-utils";
import CoursesPage from "@/app/courses/page";

describe("Courses Behavior", () => {
  it("renders course list and opens course detail", async () => {
    render(<CoursesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("courses-list")).toBeInTheDocument();
    });

    expect(screen.getByText("Systems Basics")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Systems Basics"));

    await waitFor(() => {
      expect(screen.getByTestId("course-detail")).toBeInTheDocument();
    });

    expect(screen.getByText("Syllabus")).toBeInTheDocument();
    expect(screen.getByText("Raft Overview")).toBeInTheDocument();
  });

  it("renders loading and empty states", async () => {
    server.use(
      http.get("*/collections", async () => {
        await delay(120);
        return HttpResponse.json([]);
      }),
    );

    render(<CoursesPage />);
    expect(screen.getByTestId("courses-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("courses-empty")).toBeInTheDocument();
    });
  });

  it("renders backend and network errors", async () => {
    server.use(
      http.get("*/collections", () =>
        HttpResponse.json(
          { message: "Invalid courses request" },
          { status: 400 },
        ),
      ),
    );
    render(<CoursesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("courses-error")).toBeInTheDocument();
    });
    expect(screen.getByText("Invalid courses request")).toBeInTheDocument();

    server.use(http.get("*/collections", () => HttpResponse.error()));
    render(<CoursesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("courses-error")).toBeInTheDocument();
    });
  });
});
