"use client";

import React, { memo } from "react";
import {
  Background,
  BackgroundVariant,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  initialEdges,
  initialNodes,
} from "@/components/landing/graph/initial-elements";
import type { GraphNodeData } from "@/components/landing/graph/types";
import { cn } from "@/lib/utils";

const hiddenHandleStyle = {
  opacity: 0,
  pointerEvents: "none" as const,
  width: 8,
  height: 8,
  borderWidth: 0,
  background: "transparent",
};

function GraphNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const isRoot = data.kind === "root";

  return (
    <div
      className={cn(
        "relative rounded-xl border px-3 py-2 text-xs font-medium tracking-tight text-foreground shadow-sm transition-all",
        isRoot &&
          "rounded-full border-primary/45 bg-primary/10 px-4 py-2.5 text-sm font-semibold",
        !isRoot && "border-border/80 bg-card/90",
      )}
    >
      {data.label}
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        style={hiddenHandleStyle}
      />
      <Handle
        id="left-source"
        type="source"
        position={Position.Left}
        style={hiddenHandleStyle}
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        style={hiddenHandleStyle}
      />
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        style={hiddenHandleStyle}
      />
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        style={hiddenHandleStyle}
      />
      <Handle
        id="top-source"
        type="source"
        position={Position.Top}
        style={hiddenHandleStyle}
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        style={hiddenHandleStyle}
      />
      <Handle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
        style={hiddenHandleStyle}
      />
    </div>
  );
}

const MemoGraphNode = memo(GraphNode);

const nodeTypes = {
  graphNode: MemoGraphNode,
};

export function KnowledgeGraphFlow() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="knowledge-graph-flow h-85 w-full [&_.react-flow__attribution]:hidden md:h-95">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        panOnScroll={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="hsl(var(--muted-foreground) / 0.28)"
        />
      </ReactFlow>
    </div>
  );
}
