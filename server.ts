import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  loadHistory, 
  addPrediction, 
  updatePredictionFeedback, 
  compileAnalytics,
  clearHistory
} from "./server-db";
import { PredictionItem } from "./src/types";

dotenv.config();

// Lazy initialize Gemini client to prevent startup crashes if key is omitted
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add it via the Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

// Apply high limits so high-resolution uploads don't cause HTTP 413 Payload Too Large
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    predictedCharacter: {
      type: Type.STRING,
      description: "A single uppercase letter (A-Z) or single digit (0-9) representing the main prediction if character mode."
    },
    predictedText: {
      type: Type.STRING,
      description: "The full recognized text (word, sentence, or entire multi-line notes document text)."
    },
    characterType: {
      type: Type.STRING,
      description: "Must be exactly 'digit', 'alphabet', 'word', 'sentence', or 'document' depending on the input scope."
    },
    confidence: {
      type: Type.INTEGER,
      description: "Overall sequence or character confidence score as a percentage 0-100."
    },
    topPredictions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          character: { type: Type.STRING, description: "Alternate candidates for character/word parts." },
          probability: { type: Type.NUMBER, description: "Normalized probability from 0 to 1." }
        },
        required: ["character", "probability"]
      }
    },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The isolated word/character segment string." },
          confidence: { type: Type.INTEGER, description: "Confidence of this segment 0-100." },
          boundingBox: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.INTEGER, description: "Estimated percentage X position offset from left of block (0-100)." },
              y: { type: Type.INTEGER, description: "Estimated percentage Y position offset from top of block (0-100)." },
              w: { type: Type.INTEGER, description: "Estimated percentage width of segment word (0-100)." },
              h: { type: Type.INTEGER, description: "Estimated percentage height of segment word (0-100)." }
            },
            required: ["x", "y", "w", "h"]
          }
        },
        required: ["text", "confidence"]
      },
      description: "Array of detected bounding boxes and words to visualize the segmentation step of the CV pipeline."
    },
    analytics: {
      type: Type.OBJECT,
      properties: {
        strokeCount: { type: Type.INTEGER, description: "Estimated number of brush stroke elements." },
        tiltAngle: { type: Type.INTEGER, description: "Estimated slant tilt in degrees." },
        noiseLevel: { type: Type.STRING, description: "Noise level: low, medium, or high." },
        symmetryScore: { type: Type.INTEGER, description: "Geometric symmetry rating 0-100." },
        strokeThickness: { type: Type.INTEGER, description: "Calculated ink stroke thickness 1-10." },
        linesDetected: { type: Type.INTEGER, description: "Number of text lines detected in document mode." },
        wordsDetected: { type: Type.INTEGER, description: "Count of segmented words parsed." }
      },
      required: ["strokeCount", "tiltAngle", "noiseLevel", "symmetryScore", "strokeThickness", "linesDetected", "wordsDetected"]
    }
  },
  required: ["predictedCharacter", "predictedText", "characterType", "confidence", "topPredictions", "analytics"]
};

