import React, { useState } from 'react';
import { 
  History, Calendar, Hash, ArrowUpDown, Trash2, 
  Sparkles, CheckSquare, RefreshCw, SlidersHorizontal, Scale, Eye 
} from 'lucide-react';
import { PredictionItem } from '../types';

interface PredictionHistoryProps {
  history: PredictionItem[];
  onRefresh: () => void;
  isLoading: boolean;
  onClearHistory: () => void;
}

export default function PredictionHistory({
  history,
  onRefresh,
  isLoading,
  onClearHistory
}: PredictionHistoryProps) {
  const [filterType, setFilterType] = useState<'all' | 'digit' | 'alphabet' | 'word' | 'sentence' | 'document'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'confidence' | 'oldest'>('newest');
  
  // Correction modal / dropdown controls
  const [correctingItemId, setCorrectingItemId] = useState<string | null>(null);
  const [correctionInput, setCorrectionInput] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
  const [selectedInspectItem, setSelectedInspectItem] = useState<PredictionItem | null>(null);

  // Submit actual label back to database
  const handleFeedbackSubmit = async (id: string) => {
    if (!correctionInput.trim()) return;
    setSubmittingFeedback(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          feedbackActual: correctionInput.trim()
        })
      });
      if (response.ok) {
        onRefresh();
        setCorrectingItemId(null);
        setCorrectionInput('');
      } else {
        alert('Failed saving correction.');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting correction endpoint.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Filter history
  const filteredHistory = history
    .filter(item => {
      if (filterType === 'all') return true;
      return item.characterType === filterType;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortBy === 'confidence') {
        return b.confidence - a.confidence;
      }
      return 0;
    });

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4.5 w-4.5 text-indigo-400" />
          <span className="text-xs font-mono text-slate-300 tracking-wider">FILTERING CHANNELS:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Type */}
          <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-850 text-xs gap-1">
            <button
              id="filter-all"
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'all' ? 'bg-indigo-650 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              id="filter-digits"
              type="button"
              onClick={() => setFilterType('digit')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'digit' ? 'bg-indigo-650 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Digits
            </button>
            <button
              id="filter-alphabets"
              type="button"
              onClick={() => setFilterType('alphabet')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'alphabet' ? 'bg-indigo-650 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Alphabets
            </button>
            <button
              id="filter-words"
              type="button"
              onClick={() => setFilterType('word')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'word' ? 'bg-indigo-650 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Words
            </button>
            <button
              id="filter-sentences"
              type="button"
              onClick={() => setFilterType('sentence')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'sentence' ? 'bg-indigo-650 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sentences
            </button>
            <button
              id="filter-documents"
              type="button"
              onClick={() => setFilterType('document')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'document' ? 'bg-indigo-650 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Pages
            </button>
          </div>

          {/* Sorters */}
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-850 text-xs text-slate-400">
            <ArrowUpDown className="h-3.5 w-3.5 text-indigo-400" />
            <select
              id="sorter-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs"
            >
              <option value="newest" className="bg-slate-950">Newest First</option>
              <option value="oldest" className="bg-slate-950">Oldest First</option>
              <option value="confidence" className="bg-slate-950">Highest Confidence</option>
            </select>
          </div>

          {/* Refresh & Clear Trigger */}
          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-history"
              type="button"
              onClick={onRefresh}
              className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/50 transition-colors"
              title="Reload catalog"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="btn-clear-history"
              type="button"
              onClick={() => {
                if (confirm('Flush entire handwriting log database? This action is permanent!')) {
                  onClearHistory();
                }
              }}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-900/45 rounded-xl text-xs font-mono flex items-center gap-1"
              title="Wipe database"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Flush Logs
            </button>
          </div>
        </div>
      </div>

      {/* History Cards Deck */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-6 text-slate-500">
          <History className="h-10 w-10 text-slate-700 mx-auto mb-4 animate-bounce" />
          <h4 className="text-md font-semibold text-slate-400">History Log Empty</h4>
          <p className="text-xs text-slate-500 mt-1">Submit sketches on the Drawing Board or Uploads to fill historical catalogs.</p>
        </div>
      ) : (
        <div id="history-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHistory.map((item) => {
            const hasText = !!item.predictedText;
            const fullDisplay = item.predictedText || item.predictedCharacter;
            const isCorrect = item.feedbackActual ? fullDisplay.trim().toUpperCase() === item.feedbackActual.trim().toUpperCase() : null;

            return (
              <div 
                key={item.id} 
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-slate-700 transition-all"
              >
                {/* Visual side bar tag */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  isCorrect === true
                    ? 'bg-emerald-500'
                    : isCorrect === false
                      ? 'bg-rose-500'
                      : 'bg-indigo-500'
                }`} />

                <div className="flex gap-4 items-start">
                  {/* Drawing Thumbnail or general vector frame */}
                  <div className="aspect-square w-16 h-16 bg-white border border-slate-750 p-1 rounded-xl shrink-0 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.predictedCharacter} 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-slate-805 font-extrabold text-lg uppercase leading-none">
                        {item.predictedCharacter}
                      </div>
                    )}
                  </div>

                  {/* Character & Core Confidence */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex flex-col min-w-0">
                        <span className="text-lg font-bold text-slate-100 tracking-tight block truncate whitespace-pre-wrap font-sans">
                          {fullDisplay}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {item.characterType}
                          </span>
                          {item.analytics.wordsDetected ? (
                            <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/30">
                              {item.analytics.wordsDetected} words
                            </span>
                          ) : null}
                          {item.analytics.linesDetected && item.analytics.linesDetected > 1 ? (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/45 px-1.5 py-0.5 rounded border border-emerald-900/35">
                              {item.analytics.linesDetected} lines
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className={`text-xs font-mono font-bold ${item.confidence > 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {item.confidence}%
                        </span>
                        <span className="text-[8px] text-slate-500 uppercase mt-0.5 leading-none">Confidence</span>
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-slate-500 flex items-center gap-1 pt-1.5">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {formatDate(item.timestamp)}
                    </div>

                    {/* Correction / User Feedback Status tag */}
                    <div className="text-xs pt-2">
                      {isCorrect === true && (
                        <span className="text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-900/30 inline-flex items-center gap-1 font-semibold text-[10px]">
                          <CheckSquare className="h-3 w-3" />
                          Validated Correct
                        </span>
                      )}
                      {isCorrect === false && (
                        <span className="text-rose-450 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-900/40 inline-flex items-center gap-1 font-semibold text-[10px]">
                          <Trash2 className="h-3 w-3" />
                          Corrected to "{item.feedbackActual}"
                        </span>
                      )}
                      {isCorrect === null && (
                        <div className="block">
                          {correctingItemId === item.id ? (
                            <div className="flex items-center gap-1.5 pt-1">
                              <input
                                type="text"
                                maxLength={100}
                                placeholder="Actual recognized sequence..."
                                value={correctionInput}
                                onChange={(e) => setCorrectionInput(e.target.value)}
                                className="px-2 py-1 bg-slate-950 border border-slate-700/80 rounded-lg text-left font-mono text-xs text-indigo-300 outline-none flex-1 min-w-[120px]"
                              />
                              <button
                                type="button"
                                onClick={() => handleFeedbackSubmit(item.id)}
                                disabled={submittingFeedback}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setCorrectingItemId(null)}
                                className="px-1.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded text-[10px]"
                              >
                                Skip
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setCorrectingItemId(item.id);
                                setCorrectionInput(fullDisplay);
                              }}
                              className="text-indigo-400 hover:text-indigo-300 text-[10px] font-mono font-semibold flex items-center gap-1 transition-all hover:translate-x-0.5"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Label correction?
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* physical analytics telemetry values expansion panel */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-950/60 p-2.5 mt-4 rounded-xl border border-slate-850 font-mono text-[9px] text-slate-400">
                  <div>
                    <span className="text-slate-500 block leading-tight">Stroke Slant:</span>
                    <span className="text-slate-200 font-semibold">{item.analytics.tiltAngle}° slant</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block leading-tight">Symmetry Score:</span>
                    <span className="text-slate-200 font-semibold">{item.analytics.symmetryScore}% symmetry</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block leading-tight">Stroke weight:</span>
                    <span className="text-[10px] text-slate-200 font-semibold">{item.analytics.strokeThickness}/10 gauge</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block leading-tight">Inference Time:</span>
                    <span className="text-indigo-300 font-semibold">{item.analytics.inferenceTimeMs}ms</span>
                  </div>
                </div>

                {/* Segmentation visualizations if segments exist */}
                {item.segments && item.segments.length > 0 ? (
                  <div className="mt-3.5 space-y-1.5 pt-3 border-t border-slate-850/60">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Segmented characters:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.segments.map((seg, sIdx) => (
                        <div key={sIdx} className="bg-slate-950 px-2 py-1 rounded-md border border-slate-805 flex items-center gap-1 text-[9px] font-mono">
                          <span className="text-slate-200 font-bold">{seg.text}</span>
                          <span className="text-slate-500 text-[8px]">({seg.confidence}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Alternatives prediction badges for letters */
                  item.topPredictions && item.topPredictions.length > 1 ? (
                    <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-850">
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Candidate Alternate matrix:</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.topPredictions.slice(1, 3).map((alternate, idx) => (
                          <span 
                            key={idx} 
                            className="text-[9px] font-mono bg-slate-950 text-slate-350 px-2 py-0.5 rounded border border-slate-850"
                          >
                            {alternate.character}: {Math.round(alternate.probability * 100)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
