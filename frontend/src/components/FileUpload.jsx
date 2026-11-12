import React, { useRef, useState } from 'react';
import { UploadCloud, File, X, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';

export default function FileUpload({
  files,
  setFiles,
  accept = '.pdf',
  multiple = false,
  minFiles = 1,
  title = 'Select or drop files here'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (newFiles) => {
    if (multiple) {
      setFiles((prev) => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles.slice(0, 1));
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= files.length) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIdx];
    newFiles[targetIdx] = temp;
    setFiles(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
          <UploadCloud className="w-8 h-8" />
        </div>

        <p className="font-semibold text-slate-800 text-base sm:text-lg mb-1 text-center">
          {title}
        </p>
        <p className="text-slate-400 text-xs text-center max-w-sm">
          Drag and drop files here, or click to browse. Accepted: {accept.replace(/,/g, ', ')}
        </p>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-2 pb-1 border-b border-slate-100">
            <span>Uploaded Files ({files.length})</span>
            {multiple && files.length > 1 && <span>Order matters for merge</span>}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center flex-shrink-0 font-medium text-xs">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {multiple && files.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveFile(idx, -1);
                        }}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200 transition"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveFile(idx, 1);
                        }}
                        disabled={idx === files.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200 transition"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
