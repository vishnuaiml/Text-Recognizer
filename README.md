# SmartScript AI — Intelligent Handwritten Character Recognition Web Application

SmartScript AI is a high-fidelity, full-stack, AI-powered web application capable of recognizing handwritten digits (0–9) and uppercase alphabet characters (A–Z). Features include a highly interactive drawing canvas, file uploading, and full-stack real-time analytics with simulated Convolutional Neural Network (CNN) Epoch training graphs. 

Designed and engineered as a comprehensive final-year Academic/Commercial AIML Computer Vision solution.

---

## 🚀 Key System Features

*   **Interactive Drafting Board:** Real-time tactile HTML5 Drawing Canvas featuring dual Mouse & Touch stroke trackers, brush dimensions sliders, drawing guideline frames, stroke step logs, and instant undo actions.
*   **Dual-stream Ingestion Scanner:** Standard image importation interface Supporting drag-and-drop actions, system file browsing, or image pasting of standard high-contrast drawings.
*   **Precision Pixel Grid Downscaler:** Preprocessing algorithm that extracts, centers, and processes written characters down to standard **28x28 normalized grayscale matrices** (representing traditional MNIST/EMNIST training formatting) in red-green matrices overlays.
*   **Dual AI Prediction Engine:** Back-end pipeline routing binarized glyph structures to **Gemini 3.5 Flash** models, combining fast structural predictions, top 3 guess lists, and deep visual commentaries explaining shape topology.
*   **Historical Log Database:** Persistent, file-level SQLite-like history database displaying prediction logs (scan thumbnails, date/time, tilt, symmetry scores, alternative guess probability charts) and correctable ground-truth tag inputs.
*   **Academic Analytics Dashboard:** Dynamic Recharts-style SVG layout mapping total usages, validation accuracy levels, character distributions, speed metrics, confusion-matrix collision logs, and an interactive **Epoch CNN Training Simulator** illustrating loss/accuracy curves converge over epochs.

---

## 📁 System Folder Directory Layout

```text
smartscript-ai/
│
├── frontend/ / src/             # Standard React + TypeScript Frontend
│   ├── components/
│   │   ├── DrawingCanvas.tsx    # HTML5 Touch/Mouse Slate, MNIST 28x28 Preview
│   │   ├── ImageUpload.tsx      # Draggable dropzones with diagnostic parsing
│   │   ├── AnalyticsDashboard.tsx # Accuracy distributions, SVG Charts, Training simulation
│   │   └── PredictionHistory.tsx  # Scrollable history, telemetry arrays, label correction
│   ├── types.ts                 # Shared system interfaces & TypeScript variables
│   ├── App.tsx                  # Main workspace views and coordinator tabs
│   ├── index.css                # Customized Tailwind and typography configurations
│   └── main.tsx                 # Entry node mounting React
│
├── backend/ / server.ts         # High-Performance Node-Express server hosting Vite & APIs
│   ├── server-db.ts             # JSON file persistence database (persistent history & state)
│   └── data/
│       └── history.json         # Store log file containing seeded startup samples
│
├── training/                    # Local Python AI CNN models development suite
│   ├── train.py                 # TensorFlow/Keras CNN pipeline training (mixed EMNIST/MNIST)
│   ├── preprocess.py            # OpenCV preprocessing pipeline (thresholds, centers x,y)
│   └── evaluate.py              # Quantitative evaluation and classification validation
│
├── models/
│   └── handwritten_model.h5     # Saved pre-trained H5 representation (local tests)
│
├── requirements.txt             # Python ML environment requirements
├── package.json                 # Node compiler configurations & start scripts
└── README.md                    # Core operational manual
```

---

## ⚡ Active API Endpoints

### `POST /api/predict`
Upload canvas sketches or imported scans. Automatically processes, normalizes, runs character inference, and records entry to persistent logs.
*   **Payload (`application/json`):**
    ```json
    {
      "image": "data:image/png;base64,iVBORw0KGgo...",
      "filename": "canvas.png"
    }
    ```
