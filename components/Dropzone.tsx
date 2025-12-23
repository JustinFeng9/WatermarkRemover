import React, { useRef, useState } from 'react';
import { UploadIcon } from './Icons';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    }
    // Reset input so same files can be selected again if needed
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-700' : ''}
        ${isDragOver 
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
            : 'border-slate-600 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-500'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      
      <div className="p-4 bg-indigo-600 rounded-full shadow-lg mb-4">
        <UploadIcon className="w-8 h-8 text-white" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">
        {isDragOver ? "Drop files now" : "Upload Images"}
      </h3>
      <p className="text-slate-400 text-center max-w-sm px-4">
        Drag & drop images here or click to browse. 
        <br/><span className="text-xs text-slate-500 mt-1 block">Supports JPG, PNG, WEBP</span>
      </p>
    </div>
  );
};

export default Dropzone;