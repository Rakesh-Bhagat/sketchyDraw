import isEqual from "lodash.isequal";
import { Point, ResizeHandle, Shape } from "@/types/shape";
import { clearCanvas, drawShape, generateDrawable, calculateTextDimensions } from "@/utils/draw";
import { useEffect, useRef } from "react";
import rough from "roughjs/bin/rough";
import { RoughCanvas } from "roughjs/bin/canvas";
import { useShapeStore } from "@/store/useShapeStore";
import { wsClient } from "./useWSClient";
import { useStyleStore } from "@/store/useStyleStore";
import { generateUuid } from '@/utils/uuid';
const useDrawShape = (
  canvas: HTMLCanvasElement | null,
  shapes: Shape[],
  currentTool: Shape["type"],
  onShapeDrawn: (shape: Shape) => void,
  offset: { x: number; y: number },
  zoom: number,
  roomId: string,
  isSessionStarted: boolean,
  textHandlers?: {
    onTextClick: (x: number, y: number, shapeId?: string) => void;
    onTextDoubleClick?: (shape: Shape) => void;
  },
  inPlaceEditingShapeId?: string
) => {
  type CanvasInputEvent = MouseEvent | PointerEvent;

  const isDrawing = useRef(false);
  const erasedShapeIds = useRef<Set<string>>(new Set());
  const fadedShapeIds = useRef<Set<string>>(new Set());
  const currentPoints = useRef<Point[]>([]);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const resizeHandle = useRef<ResizeHandle | null>(null);
  
  // Double-click detection
  const lastClickTime = useRef<number>(0);
  const lastClickPosition = useRef<Point>({ x: 0, y: 0 });
  const doubleClickThreshold = 500; // ms
  const doubleClickDistance = 10; // pixels

  const roughCanvasRef = useRef<RoughCanvas | null>(null);
  const generatorRef = useRef<ReturnType<typeof rough.generator> | null>(null);

  const { selectedShapeId, setSelectedShapeId, updateShape } = useShapeStore();
  const style = useStyleStore.getState().style;

  useEffect(() => {
    if (canvas && !roughCanvasRef.current) {
      roughCanvasRef.current = rough.canvas(canvas);
      generatorRef.current = rough.generator();
    }
  }, [canvas]);

  useEffect(() => {
    if (!canvas || !roughCanvasRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;


    const drawFrame = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      clearCanvas(ctx, canvas.width, canvas.height);
      ctx.setTransform(zoom, 0, 0, zoom, offset.x, offset.y);

      shapes.forEach((shape) => {
        if (shape.type === "deleted") return;
        // Skip drawing the shape that's currently being edited in-place
        if (inPlaceEditingShapeId && shape.id === inPlaceEditingShapeId) return;
        drawShape(
          roughCanvasRef.current!,
          shape,
          shape.id === selectedShapeId,
          zoom,
          ctx,
        );
      });
    };

    const frameId = requestAnimationFrame(drawFrame);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [shapes, canvas, offset, zoom, selectedShapeId, inPlaceEditingShapeId]);

  useEffect(() => {
    if (!selectedShapeId || !generatorRef.current) return;

    const selectedShape = shapes.find((s) => s.id === selectedShapeId);
    if (!selectedShape) return;
    const currentStyle = useStyleStore.getState().style;
    
    // For text shapes, preserve the current fontSize to avoid overwriting during resize
    const targetStyle = selectedShape.type === "draw" 
      ? { ...currentStyle, roughness: 0 }
      : selectedShape.type === "text"
      ? { ...currentStyle, fontSize: selectedShape.style?.fontSize || currentStyle.fontSize }
      : currentStyle;

    if (isEqual(selectedShape.style, targetStyle)) return;

    const updatedShape: Shape = {
      ...selectedShape,
      style: targetStyle,
      drawable:
        generateDrawable(
          generatorRef.current,
          {
            ...selectedShape,
            style: targetStyle,
          },
          zoom
        ) ?? undefined,
    };
    updateShape(roomId, updatedShape);
    if (isSessionStarted && !roomId.includes("standalone")) {
      wsClient.sendShape(roomId, updatedShape);
    }
  }, [
    style,
    selectedShapeId,
    isSessionStarted,
    zoom,
    shapes,
    roomId,
    updateShape,
  ]);

  const getMousePos = (e: CanvasInputEvent): Point => {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas!.getBoundingClientRect();

    return {
      x: (e.clientX - rect.left - offset.x) / zoom,
      y: (e.clientY - rect.top - offset.y) / zoom,
    };
  };

  const isInHandle = (mouse: Point, handle: Point, size: number): boolean => {
    return (
      mouse.x >= handle.x - size / 2 &&
      mouse.x <= handle.x + size / 2 &&
      mouse.y >= handle.y - size / 2 &&
      mouse.y <= handle.y + size / 2
    );
  };

  const isPointNearLine = (
    point: Point,
    start: Point,
    end: Point,
    threshold: number = 5
  ): boolean => {
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;
    const dot = A * C + B * D;
    const lensq = C * C + D * D;

    if (lensq === 0) return Math.sqrt(A * A + B * B) <= threshold;

    let param = dot / lensq;
    param = Math.max(0, Math.min(1, param));

    const xx = start.x + param * C;
    const yy = start.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy) <= threshold / zoom;
  };
  const isPointInShape = (point: Point, shape: Shape): boolean => {
    if(!shape) return false;
    if (shape.type === "line" || shape.type === "arrow") {
      return isPointNearLine(point, shape.start, shape.end, 5);
    }

    if (shape.type === "draw" && shape.points) {
      for (let i = 0; i < shape.points.length - 1; i++) {
        if (isPointNearLine(point, shape.points[i], shape.points[i + 1], 5)) {
          return true;
        }
      }
      return false;
    }
    
    const normX = shape.width < 0 ? shape.start.x + shape.width : shape.start.x;
    const normY =
      shape.height < 0 ? shape.start.y + shape.height : shape.start.y;
    const normWidth = Math.abs(shape.width);
    const normHeight = Math.abs(shape.height);
    
    const isInside = (
      point.x >= normX &&
      point.x <= normX + normWidth &&
      point.y >= normY &&
      point.y <= normY + normHeight
    );
    

    
    return isInside;
  };

  const onMouseDown = (e: CanvasInputEvent) => {
    if (currentTool === "drag") return;
    const mousePos = getMousePos(e);

    // First, check for any shape that was clicked (including text shapes)
    const clickedShape = [...shapes].find((shape) => {
      if (shape.type === "deleted") return false;
      return isPointInShape(mousePos, shape);
    });

    // Handle double-click detection for text shapes specifically
    if (clickedShape && clickedShape.type === "text") {
      const currentTime = Date.now();
      const distanceFromLastClick = Math.sqrt(
        Math.pow(mousePos.x - lastClickPosition.current.x, 2) +
        Math.pow(mousePos.y - lastClickPosition.current.y, 2)
      );
      
      const isDoubleClick = 
        currentTime - lastClickTime.current < doubleClickThreshold &&
        distanceFromLastClick < doubleClickDistance;
      
      
      
      if (isDoubleClick && textHandlers?.onTextDoubleClick) {
        textHandlers.onTextDoubleClick(clickedShape);
        return;
      }
    }

    // Update click tracking for all clicks
    lastClickTime.current = Date.now();
    lastClickPosition.current = mousePos;

    if(currentTool === "text") {
      //console.log("Text tool clicked at:", mousePos);
      //console.log("Available text shapes:", shapes.filter(s => s.type === "text"));
      
      const textShape = shapes.find(shape => {
        if (shape.type !== "text") return false;
        
        // console.log(`Checking text shape ${shape.id}:`, {
        //   shape: shape,
        //   mousePos,
        //   start: shape.start,
        //   end: shape.end,
        //   width: shape.width,
        //   height: shape.height
        // });
        
        return isPointInShape(mousePos, shape);
      });

      if(textShape) {
        textHandlers?.onTextClick(textShape.start.x, textShape.start.y, textShape.id);
      } else {
        if (textHandlers) {
          textHandlers.onTextClick(mousePos.x, mousePos.y);
        }
      }
      return;
    }
    if (currentTool === "eraser") {
      isDrawing.current = true;
      startPoint.current = mousePos;
      erasedShapeIds.current.clear();
      return;
    }
    if (currentTool === "draw") {
      isDrawing.current = true;
      const pos = getMousePos(e);
      startPoint.current = pos;
      currentPoints.current = [pos];
      return;
    }

    if (currentTool === "select") {
      if (selectedShapeId) {
        const shape = shapes.find((s) => s.id === selectedShapeId);
        if (shape) {
          const normX =
            shape.width < 0 ? shape.start.x + shape.width : shape.start.x;
          const normY =
            shape.height < 0 ? shape.start.y + shape.height : shape.start.y;
          const normWidth = Math.abs(shape.width);
          const normHeight = Math.abs(shape.height);
          const handleSize = 10 / zoom;

          const corners = [
            { name: "top-left", x: normX, y: normY },
            { name: "top-right", x: normX + normWidth, y: normY },
            { name: "bottom-left", x: normX, y: normY + normHeight },
            {
              name: "bottom-right",
              x: normX + normWidth,
              y: normY + normHeight,
            },
          ];

          // Check resize handles for all shapes including text, but exclude line and arrow
          if (shape.type !== "line" && shape.type !== "arrow") {
            for (const corner of corners) {
              if (isInHandle(mousePos, corner, handleSize)) {
                resizeHandle.current = corner.name as ResizeHandle;
                isDrawing.current = true;
                startPoint.current = mousePos;
                return;
              }
            }
          }
        }
        if (isPointInShape(mousePos, shape!)) {
          isDrawing.current = true;
          startPoint.current = mousePos;
          return;
        }
      }
    }

    const selected = clickedShape;

    if (selected) {
      setSelectedShapeId(selected.id);
      useStyleStore.getState().setStyle(selected.style!);
      isDrawing.current = true;
      startPoint.current = mousePos;
    } else {
      setSelectedShapeId(null);
    }

    isDrawing.current = true;
    startPoint.current = mousePos;
  };

  const onMouseUp = (e: CanvasInputEvent) => {
    if (
      !isDrawing.current ||
      !startPoint.current ||
      !canvas ||
      !generatorRef.current ||
      currentTool === "drag"
    )
      return;

    if (currentTool === "eraser") {
      if (erasedShapeIds.current.size > 0) {
        const updated = shapes.filter((s) => erasedShapeIds.current.has(s.id));
        for (const shape of updated) {
          const deletedShapes: Shape = {
            ...shape,
            type: "deleted",
          };
          updateShape(roomId, deletedShapes);
          if (isSessionStarted) {
            wsClient.sendShape(roomId, deletedShapes);
          }
        }
      }
      erasedShapeIds.current.clear();
      fadedShapeIds.current.clear();
      isDrawing.current = false;
      return;
    }

    if (currentTool === "select") {
      isDrawing.current = false;
      startPoint.current = null;
      resizeHandle.current = null;
      return;
    }

    if (currentTool === "draw" && currentPoints.current.length > 1) {
      const points = [...currentPoints.current];
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);

      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      const start = { x: minX, y: minY };
      const end = { x: maxX, y: maxY };
      const width = maxX - minX;
      const height = maxY - minY;

      const currentStyle = useStyleStore.getState().style;
      const shapeStyle = {
        ...currentStyle,
        roughness: 0,
      };
      const shape: Shape = {
        id: generateUuid(),
        type: "draw",
        start,
        end,
        width,
        height,
        points,
        style: shapeStyle,
        drawable:
          generateDrawable(
            generatorRef.current,
            {
              id: "temp",
              type: "draw",
              start,
              end,
              width: 0,
              height: 0,
              style: shapeStyle,
              points,
            },
            zoom
          ) ?? undefined,
      };
      onShapeDrawn(shape);
      isDrawing.current = false;
      currentPoints.current = [];
      startPoint.current = null;
      return;
    }
    const end = getMousePos(e);
    const start = startPoint.current;
    const width = end.x - start.x;
    const height = end.y - start.y;

    const currentStyle = useStyleStore.getState().style;
    const shape: Shape = {
      id: generateUuid(),
      type: currentTool,
      start,
      end,
      width,
      height,
      style: currentStyle,
      drawable:
        generateDrawable(
          generatorRef.current,
          {
            id: "temp",
            type: currentTool,
            start,
            end,
            width,
            height,
            style: currentStyle,
          },
          zoom
        ) ?? undefined,
    };

    onShapeDrawn(shape);
    isDrawing.current = false;
    resizeHandle.current = null;
    startPoint.current = null;
  };

  const onMouseMove = (e: CanvasInputEvent) => {
    const currentPos = getMousePos(e);

    if (
      !isDrawing.current ||
      !startPoint.current ||
      !canvas ||
      currentTool === "drag"
    )
      return;

    const ctx = canvas.getContext("2d");
    const roughCanvas = roughCanvasRef.current;
    const generator = generatorRef.current;
    if (!ctx || !roughCanvas || !generator) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    clearCanvas(ctx, canvas.width, canvas.height);
    ctx.setTransform(zoom, 0, 0, zoom, offset.x, offset.y);

    shapes.forEach((shape) => {
      drawShape(roughCanvas, shape, shape.id === selectedShapeId, zoom, ctx);
    });

    if (resizeHandle.current && selectedShapeId) {
      const shape = shapes.find((s) => s.id === selectedShapeId);
      if (!shape) return;
      

      if (shape.type != "line" && shape.type != "arrow") {
        let newStart = { ...shape.start };
        let newEnd = { ...shape.end };

        switch (resizeHandle.current) {
          case "top-left":
            newStart = currentPos;
            break;

          case "top-right":
            newStart = { x: shape.start.x, y: currentPos.y };
            newEnd = { x: currentPos.x, y: shape.end.y };
            break;
          case "bottom-left":
            newStart = { x: currentPos.x, y: shape.start.y };
            newEnd = { x: shape.end.x, y: currentPos.y };
            break;

          case "bottom-right":
            newEnd = currentPos;
            break;
        }
        const newWidth = newEnd.x - newStart.x;
        const newHeight = newEnd.y - newStart.y;
        
        // Handle text shape resizing with font size scaling
        if (shape.type === "text") {
          // console.log("Resizing text shape:", shape.id);
          // console.log("Original dimensions:", { width: shape.width, height: shape.height });
          // console.log("New dimensions:", { width: newWidth, height: newHeight });
          
          const originalWidth = shape.width;
          const originalHeight = shape.height;
          const scaleX = Math.abs(newWidth / originalWidth);
          const scaleY = Math.abs(newHeight / originalHeight);
          // Use the average of X and Y scaling for proportional font scaling
          const fontScale = (scaleX + scaleY) / 2;
          
          // Calculate new font size from style
          const currentFontSize = shape.style?.fontSize || 16;
          const newFontSize = Math.max(8, Math.min(72, currentFontSize * fontScale));
          
          // console.log("Font scaling:", {
          //   scaleX,
          //   scaleY,
          //   fontScale,
          //   currentFontSize,
          //   newFontSize
          // });
          
          // Recalculate text dimensions with new font size
          const newStyle = {
            ...shape.style,
            fontSize: newFontSize,
          };
          const { width: textWidth, height: textHeight } = calculateTextDimensions(
            shape.text || "",
            newStyle,
            zoom,
            ctx
          );
          
          
          const updatedShape: Shape = {
            ...shape,
            start: newStart,
            end: { x: newStart.x + textWidth, y: newStart.y + textHeight },
            width: textWidth,
            height: textHeight,
            style: {
              ...shape.style,
              fontSize: newFontSize,
            },
          };
          
            // console.log("Updated shape fontSize:", updatedShape.style?.fontSize);
            // console.log("Updated shape dimensions:", { width: updatedShape.width, height: updatedShape.height });
          
          // console.log("Before updateShape - current shapes count:", shapes.length);
          updateShape(roomId, updatedShape);
          // console.log("After updateShape called");
          
          if (isSessionStarted) {
            wsClient.sendShape(roomId, updatedShape);
          }
          return;
        }

        let updatedPoints = shape.points;
        if (shape.type === "draw" && shape.points) {
          const scaleX = newWidth / shape.width;
          const scaleY = newHeight / shape.height;

          updatedPoints = shape.points.map((p) => ({
            x: newStart.x + (p.x - shape.start.x) * scaleX,
            y: newStart.y + (p.y - shape.start.y) * scaleY,
          }));
        }
        const updatedShape: Shape = {
          ...shape,
          start: newStart,
          end: newEnd,
          width: newWidth,
          height: newHeight,
          points: updatedPoints,
          drawable:
            generateDrawable(
              generator,
              {
                ...shape,
                start: newStart,
                end: newEnd,
                width: newWidth,
                height: newHeight,
                points: updatedPoints,
              },
              zoom
            ) ?? undefined,
        };
        updateShape(roomId, updatedShape);
        if (isSessionStarted) {
          wsClient.sendShape(roomId, updatedShape);
        }
        return;
      }
    }

    if (currentTool === "eraser" && isDrawing.current) {
      const mouse = getMousePos(e);
      fadedShapeIds.current.clear();
      shapes.forEach((shape) => {
        if (shape.type === "deleted") return;
        if(isPointInShape(mouse, shape)) {
          fadedShapeIds.current.add(shape.id);
          erasedShapeIds.current.add(shape.id);
        }
      });

        
      shapes.forEach((shape) => {
        const isSelected = shape.id === selectedShapeId;
        const isFaded = fadedShapeIds.current.has(shape.id);

        const previewStyle = isFaded
          ? { ...shape.style, stroke: "#c6c1c0", fill: undefined, roughness: 0 }
          : shape.style;

        const previewShape = {
          ...shape,
          style: previewStyle,
        };
        drawShape(roughCanvas, previewShape, isSelected, zoom, ctx);
      });
      return;
    }
    if (currentTool === "draw" && isDrawing.current) {
      const pos = getMousePos(e);
      currentPoints.current.push(pos);
      const start = currentPoints.current[0];
      const end = pos;
      const width = end.x - start.x;
      const height = end.y - start.y;
      const previewShape: Shape = {
        id: "temp-preview",
        type: "draw",
        start,
        end,
        width,
        height,
        points: [...currentPoints.current],
        style: {
          ...style,
          roughness: 0,
        },
        drawable:
          generateDrawable(
            generator,
            {
              id: "temp-preview",
              type: "draw",
              start: currentPoints.current[0],
              end: pos,
              width: 0,
              height: 0,
              points: [...currentPoints.current],
              style: {
                ...style,
                roughness: 0,
              },
            },
            zoom
          ) ?? undefined,
      };
      drawShape(roughCanvas, previewShape, false, zoom, ctx);
      return;
    }

    if (currentTool === "select" && selectedShapeId) {
      const selectedShape = shapes.find((s) => s.id === selectedShapeId);
      if (!selectedShape) return;

      const dx = currentPos.x - startPoint.current.x;
      const dy = currentPos.y - startPoint.current.y;

      const newStart = {
        x: selectedShape.start.x + dx,
        y: selectedShape.start.y + dy,
      };
      const newEnd = {
        x: selectedShape.end.x + dx,
        y: selectedShape.end.y + dy,
      };
      let updatedPoints = selectedShape.points;
      if (selectedShape.type === "draw" && selectedShape.points) {
        updatedPoints = selectedShape.points.map((p) => ({
          x: p.x + dx,
          y: p.y + dy,
        }));
      }
      const updatedShape: Shape = {
        ...selectedShape,
        start: newStart,
        end: newEnd,
        style: selectedShape.style,
        width: selectedShape.type === "line" || selectedShape.type === "arrow" ? newEnd.x - newStart.x : selectedShape.width,
        height: selectedShape.type === "line" || selectedShape.type === "arrow" ? newEnd.y - newStart.y : selectedShape.height,
        points: updatedPoints,
        drawable:
          generateDrawable(
            generator,
            {
              ...selectedShape,
              start: newStart,
              end: newEnd,
              width: newEnd.x - newStart.x,
              height: newEnd.y - newStart.y,
              style: selectedShape.style,
              points: updatedPoints,
            },
            zoom
          ) ?? undefined,
      };

      updateShape(roomId, updatedShape);
      startPoint.current = currentPos;

      if (isSessionStarted) {
        wsClient.sendShape(roomId, updatedShape);
      }
      return;
    }

    const width = currentPos.x - startPoint.current.x;
    const height = currentPos.y - startPoint.current.y;

    const previewShape: Shape = {
      id: "temp-preview",
      type: currentTool,
      start: startPoint.current,
      end: currentPos,
      width,
      height,
      style,
      drawable:
        generateDrawable(
          generator,
          {
            id: "temp-preview",
            type: currentTool,
            start: startPoint.current,
            end: currentPos,
            width,
            height,
            style,
          },
          zoom
        ) ?? undefined,
    };

    drawShape(roughCanvas, previewShape, false, zoom, ctx);
  };
  return { onMouseDown, onMouseMove, onMouseUp };
};

export default useDrawShape;
