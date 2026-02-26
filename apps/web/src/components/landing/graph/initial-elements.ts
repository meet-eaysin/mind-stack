import { MarkerType, type Edge, type Node } from "@xyflow/react"
import type { GraphNodeData } from "@/components/landing/graph/types"

const EDGE_COLOR = "rgba(226, 232, 240, 0.68)"

function createEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: "smoothstep",
    style: { stroke: EDGE_COLOR, strokeWidth: 1.7 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: EDGE_COLOR,
    },
  }
}

export const initialNodes: Node<GraphNodeData>[] = [
  {
    id: "brain",
    type: "graphNode",
    position: { x: 520, y: 210 },
    data: { label: "Your Brain", kind: "root" },
  },
  {
    id: "doc-capture",
    type: "graphNode",
    position: { x: 70, y: 84 },
    data: { label: "Capture Inbox", kind: "document" },
  },
  {
    id: "doc-api",
    type: "graphNode",
    position: { x: 300, y: 84 },
    data: { label: "API Design RFC", kind: "document" },
  },
  {
    id: "doc-status",
    type: "graphNode",
    position: { x: 70, y: 324 },
    data: { label: "Status Workflow", kind: "document" },
  },
  {
    id: "doc-vector",
    type: "graphNode",
    position: { x: 300, y: 324 },
    data: { label: "Vector Search Notes", kind: "document" },
  },
  {
    id: "doc-llm",
    type: "graphNode",
    position: { x: 520, y: 30 },
    data: { label: "LLM Prompt Playbook", kind: "document" },
  },
  {
    id: "doc-source",
    type: "graphNode",
    position: { x: 740, y: 84 },
    data: { label: "Source Citation Rules", kind: "document" },
  },
  {
    id: "doc-react",
    type: "graphNode",
    position: { x: 980, y: 84 },
    data: { label: "React Performance", kind: "document" },
  },
  {
    id: "doc-folder",
    type: "graphNode",
    position: { x: 740, y: 324 },
    data: { label: "Folder Course Map", kind: "document" },
  },
  {
    id: "doc-typescript",
    type: "graphNode",
    position: { x: 980, y: 324 },
    data: { label: "TypeScript Patterns", kind: "document" },
  },
]

export const initialEdges: Edge[] = [
  createEdge("e-capture-api", "doc-capture", "doc-api", "right-source", "left-target"),
  createEdge("e-status-vector", "doc-status", "doc-vector", "right-source", "left-target"),
  createEdge("e-source-react", "doc-source", "doc-react", "right-source", "left-target"),
  createEdge("e-folder-typescript", "doc-folder", "doc-typescript", "right-source", "left-target"),
  createEdge("e-api-brain", "doc-api", "brain", "right-source", "left-target"),
  createEdge("e-vector-brain", "doc-vector", "brain", "right-source", "left-target"),
  createEdge("e-source-brain", "doc-source", "brain", "left-source", "right-target"),
  createEdge("e-folder-brain", "doc-folder", "brain", "left-source", "right-target"),
  createEdge("e-llm-brain", "doc-llm", "brain", "bottom-source", "top-target"),
  createEdge("e-react-brain", "doc-react", "brain", "left-source", "right-target"),
  createEdge("e-typescript-brain", "doc-typescript", "brain", "left-source", "right-target"),
]
