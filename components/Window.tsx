import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Square } from 'lucide-react';
import { WindowState } from '../types';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
}

const Window: React.FC<WindowProps> = ({ window: windowState, children, onClose, onMinimize, onMaximize, onFocus }) => {
  const [position, setPosition] = useState({ x: windowState.x, y: windowState.y });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Only update position from props if not maximized to avoid jumpiness when un-maximizing
    if (!windowState.isMaximized) {
        setPosition({ x: windowState.x, y: windowState.y });
    }
  }, [windowState.x, windowState.y, windowState.isMaximized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowState.isMaximized) return; // Disable drag when maximized
    onFocus(windowState.id);
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (windowState.isMinimized) return null;

  const maximizedStyle: React.CSSProperties = {
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100vw',
      height: 'calc(100vh - 48px)', // Subtract Taskbar height
      zIndex: windowState.zIndex,
      borderRadius: 0,
  };

  const normalStyle: React.CSSProperties = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      width: windowState.width,
      height: windowState.height,
      zIndex: windowState.zIndex,
  };

  return (
    <div
      className={`flex flex-col bg-zinc-100 border-2 border-zinc-400 shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-200 ease-in-out`}
      style={windowState.isMaximized ? maximizedStyle : normalStyle}
      onMouseDown={() => onFocus(windowState.id)}
    >
      {/* Title Bar */}
      <div
        className="h-8 bg-gradient-to-r from-nird-dark to-zinc-800 flex items-center justify-between px-2 cursor-move select-none shrink-0"
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onMaximize(windowState.id)}
      >
        <span className="text-white font-mono text-sm font-bold truncate px-2">{windowState.title}</span>
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); onMinimize(windowState.id); }} className="p-1 hover:bg-zinc-700 rounded text-white"><Minus size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); onMaximize(windowState.id); }} className="p-1 hover:bg-zinc-700 rounded text-white"><Square size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); onClose(windowState.id); }} className="p-1 hover:bg-red-600 rounded text-white"><X size={14} /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-white flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Window;