import React, { useRef, useState, useEffect } from 'react';
import { Square, Undo2, Eraser, PenTool, Flame, RefreshCw, Layers } from 'lucide-react';
import { PredictionItem } from '../types';

interface DrawingCanvasProps {
  onPredictionSuccess: (item: PredictionItem) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  geminiMissing: boolean;
}

export default function DrawingCanvas({
  onPredictionSuccess,
  isLoading,
  setIsLoading,
  geminiMissing
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<number>(12);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [strokeCount, setStrokeCount] = useState<number>(0);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Expanded HTR Modes
  const [htrMode, setHtrMode] = useState<'alphabet' | 'word' | 'sentence'>('word');

  // Grid Guideline overlays
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Dynamic canvas dimension sizing
  const getCanvasWidth = () => {
    return htrMode === 'alphabet' ? 400 : htrMode === 'word' ? 600 : 800;
  };
  const getCanvasHeight = () => {
    return 400;
  };

  // Re-initialize Canvas when mode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Keep initial empty state
    setUndoStack([canvas.toDataURL()]);
    setStrokeCount(0);
    updateDownscaledPreview();
  }, [htrMode]);

  // Sync / Real-time downscaling simulation: compiles canvas data down to low-res grid
  const updateDownscaledPreview = () => {
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    if (!canvas || !preview) return;

    const canvasCtx = canvas.getContext('2d');
    const previewCtx = preview.getContext('2d');
    if (!canvasCtx || !previewCtx) return;

    // 1. Core OCR computer vision trick: extract pixel bounding box to auto-center character
    const imgData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;
    let foundAny = false;

    // Find non-white pixel bounds
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        // Dark grey or black threshold
        if (r < 220 || g < 220 || b < 220) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          foundAny = true;
        }
      }
    }

    // Clean preview
    previewCtx.fillStyle = '#111827'; // Dark background for visual grid
    previewCtx.fillRect(0, 0, preview.width, preview.height);

    if (!foundAny) {
      drawGridNodes(previewCtx, preview.width, preview.height);
      return;
    }

    const padding = 15;
    const imgW = maxX - minX + padding * 2;
    const imgH = maxY - minY + padding * 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imgW;
    tempCanvas.height = imgH;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, imgW, imgH);

      tempCtx.drawImage(
        canvas,
        minX, minY, maxX - minX, maxY - minY,
        padding, padding, maxX - minX, maxY - minY
      );

      // Downsample directly to 60x24 aspect box for words/sentences, or 28x28 for single characters
      previewCtx.imageSmoothingEnabled = false;
      const targetW = htrMode === 'alphabet' ? 28 : 56;
      const targetH = htrMode === 'alphabet' ? 28 : 28;
      previewCtx.drawImage(tempCanvas, 0, 0, imgW, imgH, 0, 0, targetW, targetH);

      // Apply standard HTR binarization channel map
      const previewImgData = previewCtx.getImageData(0, 0, preview.width, preview.height);
      const pPixels = previewImgData.data;
      for (let i = 0; i < pPixels.length; i += 4) {
        const r = pPixels[i];
        const g = pPixels[i + 1];
        const b = pPixels[i + 2];
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const intensity = 255 - gray;

        pPixels[i] = 16;       // Red (almost black)
        pPixels[i + 1] = Math.min(255, intensity * 1.5 + 30); // Vibrant green sequence trace
        pPixels[i + 2] = 20;   // Blue
        pPixels[i + 3] = 255;  // Alpha
      }
      previewCtx.putImageData(previewImgData, 0, 0);
    }
  };

  const drawGridNodes = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#22c55e20';
    ctx.lineWidth = 0.5;
    const interval = htrMode === 'alphabet' ? 2 : 4;
    for (let x = 0; x < w; x += interval) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += interval) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL();
    setUndoStack(prev => {
      const next = [...prev, url];
      if (next.length > 12) next.shift();
      return next;
    });
  };

  // Drawing event handlers
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || isLoading) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveState();
    setIsDrawing(true);
    setStrokeCount(v => v + 1);

    const coords = getEventCoords(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = isEraser ? '#FFFFFF' : '#000000';

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isLoading) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getEventCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    updateDownscaledPreview();
  };

  const handleStopDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      updateDownscaledPreview();
    }
  };

  const getEventCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) {
      handleClear();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousStates = [...undoStack];
    previousStates.pop();
    const previousStateUrl = previousStates[previousStates.length - 1];

    const img = new Image();
    img.src = previousStateUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setUndoStack(previousStates);
      setStrokeCount(Math.max(0, strokeCount - 1));
      updateDownscaledPreview();
    };
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setStrokeCount(0);
    setUndoStack([canvas.toDataURL()]);
    setErrorMsg(null);
    updateDownscaledPreview();
  };

  const handlePredictSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const dataUrl = canvas.toDataURL('image/png');

      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataUrl,
          mode: htrMode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Server error recognizing sketch.');
      }

      onPredictionSuccess(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error occurred connecting to character class server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="canvas-module" className="flex flex-col gap-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_0.5px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

      {/* Mode selectors */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800/85 z-10">
        <button
          type="button"
          onClick={() => setHtrMode('alphabet')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            htrMode === 'alphabet' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Single Character
        </button>
        <button
          type="button"
          onClick={() => setHtrMode('word')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            htrMode === 'word' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Whole Word
        </button>
        <button
          type="button"
          onClick={() => setHtrMode('sentence')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            htrMode === 'sentence' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Full Sentence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 z-10 w-full">
        {/* Stage Container */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Active Canvas Size: {getCanvasWidth()}x{getCanvasHeight()} px
            </span>
            <span>Stroke count: <b className="text-indigo-400">{strokeCount}</b></span>
          </div>

          <div className="relative w-full overflow-x-auto overflow-y-hidden bg-white border border-slate-800 rounded-3xl shadow-xl py-4 flex items-center justify-center">
            <div 
              style={{ width: `${getCanvasWidth()}px`, height: `${getCanvasHeight()}px` }}
              className="relative shrink-0 select-none bg-white border border-slate-100 shadow-md rounded-2xl overflow-hidden transition-all duration-300"
            >
              <canvas
                id="drawing-surface"
                ref={canvasRef}
                width={getCanvasWidth()}
                height={getCanvasHeight()}
                onMouseDown={handleStartDraw}
                onMouseMove={handleDraw}
                onMouseUp={handleStopDraw}
                onMouseLeave={handleStopDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleDraw}
                onTouchEnd={handleStopDraw}
                className="w-full h-full cursor-crosshair touch-none select-none"
              />

              {showGrid && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                  {htrMode === 'alphabet' ? (
                    <>
                      <div className="w-[85%] h-[85%] border border-dashed border-indigo-500/10 rounded-lg absolute inset-0 m-auto" />
                      <div className="absolute border-t border-slate-200/50 w-full top-1/2 left-0" />
                      <div className="absolute border-l border-slate-200/50 h-full left-1/2 top-0" />
                      <span className="absolute bottom-2 left-2 text-[9px] font-mono text-slate-400">CENTER CHARACTER</span>
                    </>
                  ) : (
                    <>
                      <div className="w-full h-full relative flex flex-col justify-center">
                        <div className="border-t-2 border-slate-300/35 w-full border-dashed" />
                        <span className="absolute bottom-2 left-4 text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none">Cursive Baseline Guide</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Painter Control Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEraser(false)}
                className={`p-2.5 rounded-xl transition-all ${
                  !isEraser ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Ink Tip"
              >
                <PenTool className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEraser(true)}
                className={`p-2.5 rounded-xl transition-all ${
                  isEraser ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Eraser Tip"
              >
                <Eraser className="h-4.5 w-4.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`px-3 py-2 text-xs font-mono font-bold rounded-xl transition-all ${
                  showGrid ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/35' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Grid lines
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Weight:</span>
              <input
                type="range"
                min={htrMode === 'alphabet' ? 14 : 6}
                max={28}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 md:w-28 accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
              />
              <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-400">{brushSize}px</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                className="p-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/50 rounded-xl"
                title="Undo last Stroke"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-2.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-rose-400 rounded-xl"
                title="Clear Slate"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Model Vision sidebar */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-5 bg-slate-950/50 p-5 border border-slate-800 rounded-3xl">
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest flex items-center gap-2">
                <Layers className="h-4 w-4" /> CV PREPROCESSING
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Segmented and normalized binary array feeds mimicking CRNN spatial inputs.
              </p>
            </div>

            <div className="flex flex-col items-center p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
              <div 
                className={`relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center ${
                  htrMode === 'alphabet' ? 'w-24 h-24' : 'w-48 h-16'
                }`}
              >
                <canvas
                  ref={previewRef}
                  width={htrMode === 'alphabet' ? 28 : 56}
                  height={htrMode === 'alphabet' ? 28 : 28}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-emerald-950/90 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded leading-none uppercase">
                  {htrMode === 'alphabet' ? "28x28 Map" : "56x28 Seq Map"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full mt-4 text-[10px] text-slate-400 font-mono border-t border-slate-700/40 pt-3">
                <div>
                  <span className="text-slate-500 block">Denoise steps:</span>
                  <span className="text-slate-300">OpenCV Gaussian</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Normalizer:</span>
                  <span className="text-slate-300">Aspect Maximize</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-[11px] text-slate-300 font-mono leading-relaxed">
              <div className="font-bold border-b border-slate-800 pb-1.5 text-indigo-400 flex items-center justify-between uppercase">
                <span>Pipeline Stage</span>
                <span className="text-emerald-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span>1. Grey Scale Map</span>
                <span className="text-slate-500">Completed</span>
              </div>
              <div className="flex justify-between">
                <span>2. Otsu thresholding</span>
                <span className="text-slate-500">Self-calibrating</span>
              </div>
              <div className="flex justify-between">
                <span>{htrMode === 'alphabet' ? "3. Bounding Boxes" : "3. CTC Sequence Map"}</span>
                <span className="text-slate-500">Binarized</span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-2xl text-[11px] text-rose-300 leading-normal font-mono">
                <span className="font-bold block uppercase">Segmentation Error:</span>
                {errorMsg}
              </div>
            )}

            {geminiMissing && (
              <div className="p-3 bg-amber-950/40 border border-amber-900/50 rounded-2xl text-[11px] text-amber-300 leading-normal font-mono">
                <span className="font-bold block uppercase">Gemini key missing:</span>
                Insert <code className="text-white bg-slate-950 px-1 rounded font-bold">GEMINI_API_KEY</code> token to begin scanning.
              </div>
            )}

            <button
              type="button"
              onClick={handlePredictSubmit}
              disabled={isLoading || strokeCount === 0 || geminiMissing}
              className={`w-full py-4 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm uppercase ${
                strokeCount === 0 || geminiMissing
                  ? 'bg-slate-850 text-slate-600 border border-slate-800 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-650 text-white shadow-lg active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Predicting writing...
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4 text-amber-400 animate-pulse animate-duration-1000" />
                  Run Sequence Decoders
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