*   **Response (`205 OK`):**
    ```json
    {
      "id": "pred-17234912948-x3fa",
      "imageUrl": "data:image/png;base64,...",
      "predictedCharacter": "A",
      "characterType": "alphabet",
      "confidence": 94,
      "topPredictions": [
        { "character": "A", "probability": 0.94 },
        { "character": "H", "probability": 0.04 },
        { "character": "R", "probability": 0.02 }
      ],
      "analytics": {
        "strokeCount": 3,
        "preprocessingTimeMs": 18,
        "inferenceTimeMs": 1420,
        "dimensions": { "width": 280, "height": 280 },
        "tiltAngle": 3,
        "noiseLevel": "low",
        "symmetryScore": 88,
        "strokeThickness": 4
      },
      "timestamp": "2026-06-12T07:11:43.000Z"
    }
    ```

### `POST /api/feedback`
Allows correcting or validating the character label shown in history logs, correcting accuracy parameters inside stats.
*   **Payload (`application/json`):**
    ```json
    {
      "id": "pred-17234912948-x3fa",
      "feedbackActual": "A"
    }
    ```

### `GET /api/history`
Loads full historical predictions array.

### `GET /api/analytics`
Loads dynamic statistics, speeds, class tallies, and timelines.

### `GET /api/health`
Checks API readiness and returns if `GEMINI_API_KEY` is loaded.

---

## 🛠️ Local Installation and Operation

### Prerequisites

*   **Node.js** (v18 or higher recommended)
*   **Python** 3.8+ (for local CNN training scripts folder)

### 1. Build and Run the Complete Full-Stack Web Application

1.  Clone or export your workspace containing the project files.
2.  Install all Node app dependencies:
    ```bash
    npm install
    ```
3.  Set up your local credentials or secrets file by cloning `.env.example` into `.env` and writing your key:
    ```env
    GEMINI_API_KEY="YOUR_ACTUAL_API_KEY"
    ```
4.  Launch the combined application (starts Express and Vite middleware simultaneously on port 3000):
    ```bash
    npm run dev
    ```
5.  Load the local client on: `http://localhost:3000`.

---

## 🧠 Local Python CNN Model Training

To experiment with, retrain, or evaluate the offline TensorFlow Convolutional Network (CNN) pipeline locally:

1.  Implement a clean Python virtual environment inside the `/training` path:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use: venv\Scripts\activate
    ```
2.  Install ML/CV dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Execute the model training script. This script automatically loads standard MNIST benchmark digits, scales them, constructs the double-kernel Conv2D network, trains for 15 epochs, and saves model parameters:
    ```bash
    python training/train.py
    ```
4.  Run preprocessing routines on any raw handwriting snapshot to extract local bounding boxes using OpenCV:
    ```bash
    python training/preprocess.py
    ```

---

## 🌍 Cloud Deployments

### combined Single Container (e.g. Google Cloud Run, Heroku)
We have configured `package.json` with self-contained bundling commands. Deploying to containers:
1.  Run `npm run build`. This bundles the React assets under `dist/` and compiles the Node backend server to `dist/server.cjs` with `esbuild`.
2.  Execute container launches targeting the native production command: `npm start`.

### Frontend separate (Vercel)
Ideal for standard React SPAs. Point Vercel to build command `vite build`, publishing `dist/` directory.

### Backend separate (Render)
Point Render Web Service to `server.ts` or custom FastAPIs using python virtual environments.

---

## 🌟 Architectural Academic Core Merits
*   **Dual Architecture Integration:** Showcases modern React modular interfaces tied to Express REST architectures and JSON persistence engines.
*   **Computer Vision Alignment:** Features real-time Canvas pixel-coordinate translation, downsampling canvas paths to pixel grids, and binarizing inputs using Otsu's thresholding concepts.
*   **Inference Quality Explainer:** Blends deep pattern probabilities with Gemini's Multimodal LLM analysis to tutor students on character geometry and glyph structures on the active panel.
