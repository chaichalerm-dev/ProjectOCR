"use client";

import { useState, useCallback } from "react";
import Tesseract from "tesseract.js";
import type { OCRResult, OCRStatus } from "@/types";

export function useOCR() {
  const [status, setStatus] = useState<OCRStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (imageSource: File | string) => {
    setStatus("processing");
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const { data } = await Tesseract.recognize(imageSource, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      setResult({
        text: data.text,
        confidence: data.confidence,
        words: data.words.map((w) => ({
          text: w.text,
          confidence: w.confidence,
          bbox: w.bbox,
        })),
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR processing failed");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return { status, progress, result, error, processImage, reset };
}
