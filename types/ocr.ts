export type UILanguage = "th" | "en";
export type Theme = "light" | "dark";
export type OCRLanguage = "tha+eng" | "eng" | "tha";
export type ProcessStatus = "idle" | "preprocessing" | "loading" | "recognizing" | "done" | "error";

export interface LanguageOption {
  value: OCRLanguage;
  label: string;
}

export interface UploadedImage {
  file: File;
  preview: string;
}

export interface TesseractLoggerMessage {
  status: string;
  progress: number;
  jobId?: string;
  workerId?: string;
}

import { createWorker } from "tesseract.js";

export type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;
