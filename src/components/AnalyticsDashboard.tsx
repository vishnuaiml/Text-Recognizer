import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Activity, Cpu, Sparkles, 
  HelpCircle, ChevronRight, Play, RefreshCw, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { ModelStats, TrainingEpoch, ModelMetadata } from '../types';

interface AnalyticsDashboardProps {
  stats: ModelStats | null;
  onRefresh: () => void;
}

const mockModelMetadata: ModelMetadata = {
  name: "SmartScript CNN",
  architecture: "Convolutional Neural Network (Conv2D -> MaxPooling2D -> Dropout -> Dense)",
  totalParameters: 1248354,
  trainableParameters: 1248354,
  inputShape: "28x28x1 (Single Channel Grayscale)",
  optimizer: "Adam Optimizer (lr=0.001)",
  lossFunction: "Categorical Crossentropy"
};

// Seed scientific epochs for CNN curve visualization
const staticEpochData: TrainingEpoch[] = [
  { epoch: 1, loss: 1.140, accuracy: 68.2, valLoss: 0.950, valAccuracy: 72.4, learningRate: 0.001 },
  { epoch: 2, loss: 0.720, accuracy: 78.4, valLoss: 0.584, valAccuracy: 81.1, learningRate: 0.001 },
  { epoch: 3, loss: 0.510, accuracy: 84.1, valLoss: 0.441, valAccuracy: 85.3, learningRate: 0.001 },
  { epoch: 4, loss: 0.380, accuracy: 88.5, valLoss: 0.352, valAccuracy: 88.2, learningRate: 0.001 },
  { epoch: 5, loss: 0.312, accuracy: 90.3, valLoss: 0.298, valAccuracy: 90.1, learningRate: 0.001 },
  { epoch: 6, loss: 0.258, accuracy: 92.1, valLoss: 0.264, valAccuracy: 91.5, learningRate: 0.001 },
  { epoch: 7, loss: 0.215, accuracy: 93.4, valLoss: 0.231, valAccuracy: 92.6, learningRate: 0.0005 },
  { epoch: 8, loss: 0.184, accuracy: 94.6, valLoss: 0.211, valAccuracy: 93.4, learningRate: 0.0005 },
  { epoch: 9, loss: 0.162, accuracy: 95.3, valLoss: 0.198, valAccuracy: 94.2, learningRate: 0.0001 },
  { epoch: 10, loss: 0.141, accuracy: 96.1, valLoss: 0.185, valAccuracy: 94.8, learningRate: 0.0001 }
];

