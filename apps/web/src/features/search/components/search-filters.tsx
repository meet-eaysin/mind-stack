"use client";

import React from "react";
import { Tag, Clock } from "lucide-react";

type SearchFiltersProps = {
  showFilters: boolean;
  allTags: string[];
  selectedTags: string[];
  fromDate: string;
  toDate: string;
  onToggleTag: (tag: string) => void;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
};

export function SearchFilters({
  showFilters,
  allTags,
  selectedTags,
  fromDate,
  toDate,
  onToggleTag,
  onFromDateChange,
  onToDateChange,
}: SearchFiltersProps): React.JSX.Element | null {
  if (!showFilters) return null;

  return (
    <div className="w-full max-w-4xl p-6 bg-gray-900 border border-gray-800 rounded-2xl animate-in fade-in zoom-in duration-300 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
          <Tag className="w-3 px-0 h-3" />
          Filter by Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {allTags.length === 0 ? (
            <p className="text-xs text-gray-600">No tags found yet.</p>
          ) : (
            allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-750"
                }`}
              >
                {tag}
              </button>
            ))
          )}
        </div>
      </div>
      <div className="space-y-4">
        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Time Range
        </label>
        <div className="flex items-center gap-2 text-white">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="bg-gray-850 border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 flex-1"
          />
          <span className="text-gray-600">—</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="bg-gray-850 border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 flex-1"
          />
        </div>
      </div>
    </div>
  );
}
