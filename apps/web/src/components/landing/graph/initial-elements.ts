import type { Edge, Node } from "@xyflow/react"

type NodeData = {
  label: string
}

const nodeBaseStyle = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--card)",
  color: "var(--card-foreground)",
  fontSize: 12,
  padding: 8,
}

export const initialNodes: Node<NodeData>[] = [
  {
    id: "brain",
    position: { x: 420, y: 190 },
    data: { label: "Your Brain" },
    style: {
      ...nodeBaseStyle,
      fontSize: 14,
      fontWeight: 600,
      borderRadius: 999,
      padding: "10px 16px",
    },
  },
  {
    id: "doc-api",
    position: { x: 120, y: 70 },
    data: { label: "API Design RFC" },
    style: nodeBaseStyle,
  },
  {
    id: "doc-react",
    position: { x: 640, y: 80 },
    data: { label: "React Performance" },
    style: nodeBaseStyle,
  },
  {
    id: "doc-vector",
    position: { x: 180, y: 300 },
    data: { label: "Vector Search Notes" },
    style: nodeBaseStyle,
  },
  {
    id: "doc-typescript",
    position: { x: 650, y: 315 },
    data: { label: "TypeScript Patterns" },
    style: nodeBaseStyle,
  },
]

export const initialEdges: Edge[] = [
  { id: "e-api-brain", source: "doc-api", target: "brain", animated: true },
  { id: "e-react-api", source: "doc-react", target: "doc-api" },
  { id: "e-api-typescript", source: "doc-api", target: "doc-typescript" },
  { id: "e-vector-brain", source: "doc-vector", target: "brain", animated: true },
  { id: "e-typescript-brain", source: "doc-typescript", target: "brain" },
]
