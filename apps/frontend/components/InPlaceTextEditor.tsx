"use client";

import { useEffect, useRef, useState } from "react";
import { Shape } from "@/types/shape";

interface InPlaceTextEditorProps {
  shape: Shape;
  zoom: number;
  offset: { x: number; y: number };
  onComplete: (text: string) => void;
  onCancel: () => void;
  onTextChange?: (text: string) => void;
}

export const InPlaceTextEditor = ({
  shape,
  zoom,
  offset,
  onComplete,
  onCancel,
  onTextChange,
}: InPlaceTextEditorProps) => {
  const [text, setText] = useState(shape.text || "");
  const [isReady, setIsReady] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  const screenX = shape.start.x * zoom + offset.x;
  const screenY = shape.start.y * zoom + offset.y;
  const fontSize = (shape.style?.fontSize || 16) * zoom;
  
  // Calculate a more flexible text width - use original shape width as minimum but allow expansion
  const minWidth = Math.max(shape.width * zoom, 200); // Increased minimum width
  const maxWidth = window.innerWidth - screenX - 50; // Leave some margin from screen edge
  const textWidth = Math.min(maxWidth, Math.max(minWidth, 300)); // Default to 300px but respect screen bounds

  useEffect(() => {
    const ensureFocus = () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
        
        // Verify focus was set
        if (document.activeElement === textareaRef.current) {
        } else {
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
              textareaRef.current.select();
            }
          }, 50);
        }
      }
    };

    // Try to focus immediately
    ensureFocus();
    
    // Also try after a short delay to ensure DOM is ready
    setTimeout(ensureFocus, 0);
    
    // Add a small delay before enabling click-outside detection
    setTimeout(() => {
      setIsReady(true);
    }, 150); // Increased delay to ensure focus is established
  }, []); // Run only once on mount

  // Separate useEffect for auto-resizing when text changes
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      
      // Reset height to get accurate measurements
      textarea.style.height = 'auto';
      
      // Calculate height based on content
      const lines = text.split('\n').length;
      const lineHeight = fontSize * 1.4; // Match draw.ts lineHeight
      const minHeight = Math.max(lines * lineHeight, lineHeight);
      const scrollBasedHeight = textarea.scrollHeight + 4; // Add small buffer
      const finalHeight = Math.max(minHeight, scrollBasedHeight);
      
      textarea.style.height = `${finalHeight}px`;
      
    }
  }, [text, fontSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
        e.preventDefault();
        onComplete(text);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isReady && textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        onComplete(text);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [text, onComplete, onCancel, isReady]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange?.(newText);
    
    // Auto-resize textarea height only
    const textarea = e.target;
    
    // Reset height to get accurate measurements
    textarea.style.height = 'auto';
    
    // Calculate height based on content
    const lines = newText.split('\n').length;
    const lineHeight = fontSize * 1.4; // Match draw.ts lineHeight
    const minHeight = Math.max(lines * lineHeight, lineHeight);
    const scrollBasedHeight = textarea.scrollHeight + 4; // Add small buffer
    const finalHeight = Math.max(minHeight, scrollBasedHeight);
    
    textarea.style.height = `${finalHeight}px`;
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
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        autoFocus={true} // Ensure autofocus
        
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: shape.style?.fontFamily || 'Gloria Hallelujah',
          color: shape.style?.stroke || '#ffffff',
          background: 'transparent',
          outline: 'none',
          resize: 'none',
          overflow: 'hidden', // Prevent scrollbars
          overflowWrap: 'break-word', // Allow word breaking when needed
          width: `${textWidth}px`, // Use fixed width to prevent horizontal expansion
          maxWidth: `${Math.min(window.innerWidth - screenX - 20, 800)}px`, // Responsive max width
          minWidth: '200px', // Ensure minimum usable width
          minHeight: `${fontSize * 1.4}px`, // Match the lineHeight from draw.ts
          padding: '2px 4px', // Small padding for better editability
          margin: '0',
          textAlign: (shape.style?.textAlign || 'left') as 'left' | 'center' | 'right',
          lineHeight: '1.4', // Match the lineHeight multiplier from draw.ts
          verticalAlign: 'top',
          boxSizing: 'border-box',
          whiteSpace: 'pre-wrap', // Allow wrapping when line gets too long
          wordWrap: 'break-word', // Break words when necessary
        }}
      />
    </div>
  );
};
