"use client";

import useCanvasResize from "@/hooks/useCanvasResize";
import useDrawShape from "@/hooks/useDrawShape";
import { wsClient } from "@/hooks/useWSClient";
import { useSessionStore } from "@/store/useSessionstore";
import { useShapeStore } from "@/store/useShapeStore";
import { useToolStore } from "@/store/useToolStore";
import { Point, Shape } from "@/types/shape";
import { Minus, Plus } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import StyleSidebar from "./StyleSidebar";
import { useStyleStore } from "@/store/useStyleStore";
import { useCanvasCursor } from "@/hooks/useCanvasCursor";
import { calculateTextDimensions } from "@/utils/draw";
import { InPlaceTextEditor } from "./InPlaceTextEditor";
import { CanvasTextInput } from "./CanvasTextInput";
import MenuDropdown from "./MenuDropdown";
import { generateUuid } from "@/utils/uuid";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 50;
const ZOOM_STEP_FACTOR = 1.1;

const clampZoom = (value: number) => Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM);

const Canvas = () => {
  const params = useParams();
  const pathname = usePathname();
  const isStandalone = pathname === "/canvas";
  const roomId = isStandalone ? "standalone" : (params.roomId as string);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isClient, setIsClient] = useState(false);
  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    id?: string;
  } | null>(null);
  const [inPlaceEditingShape, setInPlaceEditingShape] = useState<Shape | null>(null);


  const currentTool = useToolStore((state) => state.currentTool);
  const {
    addShape,
    offset,
    setOffset,
    zoom,
    setZoom,
    selectedShapeId,
    setSelectedShapeId,
    updateShape,
    roomShapes,
  } = useShapeStore();
  const shapes = useMemo(() => roomShapes[roomId] || [], [roomShapes, roomId]);
  const isSessionStarted = useSessionStore((state) => state.isSessionStarted);

  const { canvasBg, style } = useStyleStore();
  const { setCurrentTool } = useToolStore();

  const size = useCanvasResize();
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef<Point>({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);

  const applyZoom = useCallback(
    (nextZoom: number, focusPoint?: Point) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const clampedZoom = clampZoom(nextZoom);
      const zoomPoint = focusPoint ?? {
        x: canvas.width / 2,
        y: canvas.height / 2,
      };

      const worldPoint = {
        x: (zoomPoint.x - offset.x) / zoom,
        y: (zoomPoint.y - offset.y) / zoom,
      };

      setZoom(clampedZoom);
      setOffset({
        x: zoomPoint.x - worldPoint.x * clampedZoom,
        y: zoomPoint.y - worldPoint.y * clampedZoom,
      });
    },
    [offset, setOffset, setZoom, zoom]
  );

  const handleZoomOut = useCallback(() => {
    applyZoom(zoom / ZOOM_STEP_FACTOR);
  }, [applyZoom, zoom]);

  const handleZoomIn = useCallback(() => {
    applyZoom(zoom * ZOOM_STEP_FACTOR);
  }, [applyZoom, zoom]);

  const handleResetZoom = useCallback(() => {
    applyZoom(1);
  }, [applyZoom]);

  const zoomPercentage = Math.round(zoom * 100);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleShapeDrawn = (shape: Shape) => {
    addShape(isStandalone ? "standalone" : roomId, shape);
    setSelectedShapeId(shape.id);
    setCurrentTool("select");
    if (isClient) {
      const token = localStorage.getItem("token");
      if (isSessionStarted && !isStandalone && token) {
        wsClient.sendShape(roomId, shape);
      }
    }
  };

  const handleTextComplete = (text: string) => {
  if (text.trim() && textInput) {
    if (textInput.id) {
      // Editing existing text
      const existingShape = shapes.find((shape) => shape.id === textInput.id);
      if (existingShape) {
        let updatedShape: Shape = {
          ...existingShape,
          text: text, // Don't trim - preserve line breaks and spaces
        };
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            const dimensions = calculateTextDimensions(
              text,
              existingShape.style || {},
              zoom,
              ctx
            );
            updatedShape = {
              ...updatedShape,
              width: dimensions.width,
              height: dimensions.height,
              end: {
                x: existingShape.start.x + dimensions.width,
                y: existingShape.start.y + dimensions.height,
              },
            };
          }
        }

        updateShape(roomId, updatedShape);
        if (isSessionStarted && !isStandalone && isClient) {
          const token = localStorage.getItem("token");
          if (token) {
            wsClient.sendShape(roomId, updatedShape);
          }
        }
      }
    } else {
      // Creating new text
      let textShape: Shape = {
        id: generateUuid(),
        type: "text",
        start: { x: textInput.x, y: textInput.y },
        end: { x: textInput.x, y: textInput.y },
        width: 0,
        height: 0,
        text: text, // Don't trim - preserve line breaks and spaces
        style: {
          ...style,
          fontSize: style.fontSize || 16,
          fontFamily: style.fontFamily || "Arial",
          textAlign: style.textAlign || "left",
        },
      };
      
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          const dimensions = calculateTextDimensions(
            text,
            textShape.style || {},
            zoom,
            ctx
          );
          textShape = {
            ...textShape,
            width: dimensions.width,
            height: dimensions.height,
            end: {
              x: textInput.x + dimensions.width,
              y: textInput.y + dimensions.height,
            },
          };
        }
      }
      handleShapeDrawn(textShape);
    }
  }
  setTextInput(null);
};
  const handleTextCancel = () => {
    setTextInput(null);
  };

  const handleInPlaceTextComplete = (text: string) => {
    if (inPlaceEditingShape) {
      const updatedShape = { ...inPlaceEditingShape, text };
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          const dimensions = calculateTextDimensions(
            text,
            inPlaceEditingShape.style || {},
            zoom,
            ctx
          );
          updatedShape.width = dimensions.width;
          updatedShape.height = dimensions.height;
          updatedShape.end = {
            x: inPlaceEditingShape.start.x + dimensions.width,
            y: inPlaceEditingShape.start.y + dimensions.height,
          };
        }
      }
      updateShape(roomId, updatedShape);
      if (isClient) {
        const token = localStorage.getItem("token");
        if (isSessionStarted && !isStandalone && token) {
          wsClient.sendShape(roomId, updatedShape);
        }
      }
    }
    setInPlaceEditingShape(null);
  };

  const handleInPlaceTextCancel = () => {
    setInPlaceEditingShape(null);
  };

  const { onMouseDown, onMouseUp, onMouseMove } = useDrawShape(
    canvasRef.current,
    shapes,
    currentTool,
    handleShapeDrawn,
    offset,
    zoom,
    roomId,
    isSessionStarted,
    {
      onTextClick: (x: number, y: number, shapeId?: string) => {
        setTextInput({ x, y, id: shapeId });
      },
      onTextDoubleClick: (shape: Shape) => {
        setInPlaceEditingShape(shape);
        setTextInput(null); // Close any existing text input
      },
    },
    inPlaceEditingShape?.id
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const sensitivity = e.ctrlKey ? 0.0075 : 0.0025;
      const zoomFactor = Math.exp(-e.deltaY * sensitivity);

      applyZoom(clampZoom(zoom * zoomFactor), {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [applyZoom, zoom]
  );

  useEffect(() => {
}, [currentTool, textInput]);

  useEffect(() => {
    shapes.forEach(shape => {
      if (shape.type === "text") {
      }
    });
  }, [shapes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  useCanvasCursor({
    canvas: canvasRef.current,
    tool: currentTool,
    shapes,
    selectedShapeId,
    zoom,
    offset,
    isDragging,
  });

  useEffect(() => {
    if (!isStandalone) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [roomId, setZoom, setOffset, isStandalone]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const downHandler = (e: PointerEvent) => {
      if (activePointerId.current !== null) return;
      activePointerId.current = e.pointerId;
      canvas.setPointerCapture(e.pointerId);

      if (currentTool === "drag") {
        e.preventDefault();
        setSelectedShapeId(null);
        setIsDragging(true);
        lastPos.current = { x: e.clientX, y: e.clientY };
      } else {
        onMouseDown(e);
      }
    };

    const moveHandler = (e: PointerEvent) => {
      if (activePointerId.current !== e.pointerId) return;

      if (isDragging && currentTool === "drag") {
        e.preventDefault();
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;

        setOffset({ x: offset.x + dx, y: offset.y + dy });
        lastPos.current = { x: e.clientX, y: e.clientY };
      } else {
        onMouseMove(e);
      }
    };

    const clearPointer = (e: PointerEvent) => {
      if (activePointerId.current !== e.pointerId) return;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      activePointerId.current = null;
    };

    const upHandler = (e: PointerEvent) => {
      if (activePointerId.current !== e.pointerId) return;

      if (isDragging && currentTool === "drag") {
        e.preventDefault();
        setIsDragging(false);
      } else {
        onMouseUp(e);
      }

      clearPointer(e);
    };

    const cancelHandler = (e: PointerEvent) => {
      if (isDragging && currentTool === "drag") {
        setIsDragging(false);
      }
      clearPointer(e);
    };

    canvas.addEventListener("pointerdown", downHandler);
    canvas.addEventListener("pointerup", upHandler);
    canvas.addEventListener("pointermove", moveHandler);
    canvas.addEventListener("pointercancel", cancelHandler);

    return () => {
      canvas.removeEventListener("pointerdown", downHandler);
      canvas.removeEventListener("pointerup", upHandler);
      canvas.removeEventListener("pointermove", moveHandler);
      canvas.removeEventListener("pointercancel", cancelHandler);
    };
  }, [
    onMouseDown,
    onMouseMove,
    onMouseUp,
    currentTool,
    offset,
    setOffset,
    isDragging,
    setSelectedShapeId,
  ]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden relative">
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        className="h-full w-full touch-none"
        style={{ backgroundColor: canvasBg, touchAction: "none" }}
      />
      <div className="absolute top-4 left-4 z-50">
        <MenuDropdown />
      </div>
      {currentTool !== "drag" && (
        <div className="absolute left-4  top-20">
          <StyleSidebar />
        </div>
      )}
      <div className="absolute bottom-20 left-20 z-50 flex -translate-x-1/2 items-center overflow-hidden rounded-2xl border border-white/10 bg-[hsl(var(--toolbox))]/95 text-[hsl(var(--tool-fill))] shadow-[0_12px_32px_rgba(0,0,0,0.32)] backdrop-blur-sm sm:bottom-4 sm:left-4 sm:translate-x-0">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="grid h-10 w-10 place-items-center transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus size={16} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          aria-label="Reset zoom to 100 percent"
          onClick={handleResetZoom}
          className="min-w-16 border-x border-white/10 px-3 text-sm font-medium tracking-wide transition hover:bg-white/10"
        >
          {zoomPercentage}%
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="grid h-10 w-10 place-items-center transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={16} strokeWidth={2.25} />
        </button>
      </div>
      {textInput && (
        <CanvasTextInput
          x={textInput.x}
          y={textInput.y}
          zoom={zoom}
          offset={offset}
          onComplete={handleTextComplete}
          onCancel={handleTextCancel}
          initialText={
            textInput.id
              ? shapes.find((shape) => shape.id === textInput.id)?.text || ""
              : ""
          }
          style={{
            fontSize: style.fontSize || 16,
            fontFamily: style.fontFamily || "Gloria Hallelujah",
            stroke: style.stroke,
          }}
        />
      )}
      {inPlaceEditingShape && (
        <InPlaceTextEditor
          shape={inPlaceEditingShape}
          zoom={zoom}
          offset={offset}
          onComplete={handleInPlaceTextComplete}
          onCancel={handleInPlaceTextCancel}
        />
      )}
      
      {isStandalone && isClient && !localStorage.getItem("token") && (
        <div className="absolute bottom-4 right-4 bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2 text-blue-300 text-sm">
          Drawing locally - Sign in to collaborate with others
        </div>
      )}
    </div>
  );
};

export default Canvas;