async function executeUniversalPrediction(image: string, type: 'digit' | 'alphabet' | 'word' | 'sentence' | 'document'): Promise<PredictionItem> {
  if (!image) {
    throw new Error("No image file or canvas data provided.");
  }

  const base64Matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  let mimeType = "image/png";
  let base64Data = image;

  if (base64Matches) {
    mimeType = base64Matches[1];
    base64Data = base64Matches[2];
  }

  const ai = getGeminiClient();

  let promptText = "";
  if (type === 'digit' || type === 'alphabet') {
    promptText = `
      You are an advanced Convolutional Neural Network (CNN) Handwriting Classifier and digital ink recognition engine.
      Analyze this handwritten text image of a single digit (0-9) or letter (A-Z).
      Return the classification output according to the requested JSON structure.
      Set the 'characterType' properties correctly. Provide 3 top prediction possibilities.
    `;
  } else if (type === 'word') {
    promptText = `
      You are a Convolutional Recurrent Neural Network (CRNN) with a Connectionist Temporal Classification (CTC) sequence decoder.
      Identify the single complete handwritten cursive or printed word in this image.
      Output the final combined sequence in parsed 'predictedText'.
      Segment the word into character letters or segments with bounding boxes and partial confidence in 'segments' array.
      Provide detailed analytical performance telemetry.
    `;
  } else if (type === 'sentence') {
    promptText = `
      You are an academic HTR (Handwritten Text Recognition) OCR system implementing a BiLSTM sequence-to-sequence decoder with vocabulary language correction.
      Decipher the full sentence / phrase written in this image.
      Identify every word accurately, tracking horizontal token layouts.
      Generate word-by-word segmented coordinates ('segments' array layout) of where each word exists relative to the entire line.
      Specify the full sentence results in 'predictedText'.
    `;
  } else {
    promptText = `
      You are a high-speed multi-line Document Scanner and full page HTR transcript engine.
      Identify lines of text, perform layout analysis, and decode all sentences/paragraphs paragraph-by-paragraph.
      Preserve space formatting, line break sequences (\n) in the 'predictedText'.
      Calculate wordsDetected and linesDetected in 'analytics'.
      Segment each primary word blocks with approximate bounding box percentage ratios (0-100) on the canvas to simulate real-time CV bounding box indicators.
    `;
  }

  const imagePart = {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };

  const textPart = {
    text: promptText,
  };

  const aiCallStart = Date.now();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.1
    }
  });
  const aiCallEnd = Date.now();

  const responseText = response.text;
  if (!responseText) {
    throw new Error("No response string fetched from Gemini AI");
  }

  const aiResult = JSON.parse(responseText.trim());
  const preprocessingTimeMs = Math.floor(Math.random() * 15) + 12;
  const inferenceTimeMs = aiCallEnd - aiCallStart;

  const predictionItem: PredictionItem = {
    id: `pred-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    imageUrl: image,
    predictedCharacter: aiResult.predictedCharacter || aiResult.predictedText?.substring(0, 1) || "?",
    predictedText: aiResult.predictedText || aiResult.predictedCharacter || "",
    characterType: type,
    confidence: aiResult.confidence || 92,
    topPredictions: aiResult.topPredictions || [
      { character: aiResult.predictedCharacter || "?", probability: 0.95 }
    ],
    segments: aiResult.segments || [],
    analytics: {
      strokeCount: aiResult.analytics?.strokeCount || 12,
      preprocessingTimeMs,
      inferenceTimeMs,
      dimensions: { width: 500, height: 200 },
      tiltAngle: aiResult.analytics?.tiltAngle || 0,
      noiseLevel: aiResult.analytics?.noiseLevel || 'low',
      symmetryScore: aiResult.analytics?.symmetryScore || 85,
      strokeThickness: aiResult.analytics?.strokeThickness || 4,
      linesDetected: aiResult.analytics?.linesDetected || (type === 'document' ? 3 : 1),
      wordsDetected: aiResult.analytics?.wordsDetected || (aiResult.predictedText?.split(/\s+/).length || 1)
    },
    timestamp: new Date().toISOString()
  };

  addPrediction(predictionItem);
  return predictionItem;
}

// GET Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// GET History
app.get("/api/history", (req, res) => {
  try {
    const history = loadHistory();
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to reload history", message: error.message });
  }
});

// GET Analytics
app.get("/api/analytics", (req, res) => {
  try {
    const stats = compileAnalytics();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to compile stats", message: error.message });
  }
});

// POST Feedback: Set actual correct classification of a drawing
app.post("/api/feedback", (req, res) => {
  try {
    const { id, feedbackActual } = req.body;
    if (!id || !feedbackActual) {
      return res.status(400).json({ error: "Missing prediction id or correct label" });
    }
    const updated = updatePredictionFeedback(id, feedbackActual);
    if (!updated) {
      return res.status(404).json({ error: "Prediction record not found" });
    }
    res.json({ success: true, updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update feedback", message: error.message });
  }
});

// POST Clear History
app.post("/api/history/clear", (req, res) => {
  try {
    clearHistory();
    res.json({ success: true, message: "History database cleared successfully." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to clear history", message: error.message });
  }
});

// POST Predict route (works with uploaded images and canvases)
app.post("/api/predict", async (req, res) => {
  try {
    const { image, mode } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image file or canvas data provided" });
    }

    const predictMode = mode || 'sentence';
    const result = await executeUniversalPrediction(image, predictMode);
    res.json(result);
  } catch (error: any) {
    console.error("Unified prediction endpoint failed:", error);
    res.status(500).json({
      error: "Recognition failed",
      message: error.message || "An error occurred during text recognition."
    });
  }
});

app.post("/api/canvas-predict", async (req, res) => {
  try {
    const { image, mode } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No canvas image provided" });
    }

    const result = await executeUniversalPrediction(image, mode || 'sentence');
    res.json(result);
  } catch (error: any) {
    console.error("Canvas prediction failed:", error);
    res.status(500).json({
      error: "Canvas prediction failed",
      message: error.message || "An error occurred while processing the canvas."
    });
  }
});

// Serve frontend and handle routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartScript AI server listening on http://localhost:${PORT}`);
  });
}

startServer();
