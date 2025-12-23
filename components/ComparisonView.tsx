import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DownloadIcon } from './Icons';

interface ComparisonViewProps {
  originalUrl: string;
  processedUrl: string;
  filename: string;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ originalUrl, processedUrl, filename }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => setIsDragging(true), []);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  
  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    }
    
    return () => {
       window.removeEventListener('mouseup', handleMouseUp);
       window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseUp]);

  const handleDownload = () => {
      const link = document.createElement('a');
      link.href = processedUrl;
      link.download = `clean-${filename}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div 
        ref={containerRef}
        className="relative w-full h-[500px] bg-slate-900 rounded-xl overflow-hidden cursor-ew-resize select-none border border-slate-700 shadow-2xl"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Background Image (Processed - Right Side mainly visible) */}
        <img 
          src={processedUrl} 
          alt="Processed" 
          className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" 
        />
        
        {/* Foreground Image (Original - Left Side, clipped) */}
        <div 
          className="absolute top-0 left-0 h-full w-full overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src={originalUrl} 
            alt="Original" 
            className="absolute top-0 left-0 h-full max-w-none object-contain"
            style={{ width: containerRef.current?.offsetWidth || '100%' }} // Keep image same scale
          />
        </div>

        {/* Slider Line */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-xl text-slate-900 text-xs font-bold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
               <path d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-sm font-medium pointer-events-none">
          Original
        </div>
        <div className="absolute top-4 right-4 bg-indigo-600/80 backdrop-blur-sm text-white px-2 py-1 rounded text-sm font-medium pointer-events-none">
          Processed
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center bg-slate-800 p-4 rounded-lg border border-slate-700">
        <div>
            <h3 className="text-white font-medium truncate max-w-md">{filename}</h3>
            <p className="text-slate-400 text-sm">Drag slider to compare results</p>
        </div>
        <button 
            onClick={handleDownload}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
            <DownloadIcon className="w-5 h-5" />
            Download Clean Image
        </button>
      </div>
    </div>
  );
};

export default ComparisonView;