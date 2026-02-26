"use client"

import React, { useCallback, useRef, useState } from "react"
import {
  addEdge,
  Background,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { GraphContextMenu } from "@/components/landing/graph/context-menu"
import { initialEdges, initialNodes } from "@/components/landing/graph/initial-elements"

type MenuState = {
  id: string
  top?: number
  left?: number
  right?: number
  bottom?: number
}

type NodeData = {
  label: string
}

export function KnowledgeGraphFlow() {
  const [nodes, , onNodesChange] = useNodesState<Node<NodeData>>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const paneRef = useRef<HTMLDivElement | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((current) => addEdge(params, current)),
    [setEdges]
  )

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node<NodeData>) => {
      event.preventDefault()
      const pane = paneRef.current?.getBoundingClientRect()
      if (!pane) {
        return
      }

      setMenu({
        id: node.id,
        top: event.clientY < pane.height - 200 ? event.clientY : undefined,
        left: event.clientX < pane.width - 240 ? event.clientX : undefined,
        right: event.clientX >= pane.width - 240 ? pane.width - event.clientX : undefined,
        bottom: event.clientY >= pane.height - 200 ? pane.height - event.clientY : undefined,
      })
    },
    []
  )

  const onPaneClick = useCallback(() => setMenu(null), [])

  return (
    <div ref={paneRef} className="h-90 w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        fitView
      >
        <Background gap={24} />
      </ReactFlow>
      {menu && <GraphContextMenu {...menu} onClose={onPaneClick} />}
    </div>
  )
}
