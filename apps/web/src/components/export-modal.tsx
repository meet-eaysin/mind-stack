"use client";

import React, { useState } from "react";
import {
  X,
  FileDown,
  Clipboard,
  Check,
  Loader2,
  Share2,
  AlertCircle,
} from "lucide-react";
import { exportApi } from "@/features/export/api";
import { isApiError } from "@/api/client";
import type { ApiError } from "@/api/client";
import type { NotionBlock } from "@/types/api";

type ExportModalProps = {
  chunkIds: string[];
  isOpen: boolean;
  onClose: () => void;
};

export function ExportModal({
  chunkIds,
  isOpen,
  onClose,
}: ExportModalProps): React.JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [notionPayload, setNotionPayload] = useState<NotionBlock[] | null>(
    null,
  );
  const [format, setFormat] = useState<"markdown" | "notion">("markdown");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      if (format === "markdown") {
        const res = await exportApi.markdown(chunkIds);
        setMarkdown(res.markdown);
      } else {
        const res = await exportApi.notion(chunkIds);
        setNotionPayload(res.payload);
      }
    } catch (err) {
      if (isApiError(err)) {
        setError(err);
      } else {
        const fallback: ApiError = {
          type: "network",
          message: "Failed to export. Please try again.",
        };
        setError(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text =
      format === "markdown" ? markdown : JSON.stringify(notionPayload, null, 2);
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadFile = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exported-knowledge-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/20 rounded-lg">
              <FileDown className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Export Knowledge</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setFormat("markdown");
                setMarkdown(null);
              }}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 text-center ${
                format === "markdown"
                  ? "bg-blue-600/10 border-blue-600 text-white"
                  : "bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700"
              }`}
              type="button"
            >
              <FileDown
                className={`w-10 h-10 ${format === "markdown" ? "text-blue-400" : "text-gray-600"}`}
              />
              <div>
                <div className="font-bold">Markdown</div>
                <div className="text-xs opacity-60">
                  Complete document format
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setFormat("notion");
                setNotionPayload(null);
              }}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 text-center ${
                format === "notion"
                  ? "bg-blue-600/10 border-blue-600 text-white"
                  : "bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700"
              }`}
              type="button"
            >
              <Share2
                className={`w-10 h-10 ${format === "notion" ? "text-blue-400" : "text-gray-600"}`}
              />
              <div>
                <div className="font-bold">Notion (JSON)</div>
                <div className="text-xs opacity-60">Ready for Notion API</div>
              </div>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 font-medium">
                Selected Chunks:{" "}
                <span className="text-white font-mono">{chunkIds.length}</span>
              </span>
              {!markdown && !notionPayload && !loading && (
                <button
                  onClick={handleExport}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
                  type="button"
                >
                  Generate Export
                </button>
              )}
            </div>

            {loading && (
              <div className="h-64 bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-gray-500 text-sm animate-pulse">
                  Compiling your knowledge...
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl flex gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error.type === "validation"
                  ? error.issues.join(", ")
                  : error.message}
              </div>
            )}

            {(markdown || notionPayload) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative group">
                  <pre className="h-64 bg-gray-900 border border-gray-800 rounded-xl p-4 text-[11px] text-gray-400 overflow-y-auto font-mono custom-scrollbar">
                    {format === "markdown"
                      ? markdown
                      : JSON.stringify(notionPayload, null, 2)}
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute top-4 right-4 p-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-all shadow-xl"
                    title="Copy to clipboard"
                    type="button"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clipboard className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleCopy}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    type="button"
                  >
                    <Clipboard className="w-4 h-4" />
                    {copied ? "Copied!" : "Copy to Clipboard"}
                  </button>
                  {format === "markdown" && (
                    <button
                      onClick={downloadFile}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      type="button"
                    >
                      <FileDown className="w-4 h-4" />
                      Download .md
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
