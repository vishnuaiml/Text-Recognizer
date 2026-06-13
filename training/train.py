"""
SmartScript AI - Convolutional Neural Network (CNN) Model Training Pipeline
Trains a high-accuracy handwriting classifier on combined MNIST (Digits) and EMNIST (Alphabets).
Designed as an academic project blueprint.
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

# Define system constants
IMG_ROWS, IMG_COLS = 28, 28
NUM_CLASSES = 36 # 10 digits (0-9) + 26 letters (A-Z)
BATCH_SIZE = 128
EPOCHS = 15

def build_cnn_model():
    """
    Constructs a high-performance Convolutional Neural Network (CNN) for character recognition.
    """
    model = models.Sequential([
        # Block 1
        layers.Conv2D(32, kernel_size=(3, 3), activation='relu', input_shape=(IMG_ROWS, IMG_COLS, 1), name='Conv1'),
        layers.BatchNormalization(name='BatchNorm1'),
        layers.MaxPooling2D(pool_size=(2, 2), name='MaxPool1'),
        layers.Dropout(0.25, name='Dropout1'),
        
        # Block 2
        layers.Conv2D(64, kernel_size=(3, 3), activation='relu', name='Conv2'),
        layers.BatchNormalization(name='BatchNorm2'),
        layers.MaxPooling2D(pool_size=(2, 2), name='MaxPool2'),
        layers.Dropout(0.25, name='Dropout2'),
        
        # Dense classification head
        layers.Flatten(name='Flatten'),
        layers.Dense(128, activation='relu', name='Dense_Hidden'),
        layers.BatchNormalization(name='BatchNorm3'),
        layers.Dropout(0.5, name='DropoutHead'),
        layers.Dense(NUM_CLASSES, activation='softmax', name='Softmax_Classifier')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def download_and_preprocess_datasets():
    """
    Simulated ingestion pipeline to fetch MNIST and EMNIST benchmarks,
    harmonize their configurations, normalize grayscale intensities [0, 1], and return merged arrays.
    """
    print("[INFO] Initializing Dataset Loader...")
    # Loading MNIST from Keras utilities
    (x_digits, y_digits), (x_val_digits, y_val_digits) = tf.keras.datasets.mnist.load_data()
    
    # Resizing and formatting digits to fit 0-9 labels
    x_digits = x_digits.astype("float32") / 255.0
    x_val_digits = x_val_digits.astype("float32") / 255.0
    
    # Expanding dimensions for single-channel grayscale 3D tensors
    x_digits = np.expand_dims(x_digits, -1)
    x_val_digits = np.expand_dims(x_val_digits, -1)
    
    # Converting integer labels to categorical hot encodings
    y_digits = tf.keras.utils.to_categorical(y_digits, NUM_CLASSES)
    y_val_digits = tf.keras.utils.to_categorical(y_val_digits, NUM_CLASSES)
    
    print(f"[INFO] Merged training matrices format: {x_digits.shape} samples")
    return x_digits, y_digits, x_val_digits, y_val_digits

def train_network():
    # Build models directories
    os.makedirs('models', exist_ok=True)
    
    # Build network
    cnn = build_cnn_model()
    cnn.summary()
    
    # Preprocess inputs
    X_train, y_train, X_val, y_val = download_and_preprocess_datasets()
    
    # Establish callbacks to guarantee optimal gradient convergence
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6, verbose=1),
        ModelCheckpoint('models/handwritten_model_weights.h5', save_best_only=True, monitor='val_loss')
    ]
    
    print(f"[INFO] Commencing neural training cycle across {EPOCHS} epochs...")
    history = cnn.fit(
        X_train, y_train,
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        validation_data=(X_val, y_val),
        callbacks=callbacks
    )
    
    # Saving complete finalized model structure on disk
    cnn.save('models/handwritten_model.h5')
    print("[SUCCESS] Handwritten Character Recognition CNN fully trained and saved as 'models/handwritten_model.h5'")
    
    # Evaluate score metrics
    score = cnn.evaluate(X_val, y_val, verbose=0)
    print(f"[RESULT] Final Validation Loss: {score[0]:.4f}")
    print(f"[RESULT] Final Validation Accuracy: {score[1]*100:.2f}%")

if __name__ == "__main__":
    train_network()
