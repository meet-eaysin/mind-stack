"use client";

import { Download, FileText, LayoutTemplate, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExportMarkdown, useExportNotion } from "../hooks";

interface ExportActionsProps {
  chunkIds: string[];
}

export function ExportActions({ chunkIds }: ExportActionsProps) {
  const exportMarkdown = useExportMarkdown();
  const exportNotion = useExportNotion();

  const handleExportMarkdown = () => {
    if (chunkIds.length === 0) return;

    exportMarkdown.mutate(chunkIds, {
      onSuccess: (data) => {
        const blob = new Blob([data.markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
    });
  };

  const handleExportNotion = () => {
    if (chunkIds.length === 0) return;

    exportNotion.mutate(chunkIds, {
      onSuccess: (data) => {
        const blob = new Blob([JSON.stringify(data.payload, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `notion-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
    });
  };

  const isExporting = exportMarkdown.isPending || exportNotion.isPending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isExporting || chunkIds.length === 0}
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportMarkdown} disabled={isExporting}>
          <FileText className="mr-2 size-4" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportNotion} disabled={isExporting}>
          <LayoutTemplate className="mr-2 size-4" />
          Export to Notion (JSON)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
