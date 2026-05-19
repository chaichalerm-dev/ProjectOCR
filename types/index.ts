export interface OCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface UploadedFile {
  file: File;
  preview: string;
  name: string;
  size: number;
}

export type OCRStatus = "idle" | "processing" | "done" | "error";
