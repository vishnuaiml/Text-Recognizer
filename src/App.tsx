import React, { useState, useEffect } from 'react';
import { 
  History, Calendar, LayoutDashboard, Square, Clock, 
  HelpCircle, ChevronRight, PenTool, Image, Sparkles, 
  RefreshCw, CheckCircle2, ShieldAlert, BookOpen, AlertTriangle 
} from 'lucide-react';
import DrawingCanvas from './components/DrawingCanvas';
import ImageUpload from './components/ImageUpload';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PredictionHistory from './components/PredictionHistory';
import { PredictionItem, ModelStats } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'canvas' | 'upload' | 'analytics' | 'history'>('canvas');
  const [history, setHistory] = useState<PredictionItem[]>([]);
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Health states
  const [geminiMissing, setGeminiMissing] = useState<boolean>(false);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(true);

  // Fetch full telemetry logs & analytics metrics from backend Express API
  const fetchTelemetry = async () => {
    try {
      // Reload History logs
      const historyRes = await fetch('/api/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }

      // Reload Analytics metrics
      const statsRes = await fetch('/api/analytics');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed bringing backend stats', err);
    }
  };

  // Perform startup checks to see if GEMINI_API_KEY is loaded in Sandbox Secrets
  useEffect(() => {
    const runHealthCheck = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setGeminiMissing(!data.geminiConfigured);
        } else {
          // If server failed or hasn't booted fully yet, let's treat it as placeholder
          setGeminiMissing(false);
        }
      } catch (e) {
        // Assume key could be missing
        setGeminiMissing(false);
      } finally {
        setCheckingHealth(false);
      }
    };

    runHealthCheck();
    fetchTelemetry();
  }, []);

  const handlePredictionSuccess = (prediction: PredictionItem) => {
    setCurrentPrediction(prediction);
    // Automatically fetch and refresh general dashboard telemetry logs
    fetchTelemetry();
  };

  const clearHistoryDB = async () => {
    try {
      const res = await fetch('/api/history/clear', { method: 'POST' });
      if (res.ok) {
        setHistory([]);
        setCurrentPrediction(null);
        fetchTelemetry();
      }
    } catch (e) {
      console.error('Failed to flush history logs', e);
    }
  };

  // Compute AI structural tutor summary explaining character topology based on physical guidelines
  const getAIShapeExplanation = (item: PredictionItem) => {
    if (item.predictedText && item.predictedText.length > 2) {
      const wordsCount = item.predictedText.trim().split(/\s+/).length;
      const linesCount = item.analytics.linesDetected || 1;
      return `HTR Sequence Model successfully decoded ${wordsCount} word${wordsCount > 1 ? 's' : ''} across ${linesCount} line${linesCount > 1 ? 's' : 'baskets'} with deep temporal alignment. Preprocessing optimized word boundaries and slant trajectories before passing embeddings to sequence decoder paths.`;
    }

    const char = item.predictedCharacter;
    const isDigit = item.characterType === 'digit';
    
    const strokeDesc = item.analytics.strokeCount === 1 
      ? "written in a single continuous brushstroke"
      : `drawn in ${item.analytics.strokeCount} distinct strokes`;

    const symmetryDesc = item.analytics.symmetryScore > 85 
      ? "exceptional geometric symmetry"
      : item.analytics.symmetryScore > 70
        ? "moderate balanced symmetry"
        : "free-form asymmetrical contours";

    const slantDesc = Math.abs(item.analytics.tiltAngle) < 3
      ? "nearly perfect vertical alignment"
      : item.analytics.tiltAngle > 0
        ? `a rightward slant of ${item.analytics.tiltAngle}°`
        : `a leftward slant of ${Math.abs(item.analytics.tiltAngle)}°`;

    // High fidelity feedback based on alphabetical glyph families
    const alphabetExplanations: Record<string, string> = {
      'A': "The shape converges towards an apex with a central horizontal stroke balancing the left-to-right slant lines.",
      'B': "Character presents a primary left vertical anchor stem accompanied by dual protruding rounded loops in standard ratio.",
      'C': "Symmetrical clockwise lateral contour with an open rightward face.",
      'D': "Presents a vertical baseline paired with a single expanded rightward loop representing a terminal closed enclosure.",
      'E': "Formed by a vertical spine holding three perpendicular horizontal strokes, exhibiting high grid symmetry scores.",
      'H': "Consists of dual parallel vertical upright columns bridged by a central horizontal connector rod.",
      'O': "Symmetrical closed circular outline showing low noise density profile.",
      'M': "The profile shows dual steep outer columns with a central descending peak, forming high-contrast local minima.",
      'S': "Presents dual alternating curves replicating a smooth sinusoidal outline.",
      'X': "Character has dual intersecting diagonals crossing centrally.",
      '7': "Presents a horizontal top bar combined with a sleek continuous diagonal running to the lower left.",
      '3': "Exhibits dual horizontal-facing loops open towards the left with a middle inflection point.",
      '0': "Form is a vertically elongated continuous oval loop, easily distinguishable from the wider general letter O outline."
    };

    const glyphDetail = alphabetExplanations[char] || "The canvas exhibits clean edge borders with high pixel compactness and consistent line contours.";

    return `${isDigit ? 'Digit' : 'Alpha Letter'} "${char}" was determined with ${item.confidence}% confidence. It is ${strokeDesc} displaying ${symmetryDesc} and ${slantDesc}. Preprocessing reveals ${glyphDetail}`;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-205 flex flex-col font-sans select-none pb-12 p-6 space-y-6">
      {/* Dynamic Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 w-10 h-10 shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>SmartOCR</span>
              <span className="text-indigo-400">AI</span>
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Handwritten Text Recognition & OCR</p>
          </div>
        </div>

        {/* Quick Stats pills / Model Info in Header inline with the Bento spec */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-800/50 px-3.5 py-1.5 rounded-full border border-slate-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-mono text-emerald-400">Model: CNN-V4.2 (Active)</span>
          </div>

          {stats && (
            <>
              <div className="bg-slate-800/50 px-3.5 py-1.5 rounded-full border border-slate-700 text-xs font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#4f46e5] rounded-full inline-block" />
                <span className="text-slate-400">Total:</span> 
                <strong className="text-slate-200">{stats.totalPredictions}</strong>
              </div>
              <div className="bg-slate-800/50 px-3.5 py-1.5 rounded-full border border-slate-700 text-xs font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block animate-pulse" />
                <span className="text-slate-400">Accuracy:</span> 
                <strong className="text-teal-400">{stats.accuracyRate}%</strong>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Workspace Frame configured for a professional Bento Grid mapping */}
      <main className="max-w-7xl mx-auto mt-2 flex-grow w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core Controls Dashboard - Left Side column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Navigation Tabs - Bento style capsule menu */}
          <div className="flex bg-slate-800/40 p-1.5 rounded-3xl border border-slate-700 text-sm shadow-md">
            <button
              id="tab-canvas"
              type="button"
              onClick={() => { setActiveTab('canvas'); }}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'canvas' 
                  ? 'bg-indigo-650 text-slate-100 shadow-lg shadow-indigo-600/10 border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <PenTool className="h-4 w-4" />
              <span>Drawing Board</span>
            </button>
            <button
              id="tab-upload"
              type="button"
              onClick={() => { setActiveTab('upload'); }}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'upload' 
                  ? 'bg-indigo-650 text-slate-100 shadow-lg shadow-indigo-600/10 border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Image className="h-4 w-4" />
              <span>Image Scanner</span>
            </button>
            <button
              id="tab-analytics"
              type="button"
              onClick={() => { setActiveTab('analytics'); }}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-indigo-650 text-slate-100 shadow-lg shadow-indigo-600/10 border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Network Analytics</span>
            </button>
            <button
              id="tab-history"
              type="button"
              onClick={() => { setActiveTab('history'); }}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'history' 
                  ? 'bg-indigo-650 text-slate-100 shadow-lg shadow-indigo-600/10 border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <History className="h-4 w-4" />
              <span>History Logs</span>
            </button>
          </div>

          {/* Active Tab Screen Content wrapper */}
          <div className="min-h-[460px]">
            {activeTab === 'canvas' && (
              <DrawingCanvas
                onPredictionSuccess={handlePredictionSuccess}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                geminiMissing={geminiMissing}
              />
            )}

            {activeTab === 'upload' && (
              <ImageUpload
                onPredictionSuccess={handlePredictionSuccess}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                geminiMissing={geminiMissing}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                stats={stats}
                onRefresh={fetchTelemetry}
              />
            )}

            {activeTab === 'history' && (
              <PredictionHistory
                history={history}
                onRefresh={fetchTelemetry}
                isLoading={isLoading}
                onClearHistory={clearHistoryDB}
              />
            )}
          </div>
        </div>

        {/* Dynamic Prediction Results Monitor panel - Right Side column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-start min-h-[550px]">
            {/* Blueprint grid layout lines style */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_0.5px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 z-10">
              <h2 className="text-lg font-bold text-slate-100">Live Prediction</h2>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Real-time</span>
            </div>

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10">
                <div className="relative h-14 w-14 flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-20" />
                  <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-slate-200">Pre-processing Stroke Vectors</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Filtering noise borders, mapping aspect ratios, and feeding matrix to Gemini model server...
                  </p>
                </div>
              </div>
            ) : currentPrediction ? (
              <div className="space-y-6 z-10 flex-grow flex flex-col justify-between">
                
                {/* Visual Grid Card showing recognized Character */}
                <div className="flex-grow flex flex-col items-center justify-center py-6 bg-slate-900/60 border border-slate-700/50 rounded-2xl relative overflow-hidden">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">DECODED OUTPUT MATCH</span>
                  
                  {(() => {
                    const text = currentPrediction.predictedText || currentPrediction.predictedCharacter;
                    if (text.length <= 1) {
                      return (
                        <span className="text-[110px] font-black text-indigo-400 leading-none filter drop-shadow-[0_0_15px_rgba(129,140,248,0.25)] select-none uppercase block my-2 font-sans">
                          {text}
                        </span>
                      );
                    } else if (text.length <= 8) {
                      return (
                        <span className="text-4xl font-extrabold text-indigo-400 tracking-tight leading-normal filter drop-shadow-[0_0_10px_rgba(129,140,248,0.2)] select-none uppercase block my-4 px-3 text-center break-all font-sans">
                          {text}
                        </span>
                      );
                    } else if (text.length <= 25) {
                      return (
                        <span className="text-2xl font-bold text-indigo-300 tracking-tight leading-relaxed filter drop-shadow-[0_0_8px_rgba(129,140,248,0.15)] select-none block my-5 px-4 text-center break-words font-sans">
                          "{text}"
                        </span>
                      );
                    } else {
                      return (
                        <div className="max-h-[140px] overflow-y-auto my-3 px-5 text-center text-indigo-200 text-sm font-medium leading-relaxed break-words font-mono bg-slate-950/40 py-2 border border-slate-800 rounded-xl w-[90%] font-sans">
                          "{text}"
                        </div>
                      );
                    }
                  })()}
                  
                  {/* Confidence pill scale */}
                  <div className="bg-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-bold border border-indigo-500/30 font-mono mt-1">
                    {currentPrediction.confidence}% Confidence
                  </div>
                </div>

                {/* Sub Predictions probability barcharts list */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase">Class Probability Nodes:</h3>
                  <div className="space-y-3">
                    {currentPrediction.topPredictions && currentPrediction.topPredictions.length > 1 ? (
                      currentPrediction.topPredictions.slice(1, 4).map((pred, i) => {
                        const probPercent = Math.round(pred.probability * 100);
                        return (
                          <div key={i} className="flex items-center text-xs">
                            <span className="w-12 font-mono text-slate-400 truncate text-[11px]">{pred.character}</span>
                            <div className="flex-grow h-2 bg-slate-700/60 rounded-full mx-3 overflow-hidden">
                              <div 
                                className="h-full bg-slate-500 rounded-full transition-all duration-350"
                                style={{ width: `${probPercent}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold w-10 text-right">{probPercent}%</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[11px] font-mono text-slate-500 italic">
                        Sequence prediction utilizes full-token decoding state
                      </div>
                    )}
                  </div>
                </div>

                {/* Processing times performance speeds */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-450 leading-normal">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <div>
                      <span>Preprocessing:</span>
                      <strong className="text-slate-200 block">{currentPrediction.analytics.preprocessingTimeMs}ms</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <div>
                      <span>Inference latency:</span>
                      <strong className="text-emerald-450 block">
                        {currentPrediction.analytics.inferenceTimeMs < 1000 
                          ? `${currentPrediction.analytics.inferenceTimeMs}ms` 
                          : `${(currentPrediction.analytics.inferenceTimeMs / 1000).toFixed(2)}s`}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Academic Shape AI Explanation comment bubble */}
                <div className="border border-slate-750 bg-indigo-950/20 p-3.5 rounded-xl flex gap-3 text-xs leading-relaxed text-indigo-200">
                  <BookOpen className="h-5 w-5 text-indigo-400 shrink-0 self-start mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-indigo-300">AI Explanatory Heuristics</h4>
                    <p className="text-[11px] leading-normal">{getAIShapeExplanation(currentPrediction)}</p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-3 text-slate-500 z-10">
                <HelpCircle className="h-10 w-10 text-indigo-400/50 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300">Awaiting Ingestion Stream</p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Sketch a segment on the Drawing Board or upload an image and press 'Run Sequence Decoders' to compile deep visual details.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Styled Footer inline with Bento constraints */}
      <footer className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-800 pt-6">
        <div className="flex space-x-6">
          <span>Session ID: <span className="text-slate-300 font-mono">SS-8821-X</span></span>
          <span>Runtime: <span className="text-slate-300 font-mono">Cloud Run NodeJS</span></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Connected to local inference engine</span>
        </div>
      </footer>
    </div>
  );
}
