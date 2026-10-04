"use client";

import { useEffect, useRef, useState } from "react";

interface CanvasTextInputProps {
  x: number;
  y: number;
  zoom: number;
  offset: { x: number; y: number };
  onComplete: (text: string) => void;
  onCancel: () => void;
  onTextChange?: (text: string) => void;
  initialText?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    stroke?: string;
  };
}

export const CanvasTextInput = ({
  x,
  y,
  zoom,
  offset,
  onComplete,
  onCancel,
  onTextChange,
  initialText = "",
  style = {},
}: CanvasTextInputProps) => {
  const [text, setText] = useState(initialText);
//   const [isVisible, setIsVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
//   const cursorRef = useRef<HTMLDivElement>(null);

  const screenX = x * zoom + offset.x;
  const screenY = y * zoom + offset.y;
  const fontSize = (style.fontSize || 16) * zoom;


  useEffect(() => {
    if (inputRef.current) {
      // Force focus with multiple methods to ensure it works
      const element = inputRef.current;
      
      // First, make sure the element is in the DOM and ready
      requestAnimationFrame(() => {
        element.focus();
        
        // Set cursor position at the end of existing text or at the start
        const range = document.createRange();
        const sel = window.getSelection();
        
        if (element.childNodes.length > 0) {
          range.setStartAfter(element.lastChild!);
        } else {
          range.setStart(element, 0);
        }
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
        
        // Double-check focus after a small delay
        setTimeout(() => {
          if (document.activeElement !== element) {
            element.focus();
          }
          setIsReady(true);
        }, 50);
      });
    }
  }, []);

//   useEffect(() => {
//     // Cursor blinking effect
//     const interval = setInterval(() => {
//       setIsVisible(prev => !prev);
//     }, 500);

//     return () => clearInterval(interval);
//   }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
        e.preventDefault();
        if (text.trim()) {
          onComplete(text);
        } else {
          onCancel();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      
      if (isReady && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        // Prevent the canvas from handling this click
        e.preventDefault();
        e.stopPropagation();
        
        // Add a small delay to prevent conflicts with canvas mouse events
        setTimeout(() => {
          if (text.trim()) {
            onComplete(text);
          } else {
            onCancel();
          }
        }, 50); // Reduced delay
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside, true); // Use capture phase

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [text, onComplete, onCancel, isReady]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || "";
    setText(newText);
    onTextChange?.(newText);
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: screenX,
        top: screenY,
        zIndex: 1000,
        pointerEvents: "auto",
      }}
    >
      <div
        ref={inputRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onClick={handleClick}
        tabIndex={0}
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: style.fontFamily || 'Gloria Hallelujah',
          color: style.stroke || '#ffffff',
          background: 'transparent',
        //   border: '2px dashed rgba(255, 255, 255, 0.5)',
          outline: 'none',
          minWidth: '120px',
          minHeight: `${fontSize + 16}px`,
          padding: '8px',
        //   borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        //   boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
        // data-placeholder="Type your text..."
      >
        {initialText}
      </div>
      {/* {text.length === 0 && (
        <div
          style={{
            position: 'absolute',
            left: '10px',
            top: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: `${fontSize}px`,
            fontFamily: style.fontFamily || 'Gloria Hallelujah',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          
        </div>
      )} */}
      {/* {text.length === 0 && (
        <div
          ref={cursorRef}
          style={{
            position: 'absolute',
            left: '10px',
            top: '10px',
            width: '2px',
            height: `${fontSize}px`,
            backgroundColor: style.stroke || '#ffffff',
            opacity: isVisible ? 1 : 0,
            pointerEvents: 'none',
          }}
        />
      )} */}
    </div>
  );
};
