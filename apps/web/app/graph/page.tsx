"use client";

import React, { useState } from "react";
import {
  Share2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Layers,
  Brain,
  ArrowRight,
  BookOpen,
  Search,
  ChevronRight,
} from "lucide-react";
import { useGraph, useNeighborhood } from "@/features/graph/hooks";
import { GraphSkeleton } from "@/components/skeletons";
import { ApiError as ApiErrorUI } from "@/components/api-error";
import Link from "next/link";
import type { GraphNode } from "@/types/api";

export default function GraphPage(): React.JSX.Element {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [viewMode, setViewMode] = useState<"full" | "neighborhood">("full");

  const { data, isLoading, error, refetch } = useGraph();
  const { data: neighborhoodData } = useNeighborhood(
    selectedNode?.id ?? null,
    1,
  );

  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];
  const neighborhood = neighborhoodData?.nodes ?? [];

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setViewMode("neighborhood");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in duration-700">
      <header className="flex items-center justify-between border-b border-gray-800 pb-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-400" />
            Knowledge Graph
          </h1>
          <p className="text-gray-400">
            Discover connections between concepts in your second brain.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewMode("full");
              setSelectedNode(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "full" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}
            type="button"
          >
            Full Map
          </button>
          <button
            onClick={() => void refetch()}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            title="Refresh Graph"
            type="button"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Main Graph Area */}
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl relative overflow-hidden group">
          {isLoading ? (
            <GraphSkeleton />
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <ApiErrorUI error={error} onRetry={() => void refetch()} />
            </div>
          ) : nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center space-y-4 opacity-40">
                <Brain className="w-16 h-16 text-gray-700 mx-auto" />
                <p className="text-gray-500 max-w-xs">
                  Knowledge graph is currently empty. Ingest more documents to
                  build connections.
                </p>
              </div>
            </div>
          ) : (
            <>
              <svg
                className="w-full h-full cursor-grab active:cursor-grabbing"
                viewBox="0 0 1000 800"
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="15"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
                  </marker>
                </defs>

                {/* Lines */}
                {edges.map((edge, i) => {
                  const fromNode = nodes.find((n) => n.id === edge.fromId);
                  const toNode = nodes.find((n) => n.id === edge.toId);
                  if (!fromNode || !toNode) return null;

                  const fromIdx = nodes.indexOf(fromNode);
                  const toIdx = nodes.indexOf(toNode);
                  const x1 =
                    500 +
                    400 * Math.cos((2 * Math.PI * fromIdx) / nodes.length);
                  const y1 =
                    400 +
                    300 * Math.sin((2 * Math.PI * fromIdx) / nodes.length);
                  const x2 =
                    500 + 400 * Math.cos((2 * Math.PI * toIdx) / nodes.length);
                  const y2 =
                    400 + 300 * Math.sin((2 * Math.PI * toIdx) / nodes.length);

                  return (
                    <line
                      key={`${i}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#1e293b"
                      strokeWidth="1"
                      markerEnd="url(#arrowhead)"
                      className="transition-all duration-700"
                    />
                  );
                })}

                {/* Nodes */}
                {nodes.map((node, i) => {
                  const x =
                    500 + 400 * Math.cos((2 * Math.PI * i) / nodes.length);
                  const y =
                    400 + 300 * Math.sin((2 * Math.PI * i) / nodes.length);
                  const isActive = selectedNode?.id === node.id;
                  const size = 10 + Math.min(node.chunkCount * 2, 30);

                  return (
                    <g
                      key={node.id}
                      onClick={() => handleNodeClick(node)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={size}
                        fill={isActive ? "#4f46e5" : "#1e1b4b"}
                        stroke={isActive ? "#818cf8" : "#312e81"}
                        strokeWidth="2"
                        className="transition-all duration-300 hover:fill-blue-600 shadow-xl"
                      />
                      <text
                        x={x}
                        y={y + size + 15}
                        textAnchor="middle"
                        className={`text-[10px] font-bold select-none transition-colors ${isActive ? "fill-white" : "fill-gray-500"}`}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute top-4 left-4 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-gray-800 text-[10px] text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Concept Presence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-700" />
                  <span>Relationship Link</span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  className="p-2 bg-gray-950 border border-gray-800 rounded-lg hover:bg-gray-800 transition-all text-gray-400"
                  title="Zoom In"
                  type="button"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  className="p-2 bg-gray-950 border border-gray-800 rounded-lg hover:bg-gray-800 transition-all text-gray-400"
                  title="Zoom Out"
                  type="button"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar: Details / Neighborhood */}
        <aside className="w-96 flex flex-col gap-6">
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 overflow-y-auto custom-scrollbar">
            {selectedNode ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {selectedNode.label}
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    <Layers className="w-3.5 h-3.5" />
                    {selectedNode.chunkCount} Associated Chunks
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5" />
                    Related Concepts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {neighborhood
                      .filter((n) => n.id !== selectedNode.id)
                      .map((node) => (
                        <button
                          key={node.id}
                          onClick={() => handleNodeClick(node)}
                          className="px-3 py-1.5 bg-gray-850 hover:bg-gray-800 border border-indigo-900/30 text-indigo-300 rounded-lg text-xs transition-all flex items-center gap-2"
                          type="button"
                        >
                          {node.label}
                          <ArrowRight className="w-3 h-3 opacity-50" />
                        </button>
                      ))}
                    {neighborhood.length <= 1 && (
                      <p className="text-xs text-gray-600 italic">
                        No immediate connections found within the graph building
                        radius.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-850">
                  <button
                    className="w-full py-3 bg-gray-850 hover:bg-gray-800 border border-gray-800 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 group"
                    type="button"
                  >
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    Browse Chunks
                    <ChevronRight className="w-4 h-4 text-gray-600 transition-transform group-hover:translate-x-1" />
                  </button>
                  <Link
                    href="/search"
                    className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/30 rounded-xl text-sm font-bold text-indigo-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Ask about {selectedNode.label}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="p-4 bg-gray-850 rounded-full">
                  <Share2 className="w-8 h-8 text-gray-700" />
                </div>
                <p className="text-sm text-gray-500 max-w-[200px]">
                  Select a concept node on the map to explore its connections
                  and details.
                </p>
              </div>
            )}
          </div>

          <div className="p-6 bg-indigo-900/10 border border-indigo-900/30 rounded-2xl">
            <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2 uppercase tracking-widest text-[10px]">
              Graph Status
            </h4>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-gray-400">Total Nodes</span>
              <span className="text-white font-mono">{nodes.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-gray-400">Total Edges</span>
              <span className="text-white font-mono">{edges.length}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
