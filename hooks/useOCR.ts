"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { createWorker, PSM } from "tesseract.js";
import { downloadTextFile, isAcceptedImage, preprocessImage } from "@/lib/ocr";
import { formatFileSize } from "@/lib/utils";
import type { OCRLanguage, ProcessStatus, TesseractLoggerMessage, TesseractWorker, UploadedImage } from "@/types/ocr";

export function useOCR(initialLanguage: OCRLanguage = "tha+eng") {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [language, setLanguage] = useState<OCRLanguage>(initialLanguage);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("");
  const [resultText, setResultText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const workerRef = useRef<TesseractWorker | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const resetPipelineState = useCallback(() => {
    setProcessedPreview(null);
    setResultText("");
    setErrorMsg("");
    setStatus("idle");
    setStatusLabel("");
    setProgress(0);
    setCopied(false);
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!isAcceptedImage(file)) {
      setErrorMsg("Unsupported format. Please upload a PNG or JPEG image.");
      setStatus("error");
      return;
    }

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const preview = URL.createObjectURL(file);
    previewRef.current = preview;

    setUploadedImage({ file, preview });
    resetPipelineState();
  }, [resetPipelineState]);

  const clearImage = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setUploadedImage(null);
    resetPipelineState();
  }, [resetPipelineState]);

  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const handleFileInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) loadFile(file);
    event.target.value = "";
  }, [loadFile]);

  const handleZoneKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!uploadedImage && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openFilePicker();
    }
  }, [openFilePicker, uploadedImage]);

  const runOCR = useCallback(async () => {
    if (!uploadedImage || status === "preprocessing" || status === "loading" || status === "recognizing") {
      return;
    }

    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }

    setStatus("preprocessing");
    setStatusLabel("Preprocessing image…");
    setProgress(0);
    setResultText("");
    setErrorMsg("");
    setProcessedPreview(null);

    let ocrSource: HTMLCanvasElement | File = uploadedImage.file;
    try {
      const { canvas, previewDataUrl } = await preprocessImage(uploadedImage.file);
      ocrSource = canvas;
      setProcessedPreview(previewDataUrl);
    } catch {
      // Keep original image when preprocessing fails.
    }

    setStatus("loading");
    setStatusLabel("Starting Tesseract engine…");

    try {
      const worker = await createWorker(language, 1, {
        logger: (message: TesseractLoggerMessage) => {
          const pct = Math.round(message.progress * 100);
          switch (message.status) {
            case "loading tesseract core":
              setStatusLabel("Loading Tesseract core…");
              break;
            case "loading language traineddata":
              setStatusLabel(`Downloading language data… ${pct}%`);
              break;
            case "initializing api":
              setStatusLabel("Initializing OCR engine…");
              break;
            case "recognizing text":
              setStatus("recognizing");
              setProgress(pct);
              setStatusLabel(`Recognizing text… ${pct}%`);
              break;
          }
        },
      });

      workerRef.current = worker;
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        user_defined_dpi: "300",
        preserve_interword_spaces: "1",
      });

      const { data } = await worker.recognize(ocrSource);
      setResultText(data.text.trimEnd());
      setStatus("done");
      setProgress(100);
      setStatusLabel("Extraction complete");
      await worker.terminate();
      workerRef.current = null;
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "An unexpected error occurred.");
      setStatus("error");
      setStatusLabel("");
    }
  }, [language, status, uploadedImage]);

  const handleCopy = useCallback(async () => {
    if (!resultText) return;

    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fail silently when clipboard access is blocked.
    }
  }, [resultText]);

  const handleDownload = useCallback(() => {
    if (!resultText) return;

    const filename = `${uploadedImage?.file.name.replace(/\.[^/.]+$/, "") ?? "ocr-result"}.txt`;
    downloadTextFile(resultText, filename);
  }, [resultText, uploadedImage]);

  const hasResult = resultText.length > 0;
  const wordCount = hasResult ? resultText.split(/\s+/).filter(Boolean).length : 0;
  const isPreprocessed = processedPreview !== null;
  const previewSrc = processedPreview ?? uploadedImage?.preview;
  const fileSizeLabel = uploadedImage ? formatFileSize(uploadedImage.file.size) : "";
  const isProcessing = status === "preprocessing" || status === "loading" || status === "recognizing";

  return {
    fileInputRef,
    uploadedImage,
    processedPreview,
    language,
    setLanguage,
    status,
    progress,
    statusLabel,
    resultText,
    setResultText,
    errorMsg,
    isDragging,
    copied,
    loadFile,
    clearImage,
    openFilePicker,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    handleZoneKeyDown,
    runOCR,
    handleCopy,
    handleDownload,
    hasResult,
    wordCount,
    isPreprocessed,
    previewSrc,
    fileSizeLabel,
    isProcessing,
  };
}
