import { useMutation } from "@tanstack/react-query";
import { exportApi } from "../api";
import type { ExportMarkdownResponse, ExportNotionResponse } from "../types";
import type { ApiError } from "@/lib/api-client";

export function useExportMarkdown() {
  return useMutation<ExportMarkdownResponse, ApiError, string[]>({
    mutationFn: exportApi.markdown,
  });
}

export function useExportNotion() {
  return useMutation<ExportNotionResponse, ApiError, string[]>({
    mutationFn: exportApi.notion,
  });
}
