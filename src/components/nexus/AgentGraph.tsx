import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Briefcase,
  BookOpen,
  CalendarCheck,
  Check,
  Database,
  GraduationCap,
  Network,
  User,
  X,
} from "lucide-react";
import type { AgentLog } from "@/lib/nexus";

type NodeState = "idle" | "active" | "done" | "error";

const NODE_DEFS: {
  id: string;
  label: string;
  icon: typeof User;
  hue: string;
  position: { x: number; y: number };
}[] = [
  { id: "user", label: "You", icon: User, hue: "var(--agent-user)", position: { x: 0, y: 150 } },
  {
    id: "orchestrator",
    label: "Orchestrator",
    icon: Network,
    hue: "var(--agent-orchestrator)",
    position: { x: 180, y: 150 },
  },
  {
    id: "academic",
    label: "Academic",
    icon: GraduationCap,
    hue: "var(--agent-academic)",
    position: { x: 385, y: 10 },
  },
  {
    id: "placement",
    label: "Placement",
    icon: Briefcase,
    hue: "var(--agent-placement)",
    position: { x: 385, y: 103 },
  },
  {
    id: "knowledge",
    label: "Knowledge",
    icon: BookOpen,
    hue: "var(--agent-knowledge)",
    position: { x: 385, y: 196 },
  },
  {
    id: "communication",
    label: "Comms",
    icon: CalendarCheck,
    hue: "var(--agent-communication)",
    position: { x: 385, y: 289 },
  },
  {
    id: "tools",
    label: "Campus DB",
    icon: Database,
    hue: "var(--agent-tools)",
    position: { x: 580, y: 150 },
  },
];

const BASE_EDGES: [string, string][] = [
  ["user", "orchestrator"],
  ["orchestrator", "academic"],
  ["orchestrator", "placement"],
  ["orchestrator", "knowledge"],
  ["orchestrator", "communication"],
  ["academic", "tools"],
  ["placement", "tools"],
  ["knowledge", "tools"],
  ["communication", "tools"],
];

type AgentNodeData = {
  label: string;
  icon: typeof User;
  hue: string;
  state: NodeState;
};

function AgentNode({ data }: NodeProps) {
  const d = data as unknown as AgentNodeData;
  const Icon = d.icon;
  const state = d.state;
  const isIdle = state === "idle";
  return (
    <div
      className={`flex w-[132px] items-center gap-2 rounded-xl border px-3 py-2 transition-all duration-300 ${
        state === "active" ? "node-active scale-[1.04]" : ""
      }`}
      style={{
        // @ts-expect-error custom property
        "--node-hue": d.hue,
        background: isIdle
          ? "var(--surface-2)"
          : `color-mix(in oklab, ${d.hue} 14%, var(--surface-2))`,
        borderColor: isIdle ? "var(--border)" : `color-mix(in oklab, ${d.hue} 60%, transparent)`,
        opacity: isIdle ? 0.55 : 1,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0" />
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: `color-mix(in oklab, ${d.hue} 22%, transparent)`,
          color: d.hue,
        }}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold tracking-tight">
        {d.label}
      </span>
      {state === "done" && <Check className="size-3.5 text-[var(--success)]" />}
      {state === "error" && <X className="size-3.5 text-destructive" />}
      {state === "active" && (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: d.hue }}
          aria-label="active"
        />
      )}
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0" />
    </div>
  );
}

const nodeTypes = { agent: AgentNode };

export function AgentGraph({ logs, running }: { logs: AgentLog[]; running: boolean }) {
  const { nodes, edges } = useMemo(() => {
    const states: Record<string, NodeState> = {};
    for (const def of NODE_DEFS) states[def.id] = "idle";
    const activeEdges = new Set<string>();

    for (const l of logs) {
      const s: NodeState =
        l.status === "error" ? "error" : l.status === "active" ? "active" : "done";
      for (const key of [l.sender_agent, l.receiver_agent]) {
        if (!(key in states)) continue;
        if (states[key] === "error") continue;
        if (s === "error") states[key] = "error";
        else if (s === "active") states[key] = "active";
        else states[key] = states[key] === "active" ? "done" : s;
      }
      if (l.status === "active") activeEdges.add(`${l.sender_agent}->${l.receiver_agent}`);
    }
    if (!running) {
      for (const k of Object.keys(states)) {
        if (states[k] === "active") states[k] = "done";
      }
      activeEdges.clear();
    }

    const nodes: Node[] = NODE_DEFS.map((def) => ({
      id: def.id,
      type: "agent",
      position: def.position,
      draggable: false,
      data: {
        label: def.label,
        icon: def.icon,
        hue: def.hue,
        state: states[def.id] ?? "idle",
      },
    }));

    const edges: Edge[] = BASE_EDGES.map(([source, target]) => {
      const flowing =
        activeEdges.has(`${source}->${target}`) || activeEdges.has(`${target}->${source}`);
      const lit =
        states[source] !== "idle" && states[target] !== "idle" && states[source] !== "error";
      return {
        id: `${source}-${target}`,
        source,
        target,
        animated: false,
        className: flowing ? "edge-flowing" : "",
        style: {
          stroke: flowing
            ? "var(--primary)"
            : lit
              ? "color-mix(in oklab, var(--primary) 35%, var(--border))"
              : "var(--border)",
          strokeWidth: flowing ? 2 : 1.2,
        },
      };
    });

    return { nodes, edges };
  }, [logs, running]);

  return (
    <div className="h-full w-full grid-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        nodesDraggable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--border)" />
      </ReactFlow>
    </div>
  );
}
