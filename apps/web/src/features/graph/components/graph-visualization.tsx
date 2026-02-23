"use client";

import { useState, useRef, useEffect } from "react";
import { Network, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { GraphNode, GraphEdge } from "../types";
import { Button } from "@/components/ui/button";
import { RELATION_TYPE } from "@repo/shared-types";

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 500;

export function GraphVisualization({
  nodes,
  edges,
  onNodeSelectAction,
  selectedNodeId,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeSelectAction: (id: string | null) => void;
  selectedNodeId: string | null;
}) {
  const [nodePositions, setNodePositions] = useState<
    Array<GraphNode & { x: number; y: number; vx: number; vy: number }>
  >(() => {
    return nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / (nodes.length || 1);
      const radius = 150;
      return {
        ...node,
        x:
          DEFAULT_WIDTH / 2 +
          radius * Math.cos(angle) +
          (Math.random() - 0.5) * 50,
        y:
          DEFAULT_HEIGHT / 2 +
          radius * Math.sin(angle) +
          (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
      };
    });
  });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const requestRef = useRef<number>(null);

  const width = DEFAULT_WIDTH;
  const height = DEFAULT_HEIGHT;

  // Sync node positions when nodes prop changes (Render-phase update)
  const [prevNodes, setPrevNodes] = useState(nodes);
  if (nodes !== prevNodes) {
    setPrevNodes(nodes);
    setNodePositions((current) => {
      return nodes.map((node, i) => {
        const existing = current.find((c) => c.id === node.id);
        if (existing) return { ...existing, ...node };

        const angle = (2 * Math.PI * i) / (nodes.length || 1);
        const radius = Math.min(width, height) * 0.25;
        return {
          ...node,
          x: width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
          y: height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
          vx: 0,
          vy: 0,
        };
      });
    });
  }

  // Force-directed simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const animate = () => {
      setNodePositions((currentPositions) => {
        if (currentPositions.length === 0) return currentPositions;

        const nextPositions = currentPositions.map((n) => ({ ...n }));
        const repulsionK = 2000;
        const attractionK = 0.05;
        const centerK = 0.01;
        const friction = 0.9;

        // 1. Repulsion between all nodes
        for (let i = 0; i < nextPositions.length; i++) {
          for (let j = i + 1; j < nextPositions.length; j++) {
            const nodeA = nextPositions[i]!;
            const nodeB = nextPositions[j]!;
            const dx = nodeA.x - nodeB.x;
            const dy = nodeA.y - nodeB.y;
            const distanceSq = dx * dx + dy * dy + 0.1;
            const force = repulsionK / distanceSq;
            const fx = (dx / Math.sqrt(distanceSq)) * force;
            const fy = (dy / Math.sqrt(distanceSq)) * force;

            nodeA.vx += fx;
            nodeA.vy += fy;
            nodeB.vx -= fx;
            nodeB.vy -= fy;
          }
        }

        // 2. Attraction between linked nodes
        edges.forEach((edge) => {
          const source = nextPositions.find((n) => n.id === edge.fromId);
          const target = nextPositions.find((n) => n.id === edge.toId);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const force = (distance - 100) * attractionK;
            const fx = (dx / (distance || 1)) * force;
            const fy = (dy / (distance || 1)) * force;

            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        });

        // 3. Center force & Update positions
        nextPositions.forEach((node) => {
          node.vx += (width / 2 - node.x) * centerK;
          node.vy += (height / 2 - node.y) * centerK;
          node.vx *= friction;
          node.vy *= friction;
          node.x += node.vx;
          node.y += node.vy;
        });

        return nextPositions;
      });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [nodes.length, edges, width, height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const delta = -e.deltaY;
    const newScale = Math.min(
      Math.max(0.1, transform.scale + delta * zoomSpeed),
      5,
    );

    setTransform((prev) => ({
      ...prev,
      scale: newScale,
    }));
  };

  // const resetTransform = () => {
  //   setTransform({ x: 0, y: 0, scale: 1 });
  // };

  const zoomToFit = () => {
    if (nodePositions.length === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    nodePositions.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x);
      maxY = Math.max(maxY, n.y);
    });

    const graphWidth = maxX - minX + 100;
    const graphHeight = maxY - minY + 100;
    const padding = 40;

    const scaleX = (width - padding * 2) / graphWidth;
    const scaleY = (height - padding * 2) / graphHeight;
    const newScale = Math.min(Math.max(0.2, Math.min(scaleX, scaleY)), 2);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setTransform({
      x: width / 2 - centerX * newScale,
      y: height / 2 - centerY * newScale,
      scale: newScale,
    });
  };

  if (nodes.length === 0) {
    return (
      <div
        className="flex h-96 items-center justify-center rounded-lg border bg-card/50 backdrop-blur-sm shadow-inner"
        data-testid="graph-empty"
      >
        <div className="text-center">
          <Network className="mx-auto mb-2 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Knowledge graph is empty. Ingest more documents to build
            connections.
          </p>
        </div>
      </div>
    );
  }

  const nodeMap = new Map(nodePositions.map((n) => [n.id, n]));

  return (
    <div className="relative group">
      <div
        className="overflow-hidden rounded-lg border bg-card/50 backdrop-blur-sm shadow-inner cursor-grab active:cursor-grabbing"
        data-testid="graph-visualization"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full transition-colors duration-300"
          style={{ minHeight: 400, border: "none" }}
        >
          <defs>
            <radialGradient
              id="nodeGradient"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
              <stop
                offset="100%"
                stopColor="var(--primary)"
                stopOpacity="0.8"
              />
            </radialGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
              <feOffset dx="1" dy="1" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g
            transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
          >
            {/* Edges */}
            {edges.map((edge, i) => {
              const from = nodeMap.get(edge.fromId);
              const to = nodeMap.get(edge.toId);
              if (!from || !to) return null;
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className="stroke-muted-foreground/30 transition-all duration-300"
                  strokeWidth={1.5}
                  strokeDasharray={
                    edge.relationType === RELATION_TYPE.SIMILAR_TO
                      ? "4 2"
                      : "none"
                  }
                />
              );
            })}

            {/* Nodes */}
            {nodePositions.map((node) => {
              const radius = Math.max(
                10,
                Math.min(24, 10 + node.chunkCount * 2),
              );
              const isSelected = node.id === selectedNodeId;

              return (
                <g
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeSelectAction(isSelected ? null : node.id);
                  }}
                  className="cursor-pointer group/node"
                  data-testid={`graph-node-${node.id}`}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    className={`
                      transition-all duration-300
                      ${
                        isSelected
                          ? "fill-primary stroke-primary-foreground stroke-2"
                          : "fill-secondary hover:fill-accent stroke-muted-foreground/50 hover:stroke-primary"
                      }
                    `}
                    filter="url(#shadow)"
                  />
                  <text
                    x={node.x}
                    y={node.y + radius + 15}
                    textAnchor="middle"
                    className={`
                      text-[12px] font-medium pointer-events-none transition-all duration-300
                      ${isSelected ? "fill-primary font-bold scale-110" : "fill-muted-foreground"}
                    `}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 p-2 bg-background/80 backdrop-blur-md rounded-lg border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() =>
              setTransform((t) => ({ ...t, scale: t.scale * 1.2 }))
            }
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() =>
              setTransform((t) => ({ ...t, scale: t.scale / 1.2 }))
            }
          >
            <ZoomOut className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={zoomToFit}
            title="Zoom to Fit"
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
