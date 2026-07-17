import type { LanguageOption } from "@/types/ocr";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "tha+eng", label: "Thai + English" },
  { value: "eng", label: "English Only" },
  { value: "tha", label: "Thai Only" },
];

export const ACCEPTED_MIME = new Set(["image/png", "image/jpeg"]);

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_MIME.has(file.type);
}

export async function preprocessImage(
  file: File,
): Promise<{ canvas: HTMLCanvasElement; previewDataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const tmpUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(tmpUrl);

      const canvas = document.createElement("canvas");
      const maxDimension = Math.max(img.naturalWidth, img.naturalHeight);
      const targetMaxDimension = 1600;
      const scale = maxDimension < targetMaxDimension ? Math.min(3, targetMaxDimension / maxDimension) : 1;
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = frame;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const boosted = Math.max(0, Math.min(255, Math.round((gray - 128) * 1.18 + 128)));
        data[i] = data[i + 1] = data[i + 2] = boosted;
      }

      ctx.putImageData(frame, 0, 0);
      resolve({ canvas, previewDataUrl: canvas.toDataURL("image/png") });
    };

    img.onerror = () => {
      URL.revokeObjectURL(tmpUrl);
      reject(new Error("Failed to decode image for preprocessing"));
    };

    img.src = tmpUrl;
  });
}

export function downloadTextFile(text: string, filename: string): void {
  const blob = new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
