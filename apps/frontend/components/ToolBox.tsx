"use client";

import { useShapeStore } from "@/store/useShapeStore";
import { useToolStore } from "@/store/useToolStore";
import {
  Circle,
  Diamond,
  Eraser,
  Hand,
  Minus,
  MousePointer,
  MoveRight,
  Pencil,
  Square,
  TypeOutline,
} from "lucide-react";
import { useCallback, useEffect } from "react";

type ToolDefinition = {
  key: string;
  label: string;
  type:
    | "drag"
    | "select"
    | "rectangle"
    | "diamond"
    | "ellipse"
    | "line"
    | "arrow"
    | "draw"
    | "eraser"
    | "text";
  Icon: typeof Hand;
  iconClassName?: string;
  activeIconClassName?: string;
};

const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    key: "H",
    label: "Hand",
    type: "drag",
    Icon: Hand,
    iconClassName: "scale-y-[1.2]",
  },
  {
    key: "1",
    label: "Selection",
    type: "select",
    Icon: MousePointer,
    iconClassName: "scale-y-[1.2]",
  },
  {
    key: "2",
    label: "Rectangle",
    type: "rectangle",
    Icon: Square,
    activeIconClassName: "fill-current text-[hsl(var(--tool-fill))]",
  },
  {
    key: "3",
    label: "Diamond",
    type: "diamond",
    Icon: Diamond,
    activeIconClassName: "fill-current text-[hsl(var(--tool-fill))]",
  },
  {
    key: "4",
    label: "Ellipse",
    type: "ellipse",
    Icon: Circle,
    activeIconClassName: "fill-current text-[hsl(var(--tool-fill))]",
  },
  {
    key: "5",
    label: "Line",
    type: "line",
    Icon: Minus,
  },
  {
    key: "6",
    label: "Arrow",
    type: "arrow",
    Icon: MoveRight,
  },
  {
    key: "7",
    label: "Draw",
    type: "draw",
    Icon: Pencil,
  },
  {
    key: "8",
    label: "Text",
    type: "text",
    Icon: TypeOutline,
  },
  {
    key: "0",
    label: "Eraser",
    type: "eraser",
    Icon: Eraser,
  },
  
];

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
};

const ToolBox = () => {
  const currentTool = useToolStore((state) => state.currentTool);
  const setCurrentTool = useToolStore((state) => state.setCurrentTool);
  const { setSelectedShapeId } = useShapeStore();

  const activateTool = useCallback(
    (tool: ToolDefinition["type"]) => {
      setCurrentTool(tool);
      if (tool !== "select") {
        setSelectedShapeId(null);
      }
    },
    [setCurrentTool, setSelectedShapeId]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const pressedKey = event.key.toUpperCase();
      const selectedTool = TOOL_DEFINITIONS.find((tool) => tool.key === pressedKey);
      if (!selectedTool) return;

      event.preventDefault();
      activateTool(selectedTool.type);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activateTool]);

  return (
    <div className="flex max-w-full overflow-x-auto sm:overflow-x-visible p-2 rounded-lg bg-[hsl(var(--toolbox))] text-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex shrink-0 flex-nowrap gap-2 justify-center items-center">
        {TOOL_DEFINITIONS.map((tool) => {
          const isActive = currentTool === tool.type;
          const tooltipLabel = `${tool.label} (${tool.key})`;

          return (
            <div
              key={tool.type}
              className="relative flex rounded-lg hover:bg-[hsl(var(--icon-hover))] group"
            >
              <button
                type="button"
                title={tooltipLabel}
                aria-label={tooltipLabel}
                onClick={() => activateTool(tool.type)}
                className={`relative cursor-pointer p-2 rounded-lg ${isActive ? "bg-[hsl(var(--icon-selected))]" : ""}`}
              >
                <tool.Icon
                  className={`w-5 h-5 ${tool.iconClassName ?? ""} ${
                    isActive && tool.activeIconClassName ? tool.activeIconClassName : ""
                  }`}
                />
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-1 -bottom-1 min-w-3 rounded border px-1 text-[9px] font-semibold leading-3 ${
                    isActive
                      ? "border-white/15 bg-white/20 text-white"
                      : "border-white/5 bg-black/10 text-white/80"
                  }`}
                >
                  {tool.key}
                </span>
              </button>
              <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max -translate-x-1/2 rounded-md border border-white/10 bg-[hsl(var(--toolbox))] px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {tooltipLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToolBox;
