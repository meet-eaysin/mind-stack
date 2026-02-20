"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import React from "react";

import type { ApiError } from "@/api/client";

type LegacyError = {
  message: string;
  category?:
    | "network"
    | "validation"
    | "backend"
    | "processing-not-ready"
    | string;
};

type ApiErrorProps = {
  error: ApiError | LegacyError;
  onRetry: () => void;
};

export function ApiError({ error, onRetry }: ApiErrorProps): React.JSX.Element {
  const isStrictError = (e: unknown): e is ApiError =>
    typeof e === "object" && e !== null && "type" in e;

  const getIcon = () => {
    if (isStrictError(error)) {
      switch (error.type) {
        case "network":
          return <AlertCircle className="w-6 h-6 text-orange-500" />;
        case "validation":
          return <AlertCircle className="w-6 h-6 text-red-500" />;
        default:
          return <AlertCircle className="w-6 h-6 text-red-600" />;
      }
    }
    // Legacy mapping
    switch (error.category) {
      case "network":
        return <AlertCircle className="w-6 h-6 text-orange-500" />;
      case "validation":
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case "processing-not-ready":
        return <AlertCircle className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-red-600" />;
    }
  };

  const getTitle = () => {
    if (isStrictError(error)) {
      switch (error.type) {
        case "network":
          return "Network Error";
        case "validation":
          return "Validation Error";
        case "backend":
          return "Back-end Error";
        default:
          return "Error";
      }
    }
    // Legacy mapping
    switch (error.category) {
      case "network":
        return "Network Error";
      case "validation":
        return "Validation Error";
      case "processing-not-ready":
        return "Not Ready";
      default:
        return "Back-end Error";
    }
  };

  const getMessage = () => {
    if (isStrictError(error) && error.type === "validation") {
      return error.issues.join(", ");
    }
    return error.message;
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-900 border-gray-700 flex flex-col gap-4 items-center justify-center text-center animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-center gap-2">
        {getIcon()}
        <h3 className="text-lg font-semibold text-white">{getTitle()}</h3>
      </div>
      <p className="text-gray-400 text-sm">{getMessage()}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Retry failed request"
        type="button"
      >
        <RefreshCcw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
}
