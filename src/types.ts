export interface TopPrediction {
  character: string;
  probability: number;
}

export interface ImageSegment {
  text: string;
  confidence: number;
  boundingBox?: { x: number; y: number; w: number; h: number };
}

export interface PredictionAnalytics {
  strokeCount?: number;
  preprocessingTimeMs: number;
  inferenceTimeMs: number;
  dimensions: { width: number; height: number };
  tiltAngle: number; // in degrees
  noiseLevel: 'low' | 'medium' | 'high';
  symmetryScore: number; // 0-100%
  strokeThickness: number; // rating 1-10
  linesDetected?: number;
  wordsDetected?: number;
}

export interface PredictionItem {
  id: string;
  imageUrl: string; // Base64 or local server reference
  predictedCharacter: string; // fallback matching single character, or containing parsed text
  predictedText?: string;     // expanded recognized sentence/word
  characterType: 'digit' | 'alphabet' | 'word' | 'sentence' | 'document';
  confidence: number; // percentage 0-100
  topPredictions: TopPrediction[]; // alternate results
  segments?: ImageSegment[]; // isolated bounding-box word chunks
  analytics: PredictionAnalytics;
  timestamp: string;
  feedbackActual?: string; // used for correction / training
}

export interface DatabaseState {
  history: PredictionItem[];
}

// Stats summary for dashboard
export interface ModelStats {
  totalPredictions: number;
  averageConfidence: number;
  accuracyRate: number; // computed based on feedback items
  digitsCount: number;
  alphabetsCount: number;
  wordsCount: number;
  sentencesCount: number;
  speedAverageMs: number;
  accuracyByClass: Record<string, { correct: number; total: number }>;
  predictionsOverTime: { date: string; count: number; avgConfidence: number }[];
  distribution: { character: string; count: number }[];
}

// CNN model training parameters
export interface TrainingEpoch {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss: number;
  valAccuracy: number;
  learningRate: number;
}

export interface ModelMetadata {
  name: string;
  architecture: string;
  totalParameters: number;
  trainableParameters: number;
  inputShape: string;
  optimizer: string;
  lossFunction: string;
}
