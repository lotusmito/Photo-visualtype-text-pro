
import React, { useRef, useState, useEffect } from 'react';
import { TextOverlay } from '../types';

interface Props {
  image: string;
  overlays: TextOverlay[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateOverlay: (id: string, updates: Partial<TextOverlay>) => void;
}

const EditorCanvas: React.FC<Props> = ({ image, overlays, selectedId, onSelect, onUpdateOverlay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent, overlay: TextOverlay) => {
    e.stopPropagation();
    onSelect(overlay.id);
    setDraggingId(overlay.id);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let nx = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      let ny = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
      onUpdateOverlay(draggingId, { x: nx, y: ny });
    }
  };

  const handleMouseUp = () => setDraggingId(null);

  const getScaledSize = (baseSize: number) => {
    if (!containerHeight) return baseSize;
    return (baseSize / 1000) * containerHeight;
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-3xl overflow-hidden canvas-container select-none bg-white shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onSelect(null)}
    >
      <img 
        src={image} 
        alt="Canvas" 
        className="max-w-full max-h-[80vh] block pointer-events-none" 
        onLoad={() => {
           if (containerRef.current) setContainerHeight(containerRef.current.offsetHeight);
        }}
      />

      <div className="absolute inset-0">
        {overlays.map((o) => (
          <div
            key={o.id}
            onMouseDown={(e) => handleMouseDown(e, o)}
            onClick={(e) => e.stopPropagation()}
            className={`${selectedId === o.id ? 'z-50' : 'z-10'} absolute flex leading-none items-start`}
            style={{
              left: `${o.x}%`,
              top: `${o.y}%`,
              fontSize: `${getScaledSize(o.fontSize)}px`,
              color: o.color,
              fontFamily: o.fontFamily,
              fontWeight: o.fontWeight,
              opacity: o.opacity,
              cursor: draggingId === o.id ? 'grabbing' : 'grab',
              whiteSpace: 'nowrap',
              outline: selectedId === o.id ? '2px solid #6366f1' : 'none',
              outlineOffset: '4px',
              transition: draggingId ? 'none' : 'all 0.1s'
            }}
          >
            {o.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditorCanvas;