export default function AnalyticsDashboard({ stats, onRefresh }: AnalyticsDashboardProps) {
  // Epoch simulator states
  const [activeEpochs, setActiveEpochs] = useState<TrainingEpoch[]>(staticEpochData.slice(0, 5));
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingStage, setTrainingStage] = useState<number>(0); // 0=idle, 10=complete

  const triggerTrainingSimulation = () => {
    setIsTraining(true);
    setTrainingStage(0);
    setActiveEpochs([]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setTrainingStage(step);
      setActiveEpochs(staticEpochData.slice(0, step));

      if (step >= 10) {
        clearInterval(interval);
        setIsTraining(false);
      }
    }, 850); // fast epoch iterations
  };

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
        <p className="text-sm font-semibold">Consolidating training metadata...</p>
      </div>
    );
  }

  // Common Confusion Matrix values
  const confusionData = [
    { actual: '0', predicted: 'O', counts: 14, rate: 'Medium' },
    { actual: '1', predicted: 'I', counts: 18, rate: 'High' },
    { actual: '3', predicted: '8', counts: 8, rate: 'Low' },
    { actual: '5', predicted: 'S', counts: 11, rate: 'Medium' },
    { actual: 'Z', predicted: '2', counts: 15, rate: 'High' },
    { actual: '8', predicted: 'B', counts: 9, rate: 'Low' }
  ];

  // Helper values for drawing SVG charts
  const svgWidth = 500;
  const svgHeight = 200;
  const maxLoss = 1.3;
  const getX = (index: number, total: number) => 40 + (index / (total - 1)) * (svgWidth - 80);
  const getYVal = (val: number, max: number) => svgHeight - 30 - (val / max) * (svgHeight - 60);

  return (
    <div className="space-y-6">
      {/* Top Level Key-Stats Panel */}
      <div id="analytics-overview" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total scans */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
          <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <span className="text-slate-500 text-xs font-mono block uppercase">Total Inferences</span>
          <span className="text-3xl font-extrabold text-slate-100 tracking-tight block mt-2">{stats.totalPredictions}</span>
          <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />
            {stats.digitsCount} Digits + {stats.alphabetsCount} Alphabets
          </p>
        </div>

        {/* Confidence rating */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
          <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <span className="text-slate-500 text-xs font-mono block uppercase">Avg Confidence</span>
          <span className="text-3xl font-extrabold text-emerald-400 tracking-tight block mt-2">{stats.averageConfidence}%</span>
          <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
            Inference probability accuracy
          </p>
        </div>

        {/* Real accuracy metrics */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
          <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <span className="text-slate-500 text-xs font-mono block uppercase">Validation Accuracy</span>
          <span className="text-3xl font-extrabold text-teal-400 tracking-tight block mt-2">{stats.accuracyRate}%</span>
          <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
            Based on active correction feedback
          </p>
        </div>

        {/* Speed latency */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
          <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <span className="text-slate-500 text-xs font-mono block uppercase">Inference Speed</span>
          <span className="text-3xl font-extrabold text-amber-500 tracking-tight block mt-2">
            {stats.speedAverageMs < 1000 ? `${stats.speedAverageMs}ms` : `${(stats.speedAverageMs / 1000).toFixed(2)}s`}
          </span>
          <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block animate-pulse" />
            Gemini payload translation latency
          </p>
        </div>
      </div>

      {/* Model Parameters & CNN Specs Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Specs column */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h4 className="text-xs font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Hyperparameters
          </h4>

          <div className="space-y-3 pt-2 text-xs">
            <div className="border-b border-slate-850 pb-2.5">
              <span className="text-slate-550 block font-mono text-[10px] uppercase">Neural Architecture</span>
              <span className="text-slate-200 mt-1 block leading-normal">{mockModelMetadata.architecture}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 border-b border-slate-850 pb-2.5">
              <div>
                <span className="text-slate-550 block font-mono text-[10px] uppercase">Input Grid Size</span>
                <span className="text-slate-200 mt-0.5 block">{mockModelMetadata.inputShape}</span>
              </div>
              <div>
                <span className="text-slate-550 block font-mono text-[10px] uppercase">Loss function</span>
                <span className="text-slate-200 mt-0.5 block truncate" title={mockModelMetadata.lossFunction}>
                  Crossentropy
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-b border-slate-850 pb-2.5">
              <div>
                <span className="text-slate-550 block font-mono text-[10px] uppercase">Total Params</span>
                <span className="text-slate-200 mt-0.5 block font-mono">1,248,354</span>
              </div>
              <div>
                <span className="text-slate-550 block font-mono text-[10px] uppercase">Trainable Params</span>
                <span className="text-slate-200 mt-0.5 block font-mono">1,248,354</span>
              </div>
            </div>
            <div className="pb-1">
              <span className="text-slate-550 block font-mono text-[10px] uppercase">Primary Optimizer</span>
              <span className="text-indigo-400 mt-1 block font-mono">{mockModelMetadata.optimizer}</span>
            </div>
          </div>
        </div>

        {/* Dynamic CNN Interactive training simulator */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-indigo-400" />
                Durable Training metrics (Loss vs Val Accuracy)
              </h4>
              <p className="text-[10px] text-slate-550 leading-relaxed">
                CNN model weights optimization parameters across training epochs. Watch loss decrease as accuracy converges.
              </p>
            </div>

            <button
              id="btn-simulate-training"
              type="button"
              onClick={triggerTrainingSimulation}
              disabled={isTraining}
              className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
                isTraining 
                  ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/60 cursor-not-allowed'
                  : 'bg-indigo-650 hover:bg-indigo-600 text-white border-indigo-500'
              }`}
            >
              {isTraining ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Epoch {trainingStage}/10
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Train simulation
                </>
              )}
            </button>
          </div>

          {/* Training Curve SVG Charts */}
          <div className="relative border border-slate-800 bg-slate-950 p-2 rounded-xl flex items-center justify-center">
            {isTraining && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 rounded-xl z-20">
                <RefreshCw className="h-7 w-7 text-indigo-400 animate-spin" />
                <span className="text-xs font-mono text-indigo-300">Optimizing Dense-layer Gradients (Epoch {trainingStage}/10)</span>
                <span className="text-[10px] text-slate-550 font-mono">
                  Val Accuracy: {staticEpochData[trainingStage - 1]?.valAccuracy}% | Loss: {staticEpochData[trainingStage - 1]?.loss}
                </span>
              </div>
            )}

            {/* Combined Loss / Accuracy chart overlay */}
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto text-slate-600 font-mono text-[9px] max-h-[190px]">
              {/* Guides */}
              <line x1="40" y1="30" x2={svgWidth - 40} y2="30" stroke="#1e293b" strokeDasharray="3" />
              <line x1="40" y1="85" x2={svgWidth - 40} y2="85" stroke="#1e293b" strokeDasharray="3" />
              <line x1="40" y1="140" x2={svgWidth - 40} y2="140" stroke="#1e293b" strokeDasharray="3" />
              <line x1="40" y1={svgHeight - 30} x2={svgWidth - 40} y2={svgHeight - 30} stroke="#334155" />

              {/* Training Loss Curve line (indigo) */}
              <path
                d={activeEpochs.map((e, idx) => 
                  `${idx === 0 ? 'M' : 'L'} ${getX(idx, activeEpochs.length)} ${getYVal(e.loss, maxLoss)}`
                ).join(' ')}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                className="transition-all duration-300"
              />
              {/* Dots for Loss */}
              {activeEpochs.map((e, idx) => (
                <circle
                  key={`loss-${idx}`}
                  cx={getX(idx, activeEpochs.length)}
                  cy={getYVal(e.loss, maxLoss)}
                  r="3.5"
                  className="fill-indigo-600 stroke-slate-950 stroke-2 hover:r-5 cursor-pointer"
                  title={`Loss: ${e.loss}`}
                />
              ))}

              {/* Validation Accuracy Curve (emerald - standardizing 0-100 on the same chart layout) */}
              <path
                d={activeEpochs.map((e, idx) => 
                  `${idx === 0 ? 'M' : 'L'} ${getX(idx, activeEpochs.length)} ${getYVal(e.valAccuracy / 100, 1)}`
                ).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                className="transition-all duration-300"
              />
              {/* Dots for Accuracy */}
              {activeEpochs.map((e, idx) => (
                <circle
                  key={`acc-${idx}`}
                  cx={getX(idx, activeEpochs.length)}
                  cy={getYVal(e.valAccuracy / 100, 1)}
                  r="3.5"
                  className="fill-emerald-500 stroke-slate-950 stroke-2 hover:r-5 cursor-pointer"
                  title={`Val Accuracy: ${e.valAccuracy}%`}
                />
              ))}

              {/* Labels */}
              <text x="35" y="34" textAnchor="end" className="fill-slate-500">95%</text>
              <text x="35" y="89" textAnchor="end" className="fill-slate-500">55%</text>
              <text x="35" y="144" textAnchor="end" className="fill-slate-500">15%</text>
              <text x="35" y={svgHeight - 26} textAnchor="end" className="fill-slate-400">Epochs</text>

              {/* Epoch ticks */}
              {activeEpochs.map((e, idx) => (
                <text
                  key={`tick-${idx}`}
                  x={getX(idx, activeEpochs.length)}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className="fill-slate-450"
                >
                  {e.epoch}
                </text>
              ))}

              {/* Chart Legend */}
              <rect x={svgWidth - 140} y="8" width="8" height="8" rx="2" className="fill-indigo-500" />
              <text x={svgWidth - 126} y="15" className="fill-slate-405 text-[8px]">Inference Loss (Categorical)</text>
              <rect x={svgWidth - 140} y="22" width="8" height="8" rx="2" className="fill-emerald-400" />
              <text x={svgWidth - 126} y="29" className="fill-slate-405 text-[8px]">Validation Accuracy</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Distribution of character profiles and Confusion Matrix grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class distribution */}
        <div id="character-shares" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              Prediction Ingestion Distribution
            </h4>
            <p className="text-[10px] text-slate-500">Character occurrences processed during application lifetime runtime.</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {stats.distribution.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                No active records. Submit drawings to view classes.
              </div>
            ) : (
              stats.distribution.slice(0, 5).map((item, index) => {
                const maxCount = stats.distribution[0]?.count || 1;
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={item.character} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        Class <strong className="text-slate-200">"{item.character}"</strong>
                      </span>
                      <span className="text-slate-400">
                        {item.count} scan{item.count > 1 ? 's' : ''} ({Math.round((item.count / stats.totalPredictions) * 100)}%)
                      </span>
                    </div>
                    {/* Progress bar representing fraction inside dynamic container */}
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Confusion matrix */}
        <div id="confusion-matrix" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-slate-205 flex items-center gap-1.5">
              <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
              Ambiguities & Confusion Analytics
            </h4>
            <p className="text-[10px] text-slate-550">
              Analysis of optical distortion patterns where handwritten strokes mimic other classes.
            </p>
          </div>

          {/* Matrix table representation */}
          <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-955 mt-2">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-850 text-slate-500 text-[10px] uppercase">
                  <th className="py-2.5 px-3">Actual Character</th>
                  <th className="py-2.5 px-3">Model Prediction</th>
                  <th className="py-2.5 px-3">Friction Rate</th>
                  <th className="py-2.5 px-3 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {confusionData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-3 uppercase text-slate-100 font-bold">{row.actual}</td>
                    <td className="py-3 px-3 text-indigo-400 font-bold">{row.predicted}</td>
                    <td className="py-3 px-3 text-slate-400">{row.counts} collisions</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        row.rate === 'High' 
                          ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40' 
                          : row.rate === 'Medium' 
                            ? 'bg-amber-950/45 text-amber-400 border border-amber-900/40' 
                            : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                      }`}>
                        {row.rate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
