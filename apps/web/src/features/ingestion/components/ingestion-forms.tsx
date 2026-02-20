"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Link as LinkIcon,
  FileText,
  Youtube,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import * as schemas from "../forms/schemas";
import {
  useIngestUrl,
  useIngestText,
  useIngestPdf,
  useIngestYoutube,
  useIngestionStatus,
} from "../hooks";
import { IngestionResponse } from "@/types/api";
import { z } from "zod";
import { ApiError } from "@/api/client";

type IngestionType = "URL" | "TEXT" | "PDF" | "YOUTUBE";

const STATUS_STEPS = [
  "INGESTED",
  "CHUNKING",
  "EMBEDDING",
  "GRAPH_BUILDING",
  "READY",
] as const;

export function IngestionForms(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<IngestionType>("URL");
  const [docId, setDocId] = useState<string | null>(null);
  const status = useIngestionStatus(docId);

  // Mutations
  const ingestUrl = useIngestUrl();
  const ingestText = useIngestText();
  const ingestPdf = useIngestPdf();
  const ingestYoutube = useIngestYoutube();

  const handleSuccess = (data: IngestionResponse) => {
    setDocId(data.documentId);
  };

  const getStepStatus = (step: string) => {
    if (status === "FAILED") return "failed";
    if (status === "READY") return "complete";

    const currentIndex = STATUS_STEPS.indexOf(
      status as (typeof STATUS_STEPS)[number],
    );
    const stepIndex = STATUS_STEPS.indexOf(
      step as (typeof STATUS_STEPS)[number],
    );

    if (currentIndex === -1) return "pending"; // Handles null status initially

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  const renderError = (error: ApiError) => {
    if (error.type === "validation") {
      return (
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Validation Error:</p>
          <ul className="list-disc pl-4">
            {error.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      );
    }
    return <p className="text-sm">{error.message}</p>;
  };

  // ── Forms ──

  const UrlForm = () => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<z.infer<typeof schemas.UrlFormSchema>>({
      resolver: zodResolver(schemas.UrlFormSchema),
      defaultValues: { url: "", title: "" },
    });

    return (
      <form
        onSubmit={handleSubmit((d) =>
          ingestUrl.mutateAsync(d).then(handleSuccess),
        )}
        className="space-y-6"
      >
        <div className="space-y-4 text-white">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium text-gray-300">
              Website URL
            </label>
            <input
              id="url"
              type="url"
              {...register("url")}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.url && (
              <p className="text-red-400 text-sm">{errors.url.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-sm font-medium text-gray-300"
            >
              Title (Optional)
            </label>
            <input
              id="title"
              type="text"
              {...register("title")}
              placeholder="e.g. My Research Document"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.title && (
              <p className="text-red-400 text-sm">{errors.title.message}</p>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={ingestUrl.isPending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {ingestUrl.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Start Ingestion"
          )}
        </button>
        {ingestUrl.error && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex gap-3 items-center text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {renderError(ingestUrl.error)}
          </div>
        )}
      </form>
    );
  };

  const TextForm = () => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<z.infer<typeof schemas.TextFormSchema>>({
      resolver: zodResolver(schemas.TextFormSchema),
      defaultValues: { title: "", content: "" },
    });

    return (
      <form
        onSubmit={handleSubmit((d) =>
          ingestText.mutateAsync(d).then(handleSuccess),
        )}
        className="space-y-6"
      >
        <div className="space-y-4 text-white">
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-sm font-medium text-gray-300"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              {...register("title")}
              placeholder="Document Title"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.title && (
              <p className="text-red-400 text-sm">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="content"
              className="text-sm font-medium text-gray-300"
            >
              Content
            </label>
            <textarea
              id="content"
              rows={8}
              {...register("content")}
              placeholder="Paste your text here..."
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
            {errors.content && (
              <p className="text-red-400 text-sm">{errors.content.message}</p>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={ingestText.isPending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {ingestText.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Start Ingestion"
          )}
        </button>
        {ingestText.error && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex gap-3 items-center text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {renderError(ingestText.error)}
          </div>
        )}
      </form>
    );
  };

  const PdfForm = () => {
    // We do not pass explicit generic here because z.custom<FileList> handling
    // might be slightly different in inference vs runtime, avoiding mismatch noise.
    // However, we strictly type the onSubmit data.
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<z.infer<typeof schemas.PdfFormSchema>>({
      resolver: zodResolver(schemas.PdfFormSchema),
      defaultValues: { title: "" },
    });

    const onSubmit = async (data: z.infer<typeof schemas.PdfFormSchema>) => {
      // safe access because schema validation ensures files are present
      const fileList = data.file as FileList;
      const file = fileList[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const fileBase64 = base64String.split(",")[1] ?? "";
        ingestPdf
          .mutateAsync({ title: data.title, fileBase64 })
          .then(handleSuccess);
      };
      reader.readAsDataURL(file);
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 text-white">
          <div className="space-y-2">
            <label htmlFor="pdf" className="text-sm font-medium text-gray-300">
              Upload PDF
            </label>
            <div className="relative group">
              <input
                id="pdf"
                type="file"
                accept=".pdf"
                {...register("file")}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              {errors.file && (
                <p className="text-red-400 text-sm">
                  {errors.file.message as string}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-sm font-medium text-gray-300"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              {...register("title")}
              placeholder="e.g. My Research Document"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.title && (
              <p className="text-red-400 text-sm">
                {errors.title.message as string}
              </p>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={ingestPdf.isPending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {ingestPdf.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Start Ingestion"
          )}
        </button>
        {ingestPdf.error && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex gap-3 items-center text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {renderError(ingestPdf.error)}
          </div>
        )}
      </form>
    );
  };

  const YoutubeForm = () => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<z.infer<typeof schemas.YoutubeFormSchema>>({
      resolver: zodResolver(schemas.YoutubeFormSchema),
      defaultValues: { url: "", title: "" },
    });

    return (
      <form
        onSubmit={handleSubmit((d) =>
          ingestYoutube.mutateAsync(d).then(handleSuccess),
        )}
        className="space-y-6"
      >
        <div className="space-y-4 text-white">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium text-gray-300">
              YouTube URL
            </label>
            <input
              id="url"
              type="url"
              {...register("url")}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.url && (
              <p className="text-red-400 text-sm">{errors.url.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-sm font-medium text-gray-300"
            >
              Title (Optional)
            </label>
            <input
              id="title"
              type="text"
              {...register("title")}
              placeholder="e.g. Video Transcript"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.title && (
              <p className="text-red-400 text-sm">{errors.title.message}</p>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={ingestYoutube.isPending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {ingestYoutube.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Start Ingestion"
          )}
        </button>
        {ingestYoutube.error && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex gap-3 items-center text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {renderError(ingestYoutube.error)}
          </div>
        )}
      </form>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl">
      <div className="flex gap-2 mb-8 p-1 bg-gray-850 rounded-lg border border-gray-800">
        {(["URL", "TEXT", "PDF", "YOUTUBE"] as IngestionType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setDocId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md transition-all font-medium ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
            type="button"
          >
            {tab === "URL" && <LinkIcon className="w-4 h-4" />}
            {tab === "TEXT" && <FileText className="w-4 h-4" />}
            {tab === "PDF" && <Upload className="w-4 h-4" />}
            {tab === "YOUTUBE" && <Youtube className="w-4 h-4" />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "URL" && <UrlForm />}
      {activeTab === "TEXT" && <TextForm />}
      {activeTab === "PDF" && <PdfForm />}
      {activeTab === "YOUTUBE" && <YoutubeForm />}

      {docId && (
        <div className="mt-8 border-t border-gray-850 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-gray-100 font-semibold">Processing Status</h4>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
              ID: {docId}
            </span>
          </div>

          <div className="space-y-8">
            {STATUS_STEPS.map((step, idx) => {
              const stepStatus = getStepStatus(step);
              return (
                <div key={step} className="relative flex items-center gap-4">
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-10 ${
                        stepStatus === "complete"
                          ? "bg-blue-600"
                          : "bg-gray-800"
                      }`}
                    />
                  )}

                  <div
                    className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      stepStatus === "complete"
                        ? "bg-blue-600 border-blue-600"
                        : stepStatus === "active"
                          ? "bg-gray-800 border-blue-500 animate-pulse text-blue-500"
                          : stepStatus === "failed"
                            ? "bg-red-900 border-red-600 text-red-500"
                            : "bg-gray-800 border-gray-700 text-gray-500"
                    }`}
                  >
                    {stepStatus === "complete" ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : stepStatus === "failed" ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium transition-colors ${
                        stepStatus === "pending"
                          ? "text-gray-500"
                          : "text-gray-100"
                      }`}
                    >
                      {step.replace("_", " ")}
                    </span>
                    {stepStatus === "active" && (
                      <span className="text-xs text-blue-400 animate-pulse">
                        Processing...
                      </span>
                    )}
                    {stepStatus === "failed" && (
                      <span className="text-xs text-red-400">Stage failed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {status === "READY" && (
            <div className="mt-8 p-4 bg-green-900/20 border border-green-900/50 rounded-lg flex items-center justify-center gap-3 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <p className="font-semibold">All done! Your document is ready.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
