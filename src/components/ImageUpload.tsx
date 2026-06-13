import React, { useState, useRef } from 'react';
import { Upload, FileImage, ShieldAlert, Image, RefreshCw, Sparkles } from 'lucide-react';
import { PredictionItem } from '../types';

interface ImageUploadProps {
  onPredictionSuccess: (item: PredictionItem) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  geminiMissing: boolean;
}

export default function ImageUpload({
  onPredictionSuccess,
  isLoading,
  setIsLoading,
  geminiMissing
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New HTR/OCR mode for uploaded elements
  const [uploadMode, setUploadMode] = useState<'alphabet' | 'word' | 'sentence' | 'document'>('document');

  // File loading helper
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Invalid file type. Please upload a standard image file (PNG, JPG, BMP).');
      return;
    }

    setFileName(file.name);
    // Express size in KB
    setFileSizeStr(`${(file.size / 1024).toFixed(1)} KB`);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setSelectedImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Triggers predict route on backend
  const handleInferImage = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          mode: uploadMode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Server classification error');
      }

      onPredictionSuccess(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed connecting to server classification system.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setFileName('');
    setFileSizeStr('');
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div id="image-upload-module" className="flex flex-col gap-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_0.5px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

      {/* Upload mode selection buttons */}
      <div className="grid grid-cols-4 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800/80 z-10">
        <button
          type="button"
          onClick={() => setUploadMode('alphabet')}
          className={`py-1.5 px-2 text-[10px] font-bold rounded-xl transition-all ${
            uploadMode === 'alphabet' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Character
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('word')}
          className={`py-1.5 px-2 text-[10px] font-bold rounded-xl transition-all ${
            uploadMode === 'word' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Word
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('sentence')}
          className={`py-1.5 px-2 text-[10px] font-bold rounded-xl transition-all ${
            uploadMode === 'sentence' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Sentence
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('document')}
          className={`py-1.5 px-2 text-[10px] font-bold rounded-xl transition-all ${
            uploadMode === 'document' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Full Scan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 z-10 w-full">
        {/* Main Upload Dropzone Frame */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex flex-col">
            <h3 className="text-md font-semibold text-slate-100 flex items-center gap-2">
              <FileImage className="h-4.5 w-4.5 text-indigo-400" />
              Image Scanner Vault
            </h3>
            <p className="text-xs text-slate-400">Import high-contrast handwriting snapshots, scanned pages or line layouts</p>
          </div>

          {!selectedImage ? (
            <div
              id="drop-target"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square w-full max-w-[420px] mx-auto border-2 border-dashed border-slate-700 bg-slate-950 hover:border-indigo-600 hover:bg-slate-950/40 rounded-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all"
            >
              <input
                id="file-selector"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <Upload className="h-10 w-10 text-slate-500 mb-3 animate-pulse" />
              <span className="text-sm font-semibold text-slate-200 block mb-1">Drag and drop file here</span>
              <span className="text-xs text-slate-400 mb-4 block">or tap to browse local storage</span>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
                PNG, JPG, BMP, JPEG (MAX 10MB)
              </div>
            </div>
          ) : (
            <div className="relative aspect-square w-full max-w-[420px] mx-auto bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all">
              <img
                src={selectedImage}
                alt="Handwritten entry"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={clearSelection}
                className="absolute top-4 right-4 px-3 py-2 text-xs font-mono font-bold bg-slate-950/90 hover:bg-rose-950/80 text-rose-400 rounded-xl border border-slate-800 transition-colors shadow-lg"
              >
                Clear Snapshot
              </button>
            </div>
          )}
        </div>

      {/* Upload Telemetry Column */}
      <div className="md:col-span-4 flex flex-col justify-between gap-5 bg-slate-950/40 p-4 border border-slate-800/70 rounded-xl z-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Image className="h-4 w-4 text-emerald-400" />
              Ingestion Diagnostics
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
              Character segments undergo bounding rectangle extraction and normalization before matching.
            </p>
          </div>

          {selectedImage ? (
            <div className="space-y-3 font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-900 leading-normal">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase">File Label:</span>
                <span className="truncate text-indigo-400 mb-2">{fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Weight:</span>
                <span>{fileSizeStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Engine segment:</span>
                <span>Adaptive Global</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-955/50 border border-slate-850 rounded-lg text-slate-500 text-xs">
              <Sparkles className="h-5 w-5 text-indigo-550 shrink-0" />
              <span>Select an image to view diagnostic parsing properties.</span>
            </div>
          )}
        </div>

        {/* Prediction Execution Buttons */}
        <div className="flex flex-col gap-3">
          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-900/60 rounded-xl text-xs text-rose-300 font-mono">
              <div className="font-bold uppercase mb-1 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                OCR Error:
              </div>
              {errorMsg}
            </div>
          )}

          {geminiMissing && (
            <div className="p-3 bg-amber-950/40 border border-amber-900/50 rounded-xl text-[11px] text-amber-300 leading-normal font-mono">
              <div className="font-bold uppercase">No Key Detected:</div>
              Add <strong className="text-white">GEMINI_API_KEY</strong> under Settings &gt; Secrets to process scans.
            </div>
          )}

          <button
            id="btn-infer-image"
            type="button"
            onClick={handleInferImage}
            disabled={isLoading || !selectedImage || geminiMissing}
            className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all text-sm ${
              !selectedImage || geminiMissing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-550 active:scale-[0.98] text-white shadow-lg active:shadow-none shadow-indigo-600/20'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                Scanning Image...
              </>
            ) : (
              <>
                <Upload className="h-4.5 w-4.5" />
                Analyze Image Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}
