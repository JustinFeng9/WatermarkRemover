import React, { useState, useCallback } from 'react';
import Dropzone from './components/Dropzone';
import ComparisonView from './components/ComparisonView';
import { ImageTask, ProcessStatus } from './types';
import { generateId, fileToBase64, formatFileSize } from './services/utils';
import { removeWatermarkFromImage } from './services/geminiService';
import { TrashIcon, MagicWandIcon, CheckCircleIcon, ExclamationCircleIcon, RefreshIcon } from './components/Icons';

function App() {
  const [tasks, setTasks] = useState<ImageTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const handleFilesAdded = useCallback((files: File[]) => {
    const newTasks: ImageTask[] = files.map(file => ({
      id: generateId(),
      file,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      status: ProcessStatus.IDLE,
      thumbnailUrl: URL.createObjectURL(file), // Ideally reuse ObjectURL
    }));

    setTasks(prev => [...prev, ...newTasks]);
    // Auto-select first new task if none selected
    if (!activeTaskId && newTasks.length > 0) {
      setActiveTaskId(newTasks[0].id);
    }
  }, [activeTaskId]);

  const removeTask = useCallback((id: string) => {
    setTasks(prev => {
      const taskToRemove = prev.find(t => t.id === id);
      if (taskToRemove) {
        URL.revokeObjectURL(taskToRemove.originalUrl);
        if (taskToRemove.processedUrl) URL.revokeObjectURL(taskToRemove.processedUrl);
      }
      return prev.filter(t => t.id !== id);
    });
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
  }, [activeTaskId]);

  const processTask = async (task: ImageTask) => {
    // Skip if already completed or processing
    if (task.status === ProcessStatus.COMPLETED || task.status === ProcessStatus.PROCESSING) return;

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: ProcessStatus.PROCESSING, error: undefined } : t));

    try {
      const processedUrl = await removeWatermarkFromImage(task.file);
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: ProcessStatus.COMPLETED, processedUrl } : t
      ));
    } catch (error: any) {
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: ProcessStatus.ERROR, error: error.message } : t
      ));
    }
  };

  const processBatch = async () => {
    setIsProcessingBatch(true);
    const pendingTasks = tasks.filter(t => t.status === ProcessStatus.IDLE || t.status === ProcessStatus.ERROR);
    
    // Process sequentially to avoid rate limits, or in small parallel batches.
    // Given the complexity of image processing, sequential is safer for reliability.
    for (const task of pendingTasks) {
       await processTask(task);
    }
    setIsProcessingBatch(false);
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <MagicWandIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Watermark<span className="font-light text-indigo-400">Remover</span>
                </h1>
            </div>
            
            <div className="flex items-center gap-4">
               {tasks.length > 0 && (
                   <button 
                    onClick={processBatch}
                    disabled={isProcessingBatch || tasks.every(t => t.status === ProcessStatus.COMPLETED)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium transition-all shadow-lg
                        ${isProcessingBatch 
                            ? 'bg-slate-700 text-slate-400 cursor-wait' 
                            : tasks.every(t => t.status === ProcessStatus.COMPLETED)
                                ? 'bg-slate-800 text-slate-500 cursor-default'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/25'
                        }
                    `}
                   >
                     {isProcessingBatch ? (
                        <>
                            <RefreshIcon className="w-4 h-4 animate-spin" />
                            Processing...
                        </>
                     ) : (
                        <>
                            <MagicWandIcon className="w-4 h-4" />
                            Process All Images
                        </>
                     )}
                   </button>
               )}
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex gap-8">
        
        {/* Left Sidebar: Upload & Task List */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-6">
            <div className="flex-shrink-0">
                <Dropzone onFilesAdded={handleFilesAdded} disabled={isProcessingBatch} />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-3">
                {tasks.length === 0 && (
                    <div className="text-center text-slate-500 py-10 border border-dashed border-slate-800 rounded-xl">
                        <p className="text-sm">No images yet</p>
                    </div>
                )}
                
                {tasks.map(task => (
                    <div 
                        key={task.id}
                        onClick={() => setActiveTaskId(task.id)}
                        className={`
                            relative group p-3 rounded-xl border cursor-pointer transition-all
                            ${activeTaskId === task.id 
                                ? 'bg-slate-800 border-indigo-500 shadow-md' 
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }
                        `}
                    >
                        <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-lg bg-slate-950 overflow-hidden flex-shrink-0 border border-slate-800 relative">
                                <img src={task.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                {task.status === ProcessStatus.COMPLETED && (
                                    <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center backdrop-blur-[1px]">
                                        <CheckCircleIcon className="w-6 h-6 text-white drop-shadow-md" />
                                    </div>
                                )}
                                {task.status === ProcessStatus.PROCESSING && (
                                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[1px]">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                                {task.status === ProcessStatus.ERROR && (
                                    <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center backdrop-blur-[1px]">
                                        <ExclamationCircleIcon className="w-6 h-6 text-red-400 drop-shadow-md" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className="text-sm font-medium text-slate-200 truncate">{task.file.name}</h4>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-slate-500">{formatFileSize(task.file.size)}</span>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded
                                        ${task.status === ProcessStatus.COMPLETED ? 'bg-indigo-900/50 text-indigo-300' : 
                                          task.status === ProcessStatus.PROCESSING ? 'bg-blue-900/50 text-blue-300' :
                                          task.status === ProcessStatus.ERROR ? 'bg-red-900/50 text-red-300' :
                                          'bg-slate-800 text-slate-500'}
                                    `}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                            className="absolute -top-2 -right-2 p-1.5 bg-slate-800 text-slate-400 hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-slate-700"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Content: Workspace */}
        <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 p-6 flex flex-col relative overflow-hidden">
            {!activeTask ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                        <MagicWandIcon className="w-10 h-10 opacity-50" />
                    </div>
                    <p className="text-lg">Select an image to start processing</p>
                </div>
            ) : (
                <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-6">
                         <h2 className="text-xl font-semibold text-white truncate max-w-lg">
                            {activeTask.status === ProcessStatus.COMPLETED ? "Result Comparison" : "Preview"}
                        </h2>
                        
                        {activeTask.status === ProcessStatus.IDLE || activeTask.status === ProcessStatus.ERROR ? (
                            <button 
                                onClick={() => processTask(activeTask)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20"
                            >
                                Remove Watermark
                            </button>
                        ) : activeTask.status === ProcessStatus.PROCESSING ? (
                             <span className="text-indigo-400 flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                Inpainting...
                             </span>
                        ) : null}
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col justify-center">
                        {activeTask.status === ProcessStatus.COMPLETED && activeTask.processedUrl ? (
                            <ComparisonView 
                                originalUrl={activeTask.originalUrl}
                                processedUrl={activeTask.processedUrl}
                                filename={activeTask.file.name}
                            />
                        ) : (
                            <div className="relative w-full h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                                <img 
                                    src={activeTask.originalUrl} 
                                    alt="Original" 
                                    className="max-w-full max-h-full object-contain"
                                />
                                {activeTask.status === ProcessStatus.ERROR && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg backdrop-blur-md text-sm">
                                        Error: {activeTask.error || "Failed to process"}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default App;