'use client';

/**
 * app/page.tsx — ProjectOCR · Main Page
 *
 * [EN] Fully client-side OCR tool built with Next.js 15 App Router, Tesseract.js v5,
 *      Tailwind CSS v3, and Lucide React. Zero backend — every byte of processing
 *      runs inside the user's browser tab.
 *
 * [TH] เครื่องมือ OCR ฝั่ง Client แบบครบวงจร สร้างด้วย Next.js 15 App Router,
 *      Tesseract.js v5, Tailwind CSS v3 และ Lucide React ไม่มี backend —
 *      การประมวลผลทุกอย่างทำงานภายในแท็บเบราว์เซอร์ของผู้ใช้
 *
 * Pipeline / ขั้นตอน:
 *   Image Upload → Canvas Preprocessing (Grayscale → Otsu Threshold → B&W)
 *               → Tesseract.js Recognition → Editable Result → Copy / Download
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type DragEvent,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { createWorker } from 'tesseract.js';
import {
  ScanText,
  ImagePlus,
  X,
  FileText,
  Loader2,
  Copy,
  CheckCheck,
  Download,
  AlertCircle,
  CircleCheck,
  Contrast,
  Sun,
  Moon,
  Languages,
  ChevronDown,
  Check,
  ShieldCheck,
  Zap,
  PencilLine,
  Github,
  ExternalLink,
  Heart,
} from 'lucide-react';

type UILanguage = 'th' | 'en';
type Theme = 'light' | 'dark';

const UI_TEXT = {
  th: {
    privacy: 'รูปของคุณจะถูกประมวลผลบนเครื่องนี้เท่านั้น',
    title: 'อ่านข้อความจากรูปภาพ',
    subtitle: 'อัปโหลดรูป แล้วระบบจะช่วยอ่านข้อความออกมาให้ คุณแก้ไข คัดลอก หรือบันทึกต่อได้ทันที',
    upload: 'ลากรูปมาวาง หรือคลิกเพื่อเลือกรูป',
    browse: 'เลือกไฟล์จากเครื่อง',
    formats: 'รองรับไฟล์ PNG และ JPG',
    replace: 'เปลี่ยนรูป', remove: 'นำรูปออก',
    mixed: 'ไทยและอังกฤษ', english: 'อังกฤษ', thai: 'ไทย',
    read: 'อ่านข้อความ', reading: 'กำลังอ่าน…',
    result: 'ข้อความที่อ่านได้', chars: 'ตัวอักษร', words: 'คำ',
    copy: 'คัดลอก', copied: 'คัดลอกแล้ว', download: 'บันทึก .txt',
    empty: 'เพิ่มรูปภาพก่อน แล้วกด “อ่านข้อความ”',
    ready: 'พร้อมแล้ว กด “อ่านข้อความ” เพื่อเริ่ม',
    working: 'กำลังอ่านข้อความจากรูป กรุณารอสักครู่…',
    failed: 'อ่านไม่สำเร็จ ลองเลือกรูปที่ชัดขึ้นหรือเปลี่ยนภาษาของเอกสาร',
    complete: 'อ่านข้อความเรียบร้อยแล้ว', processing: 'กำลังเตรียมและอ่านข้อความ…',
    appearance: 'เปลี่ยนโหมดสี', language: 'เปลี่ยนภาษาเว็บไซต์', ocrLanguage: 'ภาษาที่อยู่ในรูป',
  },
  en: {
    privacy: 'Your images are processed only on this device',
    title: 'Turn images into editable text',
    subtitle: 'Upload an image and we’ll pull out the text so you can edit, copy, or save it right away.',
    upload: 'Drop an image here, or click to choose one',
    browse: 'Choose a file', formats: 'PNG and JPG files are supported',
    replace: 'Change image', remove: 'Remove image',
    mixed: 'Thai and English', english: 'English', thai: 'Thai',
    read: 'Read text', reading: 'Reading…',
    result: 'Extracted text', chars: 'characters', words: 'words',
    copy: 'Copy', copied: 'Copied', download: 'Save .txt',
    empty: 'Add an image, then select “Read text”', ready: 'Ready when you are. Select “Read text” to begin.',
    working: 'Reading the text in your image…', failed: 'Couldn’t read this image. Try a clearer image or another document language.',
    complete: 'Your text is ready', processing: 'Preparing and reading your image…',
    appearance: 'Switch color mode', language: 'Switch website language', ocrLanguage: 'Language in the image',
  },
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────
//
// [EN] All TypeScript types are defined here so they are easy to find and extend.
//      Keep types close to where they are used — if a type is only used by one
//      function, it can live next to that function instead.
//
// [TH] ประเภท TypeScript ทั้งหมดถูกกำหนดไว้ที่นี่เพื่อให้ค้นหาและขยายได้ง่าย
//      ควรเก็บ type ไว้ใกล้กับที่ใช้ — ถ้า type ถูกใช้แค่ฟังก์ชันเดียว
//      สามารถวางไว้ถัดจากฟังก์ชันนั้นแทนได้

/**
 * [EN] The resolved type of a Tesseract.js worker instance.
 *      Derived instead of imported because the package uses `export = Tesseract`
 *      (CommonJS namespace pattern), so named type imports do not resolve.
 *
 * [TH] ประเภทที่ resolve แล้วของ Tesseract.js worker instance
 *      ใช้การ derive แทนการ import เพราะ package ใช้ `export = Tesseract`
 *      (รูปแบบ CommonJS namespace) ทำให้ named type imports ไม่สามารถ resolve ได้
 */
type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;

/**
 * [EN] Tesseract language code passed to createWorker().
 *      'tha+eng' runs both Thai and English models simultaneously.
 *
 * [TH] รหัสภาษา Tesseract ที่ส่งให้ createWorker()
 *      'tha+eng' รันโมเดลทั้งไทยและอังกฤษพร้อมกัน
 */
type OCRLanguage = 'tha+eng' | 'eng' | 'tha';

/**
 * [EN] Finite state machine for the OCR pipeline.
 *      UI elements key off this type to decide what to render and what to disable.
 *
 * [TH] Finite state machine สำหรับ OCR pipeline
 *      UI elements ใช้ type นี้ตัดสินใจว่าจะ render อะไรและ disable อะไร
 *
 *  idle         → no image loaded or just reset
 *  preprocessing → canvas grayscale + Otsu threshold running
 *  loading      → Tesseract WASM + language data loading
 *  recognizing  → active text recognition (progress 0–100)
 *  done         → recognition complete
 *  error        → something went wrong
 */
type ProcessStatus =
  | 'idle'
  | 'preprocessing'
  | 'loading'
  | 'recognizing'
  | 'done'
  | 'error';

/**
 * [EN] One entry in the language <select> dropdown.
 * [TH] หนึ่งรายการใน <select> ดรอปดาวน์ภาษา
 */
interface LanguageOption {
  value: OCRLanguage;
  label: string;
}

/**
 * [EN] Holds the uploaded image together with its local object URL preview.
 *      The preview URL must be revoked when the image is replaced or on unmount
 *      to prevent memory leaks in long-running sessions.
 *
 * [TH] เก็บรูปภาพที่อัปโหลดพร้อมกับ object URL สำหรับ preview ในเครื่อง
 *      ต้อง revoke preview URL เมื่อเปลี่ยนรูปภาพหรือ unmount
 *      เพื่อป้องกัน memory leaks ในการใช้งานต่อเนื่องนาน
 */
interface UploadedImage {
  file: File;
  preview: string; // object URL — created by URL.createObjectURL(file)
}

/**
 * [EN] The slice of Tesseract's logger payload we actually inspect.
 *      The full payload has more fields, but only these matter for our UI.
 *
 * [TH] ส่วนของ logger payload จาก Tesseract ที่เราตรวจสอบจริงๆ
 *      payload เต็มมีฟิลด์มากกว่า แต่แค่นี้ที่สำคัญสำหรับ UI ของเรา
 */
interface TesseractLoggerMessage {
  status: string;   // [EN] lifecycle event name / [TH] ชื่อ lifecycle event
  progress: number; // [EN] 0.0–1.0               / [TH] 0.0–1.0
  jobId?: string;
  workerId?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
//
// [EN] Single source of truth for values used in multiple places.
//      To add a new language: append a { value, label } entry to LANGUAGE_OPTIONS.
//      Tesseract language codes live at: https://tesseract-ocr.github.io/tessdoc/Data-Files
//
// [TH] แหล่งข้อมูลเดียวสำหรับค่าที่ใช้หลายที่
//      หากต้องการเพิ่มภาษาใหม่: เพิ่ม { value, label } ใน LANGUAGE_OPTIONS
//      รหัสภาษา Tesseract: https://tesseract-ocr.github.io/tessdoc/Data-Files

/**
 * [EN] Language options rendered inside the <select> element.
 * [TH] ตัวเลือกภาษาที่แสดงภายใน element <select>
 */
const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'tha+eng', label: 'Thai + English' },
  { value: 'eng',     label: 'English Only'   },
  { value: 'tha',     label: 'Thai Only'       },
];

/**
 * [EN] Set of MIME types accepted by the upload zone.
 *      Using a Set gives O(1) lookup in the validation check.
 *
 * [TH] Set ของ MIME type ที่ upload zone ยอมรับ
 *      การใช้ Set ให้ O(1) lookup ในการตรวจสอบ
 */
const ACCEPTED_MIME = new Set(['image/png', 'image/jpeg']);

// ─── Image Preprocessing Utilities ─────────────────────────────────────────────
//
// [EN] Pure functions — no React hooks, no side-effects beyond the canvas API.
//      Preprocessing converts the image to high-contrast black & white before
//      Tesseract runs. This is especially important for Thai script because:
//        • Thai characters have thin strokes that blur at low contrast
//        • Tesseract's LSTM model performs significantly better on binary images
//        • Otsu's method adapts to each image's lighting without manual tuning
//
// [TH] ฟังก์ชันบริสุทธิ์ — ไม่มี React hooks, ไม่มี side-effects นอกจาก canvas API
//      การประมวลผลล่วงหน้าแปลงรูปภาพเป็นขาวดำ contrast สูงก่อน Tesseract ทำงาน
//      สิ่งนี้สำคัญโดยเฉพาะสำหรับตัวอักษรไทยเพราะ:
//        • ตัวอักษรไทยมีเส้นบางที่เบลอเมื่อ contrast ต่ำ
//        • LSTM model ของ Tesseract ทำงานได้ดีกว่ามากกับภาพ binary
//        • วิธี Otsu ปรับตัวกับแสงของแต่ละภาพโดยไม่ต้องปรับด้วยมือ

/**
 * [EN] Otsu's method — calculates the optimal global threshold that maximises
 *      inter-class variance between the foreground (text) and background pixels.
 *
 *      Time complexity: O(n) pixel scan + O(256) histogram scan → effectively O(n).
 *      Far superior to a fixed threshold (e.g. 128) because it automatically adapts
 *      to scanned documents, photographs, dark backgrounds, and low-contrast images.
 *
 * [TH] วิธี Otsu — คำนวณค่า threshold ที่เหมาะสมที่สุดทั่วภาพ
 *      ที่เพิ่ม inter-class variance ระหว่าง foreground (ตัวอักษร) และ background
 *
 *      ความซับซ้อนด้านเวลา: สแกนพิกเซล O(n) + สแกน histogram O(256) → O(n) จริงๆ
 *      ดีกว่า threshold ค่าคงที่ (เช่น 128) มากเพราะปรับตัวได้อัตโนมัติกับ
 *      เอกสารสแกน, ภาพถ่าย, พื้นหลังสีเข้ม และภาพ contrast ต่ำ
 *
 * @param data        [EN] Pixel buffer already converted to grayscale (R == G == B)
 *                    [TH] Pixel buffer ที่แปลงเป็น grayscale แล้ว (R == G == B)
 * @param pixelCount  [EN] Total pixels = canvas.width × canvas.height
 *                    [TH] พิกเซลทั้งหมด = canvas.width × canvas.height
 * @returns           [EN] Optimal threshold integer 0–255
 *                    [TH] ค่า threshold ที่เหมาะสม integer 0–255
 */
function otsuThreshold(data: Uint8ClampedArray, pixelCount: number): number {
  // [EN] Build a 256-bin histogram of grayscale intensity values.
  //      Because we already grayscale-converted above, data[i] (R channel) == gray.
  // [TH] สร้าง histogram ความเข้ม grayscale 256 ช่อง
  //      เพราะเราแปลง grayscale แล้ว data[i] (ช่อง R) == gray
  const hist = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;

  // [EN] Weighted sum of all intensity levels — used to compute class means
  // [TH] ผลรวมถ่วงน้ำหนักของทุกระดับความเข้ม — ใช้คำนวณค่าเฉลี่ยของกลุ่ม
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];

  let sumB = 0;   // [EN] running weighted sum for background class / [TH] ผลรวมถ่วงน้ำหนักสะสมสำหรับกลุ่ม background
  let wB   = 0;   // [EN] background class pixel count             / [TH] จำนวนพิกเซลกลุ่ม background
  let maxVar    = 0;
  let threshold = 128; // [EN] safe fallback / [TH] ค่า fallback ที่ปลอดภัย

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue; // [EN] no pixels at this level yet / [TH] ยังไม่มีพิกเซลที่ระดับนี้

    const wF = pixelCount - wB;
    if (wF === 0) break;    // [EN] all pixels consumed           / [TH] ใช้พิกเซลทั้งหมดแล้ว

    sumB += t * hist[t];
    const mB = sumB / wB;                        // [EN] background mean / [TH] ค่าเฉลี่ย background
    const mF = (sumAll - sumB) / wF;             // [EN] foreground mean / [TH] ค่าเฉลี่ย foreground

    // [EN] Between-class variance — maximise this to find the optimal split point
    // [TH] ความแปรปรวนระหว่างกลุ่ม — ทำให้สูงสุดเพื่อหาจุดแบ่งที่เหมาะสม
    const variance = wB * wF * (mB - mF) ** 2;

    if (variance > maxVar) {
      maxVar    = variance;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * [EN] Preprocesses an image File on an offscreen HTML5 Canvas in two passes:
 *        Pass 1 — Luminance-weighted grayscale   (ITU-R BT.601 luma coefficients)
 *        Pass 2 — Otsu threshold  →  binary black & white
 *
 *      Returns both the finished canvas (fed directly to Tesseract as an ImageLike)
 *      and a lossless PNG data-URL (used to update the UI preview).
 *
 *      Using HTMLCanvasElement as the Tesseract source avoids re-encoding the image
 *      to a Blob — Tesseract reads the canvas pixel buffer directly.
 *
 * [TH] ประมวลผลรูปภาพ File บน HTML5 Canvas นอกหน้าจอสองรอบ:
 *        รอบ 1 — Grayscale ถ่วงน้ำหนักด้วย Luminance  (สัมประสิทธิ์ luma ITU-R BT.601)
 *        รอบ 2 — Otsu threshold  →  ขาวดำ binary
 *
 *      คืนทั้ง canvas ที่เสร็จแล้ว (ส่งตรงให้ Tesseract เป็น ImageLike)
 *      และ PNG data-URL แบบ lossless (ใช้อัปเดต preview ใน UI)
 *
 *      การใช้ HTMLCanvasElement เป็น source ของ Tesseract หลีกเลี่ยงการ re-encode รูปภาพ
 *      เป็น Blob — Tesseract อ่าน pixel buffer ของ canvas โดยตรง
 *
 * @param file  [EN] Source image — PNG or JPEG File object
 *              [TH] รูปภาพต้นทาง — object File ที่เป็น PNG หรือ JPEG
 */
async function preprocessImage(
  file: File,
): Promise<{ canvas: HTMLCanvasElement; previewDataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img    = new Image();
    const tmpUrl = URL.createObjectURL(file);

    img.onload = () => {
      // [EN] Revoke the temporary object URL as soon as the <img> element has
      //      decoded the image — we no longer need the URL after this point.
      // [TH] Revoke object URL ชั่วคราวทันทีที่ element <img> ถอดรหัสรูปภาพแล้ว
      //      เราไม่ต้องการ URL อีกต่อไปหลังจากจุดนี้
      URL.revokeObjectURL(tmpUrl);

      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // [EN] willReadFrequently: signals to the browser that getImageData()
      //      will be called multiple times, allowing it to keep pixel data in CPU
      //      memory instead of GPU VRAM for faster reads.
      // [TH] willReadFrequently: แจ้งเบราว์เซอร์ว่า getImageData() จะถูกเรียกหลายครั้ง
      //      ทำให้เบราว์เซอร์เก็บข้อมูลพิกเซลใน CPU memory แทน GPU VRAM
      //      เพื่อการอ่านที่เร็วกว่า
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      const frame  = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = frame;
      const pixels = width * height;

      // ── Pass 1: Luminance-weighted grayscale ───────────────────────────
      // [EN] Convert RGB → gray using the standard ITU-R BT.601 luma formula.
      //      These coefficients reflect human perception: green contributes most
      //      to perceived brightness, red next, blue least.
      //      The bitwise OR ( | 0 ) truncates to integer, replacing Math.floor().
      // [TH] แปลง RGB → gray ด้วยสูตร luma ITU-R BT.601 มาตรฐาน
      //      สัมประสิทธิ์เหล่านี้สะท้อนการรับรู้ของมนุษย์: สีเขียวมีส่วนมากที่สุด
      //      ต่อความสว่างที่รับรู้, สีแดงรองลงมา, สีน้ำเงินน้อยที่สุด
      //      Bitwise OR ( | 0 ) ตัดทศนิยมเป็น integer แทน Math.floor()
      for (let i = 0; i < data.length; i += 4) {
        const g = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
        data[i] = data[i + 1] = data[i + 2] = g;
        // [EN] data[i + 3] is the alpha channel — leave it untouched
        // [TH] data[i + 3] คือช่อง alpha — ไม่ต้องแตะต้อง
      }

      // ── Pass 2: Otsu threshold → binary black & white ─────────────────
      // [EN] Every pixel whose grayscale value meets or exceeds the Otsu threshold
      //      becomes pure white (255); every pixel below becomes pure black (0).
      //      This maximises the contrast between text strokes and the background.
      // [TH] พิกเซลทุกตัวที่มีค่า grayscale เท่ากับหรือเกิน Otsu threshold
      //      กลายเป็นขาวบริสุทธิ์ (255); ทุกตัวที่ต่ำกว่ากลายเป็นดำบริสุทธิ์ (0)
      //      ทำให้ contrast ระหว่างเส้นตัวอักษรและพื้นหลังสูงสุด
      const t = otsuThreshold(data, pixels);
      for (let i = 0; i < data.length; i += 4) {
        const bw = data[i] >= t ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = bw;
      }

      ctx.putImageData(frame, 0, 0);

      // [EN] Export as lossless PNG — JPEG compression would reintroduce artefacts
      //      that blur thin strokes and degrade OCR accuracy.
      // [TH] Export เป็น PNG แบบ lossless — การบีบอัด JPEG จะนำ artefact กลับมา
      //      ซึ่งจะเบลอเส้นบางและลดความแม่นยำ OCR
      const previewDataUrl = canvas.toDataURL('image/png');
      resolve({ canvas, previewDataUrl });
    };

    img.onerror = () => {
      URL.revokeObjectURL(tmpUrl);
      reject(new Error('Failed to decode image for preprocessing'));
    };

    img.src = tmpUrl;
  });
}

// ─── Main Component ─────────────────────────────────────────────────────────────
//
// [EN] Single page — all state, logic, and render live here.
//      The component is intentionally self-contained to make it easy to copy,
//      port, or embed in another project without hunting across multiple files.
//
// [TH] หน้าเดียว — state, logic และ render ทั้งหมดอยู่ที่นี่
//      Component ถูกออกแบบให้ self-contained เพื่อให้ copy, port หรือฝัง
//      ในโปรเจกต์อื่นได้ง่ายโดยไม่ต้องค้นหาหลายไฟล์

export default function Home() {

  const [uiLanguage, setUiLanguage] = useState<UILanguage>('th');
  const [theme, setTheme] = useState<Theme>('light');
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [ocrMenuOpen, setOcrMenuOpen] = useState(false);
  const ocrMenuRef = useRef<HTMLDivElement>(null);

  // ── State ────────────────────────────────────────────────────────────────────
  //
  // [EN] Every piece of UI-driven mutable data lives here.
  //      State is named after *what it represents*, not *how it is used*.
  //
  // [TH] ข้อมูลที่เปลี่ยนแปลงได้ทุกชิ้นที่ขับเคลื่อน UI อยู่ที่นี่
  //      State ตั้งชื่อตาม *สิ่งที่แสดง* ไม่ใช่ *วิธีที่ใช้*

  // [EN] The image the user has uploaded (null until first upload)
  // [TH] รูปภาพที่ผู้ใช้อัปโหลด (null จนกว่าจะอัปโหลดครั้งแรก)
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

  // [EN] PNG data-URL of the B&W canvas result — set after preprocessing succeeds.
  //      Displayed in the upload zone so users see what Tesseract actually receives.
  //      Null until the Extract button is pressed.
  // [TH] PNG data-URL ของผล canvas B&W — ตั้งค่าหลังประมวลผลล่วงหน้าสำเร็จ
  //      แสดงใน upload zone เพื่อให้ผู้ใช้เห็นสิ่งที่ Tesseract ได้รับจริงๆ
  //      Null จนกว่าจะกดปุ่ม Extract
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);

  // [EN] OCR language — controls which Tesseract traineddata files are loaded.
  //      Default: 'tha+eng' (both models run together, ideal for mixed documents)
  // [TH] ภาษา OCR — ควบคุมว่า Tesseract จะโหลดไฟล์ traineddata ใด
  //      ค่าเริ่มต้น: 'tha+eng' (ทั้งสองโมเดลทำงานร่วมกัน เหมาะสำหรับเอกสารผสม)
  const [language, setLanguage] = useState<OCRLanguage>('tha+eng');

  // [EN] Current step in the OCR pipeline — the single source of truth for
  //      which UI controls are enabled/disabled and what the status card shows.
  // [TH] ขั้นตอนปัจจุบันใน OCR pipeline — แหล่งข้อมูลเดียวสำหรับ
  //      UI controls ที่เปิด/ปิดใช้งานและสิ่งที่ status card แสดง
  const [status, setStatus] = useState<ProcessStatus>('idle');

  // [EN] Progress value 0–100 used by the determinate progress bar during 'recognizing'.
  //      Also updated during 'loading language traineddata' logger events.
  // [TH] ค่าความคืบหน้า 0–100 ที่ใช้กับ progress bar แบบกำหนดได้ระหว่าง 'recognizing'
  //      อัปเดตระหว่าง logger event 'loading language traineddata' ด้วย
  const [progress, setProgress] = useState<number>(0);

  // [EN] Short human-readable label updated at each Tesseract logger event.
  //      Shown inside the status card beneath the progress bar.
  // [TH] ป้ายข้อความสั้นที่อ่านได้ อัปเดตที่แต่ละ Tesseract logger event
  //      แสดงภายใน status card ใต้ progress bar
  const [statusLabel, setStatusLabel] = useState<string>('');

  // [EN] The OCR output text. Editable — users can correct recognition errors
  //      before copying to clipboard or downloading as a file.
  // [TH] ข้อความ output จาก OCR ที่แก้ไขได้ — ผู้ใช้สามารถแก้ไขข้อผิดพลาดการจดจำ
  //      ก่อน copy ไปยัง clipboard หรือดาวน์โหลดเป็นไฟล์
  const [resultText, setResultText] = useState<string>('');

  // [EN] Error message displayed when status === 'error'.
  //      Kept separate from statusLabel so error styling can be applied independently.
  // [TH] ข้อความแสดงข้อผิดพลาดเมื่อ status === 'error'
  //      แยกจาก statusLabel เพื่อให้ใช้ error styling ได้อิสระ
  const [errorMsg, setErrorMsg] = useState<string>('');

  // [EN] Tracks whether a dragged file is currently over the upload zone.
  //      Drives the blue highlight / icon colour change during drag.
  // [TH] ติดตามว่ากำลังมีไฟล์ที่ลากอยู่เหนือ upload zone หรือไม่
  //      ควบคุมการเน้นสีน้ำเงิน / การเปลี่ยนสีไอคอนระหว่าง drag
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // [EN] Drives the temporary "Copied!" success state on the Copy button.
  //      Automatically resets to false after 2 seconds via a timer ref.
  // [TH] ควบคุมสถานะ "คัดลอกแล้ว!" ชั่วคราวบนปุ่ม Copy
  //      รีเซ็ตเป็น false อัตโนมัติหลัง 2 วินาทีผ่าน timer ref
  const [copied, setCopied] = useState<boolean>(false);

  const t = UI_TEXT[uiLanguage];

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!ocrMenuRef.current?.contains(event.target as Node)) setOcrMenuOpen(false);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOcrMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('projectocr-theme') as Theme | null;
    const savedLanguage = localStorage.getItem('projectocr-language') as UILanguage | null;
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
    if (savedLanguage === 'th' || savedLanguage === 'en') setUiLanguage(savedLanguage);
    setPreferencesReady(true);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.lang = uiLanguage;
    localStorage.setItem('projectocr-theme', theme);
    localStorage.setItem('projectocr-language', uiLanguage);
  }, [theme, uiLanguage, preferencesReady]);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  //
  // [EN] Refs hold mutable values that must survive re-renders but must NOT
  //      trigger re-renders when changed. Use refs for: DOM nodes, timers,
  //      external resources (workers), and values only read inside callbacks.
  //
  // [TH] Refs เก็บค่าที่เปลี่ยนแปลงได้ซึ่งต้องอยู่รอดตาม re-renders
  //      แต่ต้องไม่กระตุ้น re-render เมื่อเปลี่ยน ใช้ refs สำหรับ: DOM nodes,
  //      timers, external resources (workers) และค่าที่อ่านเฉพาะใน callbacks

  // [EN] Active Tesseract worker — stored so we can terminate it on unmount
  //      and before starting a new recognition run (prevents zombie workers).
  // [TH] Tesseract worker ที่ทำงานอยู่ — เก็บเพื่อ terminate เมื่อ unmount
  //      และก่อนเริ่มการจดจำใหม่ (ป้องกัน zombie workers)
  const workerRef = useRef<TesseractWorker | null>(null);

  // [EN] Reference to the hidden <input type="file"> DOM node.
  //      Called programmatically via openFilePicker() when the zone or button is clicked.
  // [TH] การอ้างอิง DOM node <input type="file"> ที่ซ่อนอยู่
  //      เรียกใช้ด้วยโค้ดผ่าน openFilePicker() เมื่อคลิก zone หรือปุ่ม
  const fileInputRef = useRef<HTMLInputElement>(null);

  // [EN] Holds the current preview object URL so we can revoke it precisely
  //      when the image changes — avoids a useEffect dependency on uploadedImage
  //      which would run the cleanup on every render cycle, not just on change.
  // [TH] เก็บ preview object URL ปัจจุบัน เพื่อ revoke ได้อย่างแม่นยำ
  //      เมื่อรูปภาพเปลี่ยน — หลีกเลี่ยง useEffect dependency บน uploadedImage
  //      ซึ่งจะรัน cleanup ทุก render cycle ไม่ใช่แค่เมื่อเปลี่ยน
  const previewRef = useRef<string | null>(null);

  // [EN] Stores the copy-reset setTimeout ID so we can cancel it on unmount,
  //      preventing "setState called on an unmounted component" warnings.
  // [TH] เก็บ ID ของ setTimeout รีเซ็ต copy เพื่อยกเลิกได้เมื่อ unmount
  //      ป้องกัน warning "setState called on an unmounted component"
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Lifecycle: cleanup on unmount ───────────────────────────────────────────
  //
  // [EN] This effect runs exactly once when the component mounts (empty deps array)
  //      and returns a cleanup function that fires on unmount.
  //      Three resources need cleanup:
  //        1. The Tesseract worker (WebWorker + WASM memory)
  //        2. The preview object URL (browser memory)
  //        3. The copy-reset timer (avoids calling setState after unmount)
  //
  // [TH] Effect นี้ทำงานครั้งเดียวเมื่อ component mount (deps array ว่าง)
  //      และคืน cleanup function ที่ทำงานเมื่อ unmount
  //      มีทรัพยากรสามอย่างที่ต้อง cleanup:
  //        1. Tesseract worker (WebWorker + WASM memory)
  //        2. Preview object URL (browser memory)
  //        3. Timer รีเซ็ต copy (หลีกเลี่ยงการเรียก setState หลัง unmount)

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (previewRef.current)   URL.revokeObjectURL(previewRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // ── File handling callbacks ──────────────────────────────────────────────────

  /**
   * [EN] Validates and loads a File into state. Creates a local object URL
   *      for the <img> preview and revokes any previously held URL.
   *      Also resets all pipeline state so a fresh Extract run starts clean.
   *
   * [TH] ตรวจสอบและโหลด File เข้า state สร้าง object URL ในเครื่อง
   *      สำหรับ preview ใน <img> และ revoke URL ที่เก็บไว้ก่อนหน้า
   *      รีเซ็ต pipeline state ทั้งหมดด้วยเพื่อให้ Extract ใหม่เริ่มสะอาด
   */
  const loadFile = useCallback((file: File) => {
    // [EN] Reject unsupported formats before touching state
    // [TH] ปฏิเสธรูปแบบที่ไม่รองรับก่อนแตะ state
    if (!ACCEPTED_MIME.has(file.type)) {
      setErrorMsg('Unsupported format. Please upload a PNG or JPEG image.');
      setStatus('error');
      return;
    }

    // [EN] Revoke the previous URL to free browser memory immediately
    // [TH] Revoke URL เดิมเพื่อปลดปล่อย browser memory ทันที
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const preview = URL.createObjectURL(file);
    previewRef.current = preview;

    setUploadedImage({ file, preview });
    setProcessedPreview(null); // [EN] reset B&W preview / [TH] รีเซ็ต preview B&W
    setResultText('');
    setStatus('idle');
    setStatusLabel('');
    setErrorMsg('');
    setProgress(0);
  }, []);

  // [EN] DragEvent handlers — called by the upload zone div.
  //      preventDefault() is required on dragover to enable drop (browser default blocks it).
  // [TH] handlers DragEvent — เรียกโดย div upload zone
  //      ต้องเรียก preventDefault() บน dragover เพื่อเปิดใช้งาน drop (เบราว์เซอร์บล็อก default)

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    // [EN] dataTransfer.files[0]: take only the first dropped file
    // [TH] dataTransfer.files[0]: รับเฉพาะไฟล์แรกที่วาง
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  // [EN] <input type="file"> onChange handler.
  //      Resetting e.target.value after read allows the user to re-select
  //      the same file and get a fresh loadFile() call (input onChange would
  //      otherwise fire only when the value *changes*).
  // [TH] handler onChange ของ <input type="file">
  //      การรีเซ็ต e.target.value หลังอ่าน ทำให้ผู้ใช้เลือกไฟล์เดิมซ้ำได้
  //      และได้รับ loadFile() call ใหม่ (onChange จะ fire เฉพาะเมื่อค่า *เปลี่ยน*)
  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = '';
  }, [loadFile]);

  // [EN] Clears the uploaded image and resets all related state to initial values.
  //      Also revokes the preview object URL to free browser memory.
  // [TH] ล้างรูปภาพที่อัปโหลดและรีเซ็ต state ที่เกี่ยวข้องทั้งหมดเป็นค่าเริ่มต้น
  //      รวมถึง revoke preview object URL เพื่อปลดปล่อย browser memory
  const clearImage = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setUploadedImage(null);
    setProcessedPreview(null);
    setResultText('');
    setStatus('idle');
    setStatusLabel('');
    setErrorMsg('');
    setProgress(0);
  }, []);

  // [EN] Triggers the hidden <input type="file"> programmatically.
  //      Called when the user clicks the drop zone or presses Enter/Space on it.
  // [TH] เรียก <input type="file"> ที่ซ่อนอยู่ด้วยโค้ด
  //      เรียกใช้เมื่อผู้ใช้คลิก drop zone หรือกด Enter/Space บน drop zone
  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

  // ── OCR Pipeline ─────────────────────────────────────────────────────────────
  //
  // [EN] runOCR orchestrates the full pipeline in sequence:
  //        1. Canvas preprocessing   (grayscale → Otsu threshold → B&W canvas)
  //        2. Tesseract worker init  (WASM load + language traineddata download)
  //        3. Text recognition       (LSTM inference, progress 0–100)
  //        4. Result + cleanup       (set text, terminate worker)
  //
  // [TH] runOCR ควบคุม pipeline ทั้งหมดตามลำดับ:
  //        1. Canvas preprocessing   (grayscale → Otsu threshold → B&W canvas)
  //        2. Tesseract worker init  (โหลด WASM + ดาวน์โหลด language traineddata)
  //        3. Text recognition       (LSTM inference, ความคืบหน้า 0–100)
  //        4. ผลลัพธ์ + cleanup      (ตั้งค่าข้อความ, ยุติ worker)

  const runOCR = useCallback(async () => {
    // [EN] Guard: abort immediately if no image is loaded or a run is in progress.
    //      Checking status directly (not isProcessing) keeps this callback lean.
    // [TH] Guard: หยุดทันทีถ้าไม่มีรูปภาพหรือกำลังประมวลผลอยู่
    //      ตรวจสอบ status โดยตรง (ไม่ใช่ isProcessing) เพื่อให้ callback กระชับ
    if (
      !uploadedImage ||
      status === 'preprocessing' ||
      status === 'loading'       ||
      status === 'recognizing'
    ) return;

    // [EN] Terminate any worker left from a previous run.
    //      Prevents multiple workers accumulating in memory.
    // [TH] ยุติ worker ที่เหลือจากการทำงานก่อนหน้า
    //      ป้องกัน worker หลายตัวสะสมใน memory
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }

    // [EN] Reset all pipeline state before starting the new run
    // [TH] รีเซ็ต pipeline state ทั้งหมดก่อนเริ่มการทำงานใหม่
    setStatus('preprocessing');
    setStatusLabel('Preprocessing image…');
    setProgress(0);
    setResultText('');
    setErrorMsg('');
    setProcessedPreview(null);

    // ── Step 1: Canvas preprocessing ────────────────────────────────────
    // [EN] This is intentionally non-fatal: if the canvas throws (e.g. the image
    //      is too large and exhausts GPU memory), we log nothing to the user and
    //      fall back to the raw File — OCR will still run, just unenhanced.
    // [TH] ตั้งใจให้ไม่ fatal: ถ้า canvas throw (เช่น รูปภาพใหญ่เกินไปจน GPU memory หมด)
    //      เราไม่แจ้งผู้ใช้และ fallback ไปใช้ File ดิบ — OCR ยังทำงานได้ แค่ไม่ได้ปรับปรุง
    let ocrSource: HTMLCanvasElement | File = uploadedImage.file;
    try {
      const { canvas, previewDataUrl } = await preprocessImage(uploadedImage.file);
      ocrSource = canvas;
      // [EN] Swap the upload zone preview to show the B&W processed image
      // [TH] สลับ preview ใน upload zone เพื่อแสดงรูปภาพ B&W ที่ประมวลผลแล้ว
      setProcessedPreview(previewDataUrl);
    } catch {
      // [EN] Fallback to original — preprocessing failure is silent
      // [TH] Fallback ไปใช้รูปภาพเดิม — ความล้มเหลวการประมวลผลไม่แจ้งผู้ใช้
    }

    // ── Step 2: Create Tesseract worker ─────────────────────────────────
    // [EN] createWorker(langs, oem, options)
    //      • langs: Tesseract language code(s), e.g. 'tha+eng'
    //      • oem:   OCR Engine Mode — 1 = LSTM_ONLY (most accurate, recommended)
    //      • options.logger: called at every lifecycle event with progress data
    //
    // [TH] createWorker(langs, oem, options)
    //      • langs:  รหัสภาษา Tesseract เช่น 'tha+eng'
    //      • oem:    OCR Engine Mode — 1 = LSTM_ONLY (แม่นยำที่สุด, แนะนำ)
    //      • options.logger: เรียกทุก lifecycle event พร้อมข้อมูลความคืบหน้า
    setStatus('loading');
    setStatusLabel('Starting Tesseract engine…');

    try {
      const worker = await createWorker(language, 1, {
        logger: (m: TesseractLoggerMessage) => {
          const pct = Math.round(m.progress * 100);

          switch (m.status) {
            case 'loading tesseract core':
              // [EN] Tesseract's WASM binary is being fetched and compiled.
              //      This is a one-time cost per page load; cached by the browser after.
              // [TH] WASM binary ของ Tesseract กำลังถูกดึงและคอมไพล์
              //      ต้นทุนครั้งเดียวต่อการโหลดหน้า; เบราว์เซอร์ cache ไว้หลังจากนี้
              setStatusLabel('Loading Tesseract core…');
              break;

            case 'loading language traineddata':
              // [EN] The language model file is downloading. Thai ('tha') is ~10 MB,
              //      English ('eng') is ~4 MB. Subsequent runs use the browser cache.
              // [TH] ไฟล์โมเดลภาษากำลังดาวน์โหลด Thai ('tha') ประมาณ ~10 MB,
              //      English ('eng') ประมาณ ~4 MB การทำงานครั้งถัดไปใช้ browser cache
              setStatusLabel(`Downloading language data… ${pct}%`);
              setProgress(pct);
              break;

            case 'initializing api':
              // [EN] Tesseract's internal API is being set up with the loaded data
              // [TH] API ภายในของ Tesseract กำลังถูกตั้งค่าด้วยข้อมูลที่โหลดมา
              setStatusLabel('Initializing OCR engine…');
              break;

            case 'recognizing text':
              // [EN] Actual LSTM inference running — progress is now a real percentage.
              //      Flip status to 'recognizing' so the progress bar switches from
              //      indeterminate pulse to a real width-based bar.
              // [TH] กำลัง inference LSTM จริงๆ — ความคืบหน้าตอนนี้เป็นเปอร์เซ็นต์จริง
              //      เปลี่ยน status เป็น 'recognizing' เพื่อให้ progress bar เปลี่ยน
              //      จาก indeterminate pulse เป็นแถบที่ใช้ width จริง
              setStatus('recognizing');
              setProgress(pct);
              setStatusLabel(`Recognizing text… ${pct}%`);
              break;
          }
        },
      });

      // [EN] Stash the worker ref before the async recognize call
      //      so the cleanup effect can terminate it even if recognition is mid-flight
      // [TH] เก็บ ref ของ worker ก่อน recognize call แบบ async
      //      เพื่อให้ cleanup effect ยุติได้แม้การจดจำกำลังดำเนินอยู่
      workerRef.current = worker;

      // ── Step 3: Run recognition ────────────────────────────────────────
      // [EN] Pass the preprocessed canvas (or original file on preprocessing failure).
      //      Tesseract accepts HTMLCanvasElement natively as an ImageLike.
      //      trimEnd() removes the trailing '\n' that Tesseract always appends.
      // [TH] ส่ง canvas ที่ประมวลผลแล้ว (หรือไฟล์เดิมถ้าประมวลผลล้มเหลว)
      //      Tesseract รับ HTMLCanvasElement เป็น ImageLike ได้โดยตรง
      //      trimEnd() ลบ '\n' ท้ายที่ Tesseract เพิ่มเสมอ
      const { data } = await worker.recognize(ocrSource);

      setResultText(data.text.trimEnd());
      setStatus('done');
      setProgress(100);
      setStatusLabel('Extraction complete');

      // ── Step 4: Cleanup ────────────────────────────────────────────────
      // [EN] Terminate immediately after use — frees the WebWorker thread and
      //      the WASM memory (~40–80 MB) so the page stays responsive.
      // [TH] ยุติทันทีหลังใช้งาน — ปลดปล่อย WebWorker thread
      //      และ WASM memory (~40–80 MB) เพื่อให้หน้าตอบสนองได้ดี
      await worker.terminate();
      workerRef.current = null;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setStatus('error');
      setStatusLabel('');
    }
  }, [uploadedImage, language, status]);

  // ── Toolbar action callbacks ─────────────────────────────────────────────────

  /**
   * [EN] Copies resultText to the system clipboard using the async Clipboard API.
   *      The "Copied!" button state persists for 2 seconds then resets.
   *      Wrapped in try/catch because the Clipboard API requires HTTPS (or localhost)
   *      and may be blocked in sandboxed iframes or cross-origin contexts.
   *
   * [TH] คัดลอก resultText ไปยัง clipboard ของระบบด้วย async Clipboard API
   *      สถานะปุ่ม "คัดลอกแล้ว!" อยู่นาน 2 วินาทีแล้วรีเซ็ต
   *      ครอบด้วย try/catch เพราะ Clipboard API ต้องการ HTTPS (หรือ localhost)
   *      และอาจถูกบล็อกใน sandboxed iframes หรือบริบท cross-origin
   */
  const handleCopy = useCallback(async () => {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      // [EN] Cancel any in-flight timer so rapid double-clicks don't reset early
      // [TH] ยกเลิก timer ที่กำลังทำงานเพื่อให้การดับเบิลคลิกรวดเร็วไม่รีเซ็ตก่อนเวลา
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // [EN] Clipboard API unavailable — fail silently (no UI error shown)
      // [TH] Clipboard API ไม่พร้อมใช้งาน — ล้มเหลวโดยไม่แจ้ง (ไม่แสดง error ใน UI)
    }
  }, [resultText]);

  /**
   * [EN] Creates a Blob with explicit UTF-8 encoding and triggers a browser download.
   *
   *      The UTF-8 BOM character '﻿' is prepended to the Blob content.
   *      It is required for Thai characters to render correctly when the .txt file
   *      is opened in Windows editors (Notepad, Excel, VS Code on Windows) that rely
   *      on the BOM to detect UTF-8 vs. the Windows-1252 default encoding.
   *      On macOS/Linux the BOM is harmless but some parsers may need to strip it.
   *
   *      The download filename is derived from the original image filename
   *      (extension stripped, .txt appended) for traceability.
   *
   * [TH] สร้าง Blob ที่เข้ารหัส UTF-8 อย่างชัดเจนและกระตุ้น browser download
   *
   *      อักขระ UTF-8 BOM '﻿' ถูกเติมไว้หน้าเนื้อหา Blob
   *      จำเป็นสำหรับตัวอักษรไทยเพื่อแสดงผลถูกต้องเมื่อเปิดไฟล์ .txt
   *      ใน Windows editor (Notepad, Excel, VS Code บน Windows) ที่ใช้
   *      BOM ในการตรวจจับ UTF-8 เทียบกับ encoding เริ่มต้น Windows-1252
   *      บน macOS/Linux BOM ไม่มีผลเสีย แต่ parser บางตัวอาจต้องตัดออก
   *
   *      ชื่อไฟล์ download มาจากชื่อไฟล์รูปภาพเดิม
   *      (ตัด extension เดิม, เพิ่ม .txt) เพื่อการ trace กลับได้
   */
  const handleDownload = useCallback(() => {
    if (!resultText) return;

    // [EN] '﻿' is the Unicode BOM (Byte Order Mark) — same as '﻿' but explicit
    // [TH] '﻿' คือ Unicode BOM (Byte Order Mark) — เหมือน '﻿' แต่ชัดเจนกว่า
    const blob = new Blob(
      ['﻿', resultText],
      { type: 'text/plain;charset=utf-8' },
    );

    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `${uploadedImage?.file.name.replace(/\.[^/.]+$/, '') ?? 'ocr-result'}.txt`;
    a.click();

    // [EN] Revoke immediately — the browser has queued the download by this point
    // [TH] Revoke ทันที — เบราว์เซอร์ได้เพิ่มการดาวน์โหลดในคิวแล้วตรงนี้
    URL.revokeObjectURL(url);
  }, [resultText, uploadedImage]);

  /**
   * [EN] Makes the upload zone div operable via keyboard (Enter / Space).
   *      Required for WCAG 2.1 Level AA keyboard accessibility compliance.
   *      Only activates when no image is loaded (with an image, the zone shows
   *      an <img> with hover buttons which have their own keyboard handling).
   *
   * [TH] ทำให้ div upload zone ใช้งานได้ด้วยแป้นพิมพ์ (Enter / Space)
   *      จำเป็นสำหรับ WCAG 2.1 Level AA keyboard accessibility compliance
   *      ทำงานเฉพาะเมื่อไม่มีรูปภาพ (มีรูปภาพ, zone แสดง <img>
   *      พร้อมปุ่ม hover ที่มีการจัดการแป้นพิมพ์ของตัวเอง)
   */
  const handleZoneKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (!uploadedImage && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openFilePicker();
    }
  }, [uploadedImage, openFilePicker]);

  // ── Derived state ────────────────────────────────────────────────────────────
  //
  // [EN] Computed values — no extra useState needed. React recomputes these
  //      on every render where their inputs change.
  //
  // [TH] ค่าที่คำนวณได้ — ไม่ต้องใช้ useState เพิ่มเติม React คำนวณใหม่
  //      ทุก render ที่ input เปลี่ยนแปลง

  // [EN] True while any async step is running — blocks Extract and language select
  // [TH] True ขณะที่ขั้นตอน async ใดๆ กำลังทำงาน — บล็อก Extract และ language select
  const isProcessing = (
    status === 'preprocessing' ||
    status === 'loading'       ||
    status === 'recognizing'
  );

  // [EN] True once the textarea has content — enables Copy and Download buttons
  // [TH] True เมื่อ textarea มีเนื้อหา — เปิดใช้งานปุ่ม Copy และ Download
  const hasResult = resultText.length > 0;

  // [EN] Quick word count — split on any whitespace, filter empty tokens
  // [TH] จำนวนคำเร็วๆ — แบ่งตามช่องว่างใดๆ, กรอง token ว่าง
  const wordCount = hasResult ? resultText.split(/\s+/).filter(Boolean).length : 0;

  // [EN] True once preprocessing succeeds and processedPreview holds a data-URL
  // [TH] True เมื่อการประมวลผลล่วงหน้าสำเร็จและ processedPreview มี data-URL
  const isPreprocessed = processedPreview !== null;

  // [EN] The <img> src: use B&W processed version when available,
  //      fall back to the original object URL preview otherwise
  // [TH] src ของ <img>: ใช้เวอร์ชัน B&W ที่ประมวลผลแล้วเมื่อมี,
  //      fallback ไปใช้ preview object URL เดิมถ้าไม่มี
  const previewSrc = processedPreview ?? uploadedImage?.preview;

  // [EN] File size formatted for display (KB under 1 MB, MB at or above)
  // [TH] ขนาดไฟล์ที่จัดรูปแบบสำหรับแสดงผล (KB ต่ำกว่า 1 MB, MB ตั้งแต่ 1 MB ขึ้นไป)
  const fileSizeLabel = uploadedImage
    ? uploadedImage.file.size >= 1_048_576
      ? `${(uploadedImage.file.size / 1_048_576).toFixed(1)} MB`
      : `${(uploadedImage.file.size / 1024).toFixed(0)} KB`
    : '';

  // ── Render ───────────────────────────────────────────────────────────────────
  //
  // [EN] Layout structure:
  //        <header>  sticky frosted-glass nav bar
  //        <main>
  //          page heading
  //          <grid>
  //            left panel:   upload zone, file info, language + extract, status card
  //            right panel:  toolbar (copy / download), editable result textarea
  //          </grid>
  //        </main>
  //
  // [TH] โครงสร้าง Layout:
  //        <header>  nav bar กระจกฝ้าติดจอ
  //        <main>
  //          หัวข้อหน้า
  //          <grid>
  //            panel ซ้าย:   upload zone, ข้อมูลไฟล์, ภาษา + extract, status card
  //            panel ขวา:    toolbar (copy / download), result textarea ที่แก้ไขได้
  //          </grid>
  //        </main>

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8faff] text-slate-950 transition-colors dark:bg-[#090d18] dark:text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-48 h-[460px] w-[460px] rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-700/15" />
        <div className="absolute -right-36 top-52 h-[400px] w-[400px] rounded-full bg-fuchsia-300/20 blur-3xl dark:bg-fuchsia-700/10" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl dark:bg-cyan-700/10" />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      {/* [EN] Sticky frosted-glass header with backdrop blur.
              z-10 keeps it above floating elements during scroll.
          [TH] Header กระจกฝ้าติดจอพร้อม backdrop blur
              z-10 ทำให้อยู่เหนือ element ลอยตัวระหว่าง scroll */}
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/70 shadow-[0_1px_0_rgba(15,23,42,.04)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#090d18]/75">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          {/* Logo + app name */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20 ring-1 ring-white/40">
              <ScanText className="h-[19px] w-[19px] text-white" strokeWidth={2.4} />
              <span className="absolute inset-x-1.5 top-1/2 h-px bg-cyan-200/80 shadow-[0_0_6px_#67e8f9]" />
            </div>
            <div className="font-display leading-none"><span className="block text-sm font-bold tracking-tight sm:text-base">Project<span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">OCR</span></span><span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[.2em] text-slate-400 sm:block">Smart text scanner</span></div>
          </div>
          {/* [EN] Privacy notice — hidden on small screens (sm:inline-block)
              [TH] ประกาศความเป็นส่วนตัว — ซ่อนบนหน้าจอเล็ก (sm:inline-block) */}
          <div className="flex items-center gap-1.5">
            <nav aria-label={uiLanguage === 'th' ? 'เมนูหลัก' : 'Main navigation'} className="mr-2 hidden items-center gap-1 md:flex">
              <a href="#tool" className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-blue-300">{uiLanguage === 'th' ? 'เครื่องมือ' : 'Tool'}</a>
              <a href="#how-it-works" className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-blue-300">{uiLanguage === 'th' ? 'วิธีใช้' : 'How it works'}</a>
              <a href="#resources" className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-blue-300">{uiLanguage === 'th' ? 'แหล่งเรียนรู้' : 'Resources'}</a>
            </nav>
            <span className="mr-2 hidden text-xs text-slate-500 lg:inline">{t.privacy}</span>
            <button type="button" onClick={() => setUiLanguage(uiLanguage === 'th' ? 'en' : 'th')} aria-label={t.language} title={t.language} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
              <Languages className="h-4 w-4" /><span>{uiLanguage === 'th' ? 'EN' : 'ไทย'}</span>
            </button>
            <button type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={t.appearance} title={t.appearance} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-12">

        {/* Page heading */}
        <div className="mb-7 max-w-3xl sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-3 py-1 text-[11px] font-semibold text-blue-700 shadow-sm dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,.15)]" />{uiLanguage === 'th' ? 'อ่านได้ทั้งภาษาไทยและอังกฤษ' : 'Reads Thai and English'}</div>
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl"><span className="bg-gradient-to-r from-slate-950 via-blue-700 to-violet-700 bg-clip-text text-transparent dark:from-white dark:via-blue-300 dark:to-violet-300">{t.title}</span></h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">{t.subtitle}</p>
        </div>

        {/* [EN] Two-column responsive grid.
                lg:grid-cols-[5fr_7fr] gives the result panel more width than
                the upload panel — typical for read-heavy tools.
                On screens < 1024px the columns stack vertically.
            [TH] Grid สองคอลัมน์ responsive
                lg:grid-cols-[5fr_7fr] ให้ panel ผลลัพธ์กว้างกว่า panel อัปโหลด
                เหมาะกับเครื่องมือที่เน้นการอ่าน
                บนหน้าจอที่แคบกว่า 1024px คอลัมน์จะเรียงซ้อนกัน */}
        <div id="tool" className="grid scroll-mt-24 grid-cols-1 items-start gap-6 lg:grid-cols-[5fr_7fr] lg:gap-7">

          {/* ══ Left panel ═══════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-4 rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_18px_60px_-28px_rgba(37,99,235,.28)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-5">

            {/* ── Upload / preview zone ─────────────────────────────────── */}
            {/* [EN] Dual-purpose: drag-drop target when empty, image preview when loaded.
                    role="button" + tabIndex="0" + onKeyDown make it keyboard-accessible
                    without needing a real <button> (which can't contain block elements).
                [TH] ใช้งานสองอย่าง: drag-drop target เมื่อว่าง, preview รูปภาพเมื่อมีรูป
                    role="button" + tabIndex="0" + onKeyDown ทำให้ใช้แป้นพิมพ์ได้
                    โดยไม่ต้องใช้ <button> จริงๆ (ซึ่งไม่สามารถมี block elements ข้างใน) */}
            <div
              role="button"
              tabIndex={0}
              aria-label={uploadedImage ? uploadedImage.file.name : t.upload}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => { if (!uploadedImage) openFilePicker(); }}
              onKeyDown={handleZoneKeyDown}
              className={[
                'relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white/80 to-blue-50/50 transition-all duration-200 outline-none dark:from-white/[0.04] dark:to-blue-950/10',
                'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                'dark:focus-visible:ring-offset-[#0a0a0a]',
                // [EN] Solid border when image is loaded; dashed + hover states when empty
                // [TH] เส้นขอบทึบเมื่อมีรูปภาพ; เส้นประ + hover states เมื่อว่าง
                uploadedImage
                  ? 'cursor-default border-gray-200 dark:border-white/[0.08]'
                  : 'cursor-pointer border-dashed',
                !uploadedImage && isDragging
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                  : !uploadedImage
                  ? [
                      'border-blue-200/80 dark:border-blue-400/20',
                      'hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-[0_14px_35px_-18px_rgba(124,58,237,.45)] dark:hover:border-violet-400/50',
                    ].join(' ')
                  : '',
              ].join(' ')}
            >
              {uploadedImage && previewSrc ? (
                /* ── Image preview (original → replaced by B&W after preprocessing) ── */
                <div className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewSrc}
                    alt={uploadedImage.file.name}
                    className="block w-full max-h-72 object-contain bg-gray-100 dark:bg-white/[0.03] rounded-[10px]"
                  />

                  {/* [EN] B&W badge — shown only after preprocessing succeeds.
                          Signals to users that they are viewing the processed image,
                          not the original. Uses backdrop-blur for legibility.
                      [TH] ป้าย B&W — แสดงเฉพาะหลังจากการประมวลผลล่วงหน้าสำเร็จ
                          บอกผู้ใช้ว่ากำลังดูรูปที่ประมวลผลแล้ว ไม่ใช่ต้นฉบับ
                          ใช้ backdrop-blur เพื่อให้อ่านได้ชัด */}
                  {isPreprocessed && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                      <Contrast className="h-2.5 w-2.5 text-white" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-white leading-none">
                        B&W
                      </span>
                    </div>
                  )}

                  {/* [EN] Hover overlay: Change image / Remove image.
                          e.stopPropagation() prevents the outer div's onClick
                          (which would open the file picker) from also firing.
                      [TH] Hover overlay: เปลี่ยนรูปภาพ / ลบรูปภาพ
                          e.stopPropagation() ป้องกันไม่ให้ onClick ของ div ด้านนอก
                          (ซึ่งจะเปิด file picker) ทำงานด้วย */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 rounded-b-[10px] bg-black/55 p-3 opacity-100 transition-all duration-200 sm:inset-0 sm:rounded-[10px] sm:bg-black/0 sm:opacity-0 sm:group-hover:bg-black/40 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openFilePicker(); }}
                      className="flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-gray-800 shadow hover:bg-white active:scale-95 transition-transform"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      {t.replace}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearImage(); }}
                      className="flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-red-600 shadow hover:bg-white active:scale-95 transition-transform"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t.remove}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Empty / drag-active state ──────────────────────────────── */
                <div className="flex min-h-64 select-none flex-col items-center justify-center gap-3 px-5 py-10 text-center sm:py-14">
                  {/* [EN] Icon container changes colour during active drag
                      [TH] Container ไอคอนเปลี่ยนสีระหว่าง drag ที่ active */}
                  <div className={[
                    'rounded-xl p-3 transition-colors',
                    isDragging
                      ? 'bg-blue-100 dark:bg-blue-900/40'
                      : 'bg-gradient-to-br from-blue-100 to-violet-100 shadow-inner dark:from-blue-500/20 dark:to-violet-500/20',
                  ].join(' ')}>
                    <ImagePlus className={[
                      'h-6 w-6 transition-colors',
                      isDragging
                        ? 'text-blue-500'
                        : 'text-violet-600 dark:text-violet-300',
                    ].join(' ')} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isDragging ? t.upload : t.upload}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-600">
                      <span className="text-blue-600 dark:text-blue-400">{t.browse}</span> · {t.formats}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* [EN] Hidden file input — triggered programmatically.
                    sr-only makes it invisible but keeps it in the accessibility tree.
                [TH] input ไฟล์ที่ซ่อนอยู่ — เรียกใช้ด้วยโค้ด
                    sr-only ทำให้มองไม่เห็น แต่ยังอยู่ใน accessibility tree */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileInput}
              className="sr-only"
            />

            {/* ── File metadata ───────────────────────────────────────── */}
            {/* [EN] Displays filename and size once an image is loaded.
                    truncate on the filename span prevents long names from
                    breaking the layout on narrow screens.
                [TH] แสดงชื่อไฟล์และขนาดเมื่อโหลดรูปภาพแล้ว
                    truncate บน span ชื่อไฟล์ป้องกันชื่อยาวทำให้ layout แตก
                    บนหน้าจอแคบ */}
            {uploadedImage && (
              <div className="flex items-center gap-1.5 px-0.5">
                <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="min-w-0 truncate text-xs text-gray-500 dark:text-gray-400">
                  {uploadedImage.file.name}
                </span>
                <span className="shrink-0 tabular-nums text-xs text-gray-400 dark:text-gray-600">
                  {fileSizeLabel}
                </span>
              </div>
            )}

            {/* ── Controls: language selector + Extract button ──────────── */}
            <div className="flex flex-col gap-2 sm:flex-row">

              <div ref={ocrMenuRef} className="relative min-w-0 flex-1">
                <button type="button" disabled={isProcessing} aria-haspopup="listbox" aria-expanded={ocrMenuOpen} aria-label={t.ocrLanguage} onClick={() => setOcrMenuOpen((open) => !open)}
                  className="group flex min-h-11 w-full items-center gap-3 rounded-xl border border-blue-200/80 bg-white/90 px-3 py-2 text-left text-sm shadow-sm transition-all hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:hover:border-violet-400/40">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-violet-100 text-violet-600 dark:from-blue-500/20 dark:to-violet-500/20 dark:text-violet-300"><Languages className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t.ocrLanguage}</span><span className="block truncate font-semibold text-slate-800 dark:text-slate-100">{language === 'tha+eng' ? t.mixed : language === 'eng' ? t.english : t.thai}</span></span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${ocrMenuOpen ? 'rotate-180 text-violet-500' : 'group-hover:text-violet-500'}`} />
                </button>

                {ocrMenuOpen && !isProcessing && (
                  <div role="listbox" aria-label={t.ocrLanguage} className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-[0_18px_45px_-12px_rgba(76,29,149,.3)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171526]/95">
                    {([
                      { value: 'tha+eng', label: t.mixed, mark: 'TH · EN' },
                      { value: 'tha', label: t.thai, mark: 'TH' },
                      { value: 'eng', label: t.english, mark: 'EN' },
                    ] as const).map((option) => {
                      const selected = language === option.value;
                      return <button key={option.value} type="button" role="option" aria-selected={selected} onClick={() => { setLanguage(option.value); setOcrMenuOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${selected ? 'bg-gradient-to-r from-blue-50 to-violet-50 text-violet-700 dark:from-blue-500/15 dark:to-violet-500/15 dark:text-violet-200' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.06]'}`}>
                        <span className={`flex h-8 min-w-10 items-center justify-center rounded-lg px-2 text-[10px] font-bold ${selected ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-violet-500/20' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.07] dark:text-slate-400'}`}>{option.mark}</span>
                        <span className="flex-1 font-medium">{option.label}</span>
                        {selected && <Check className="h-4 w-4 text-violet-600 dark:text-violet-300" />}
                      </button>;
                    })}
                  </div>
                )}
              </div>

              {/* [EN] Extract button — disabled until an image is loaded or while processing.
                      active:scale-[0.97] gives a press-down tactile feel.
                      disabled:active:scale-100 prevents the scale from firing when disabled.
                  [TH] ปุ่ม Extract — ปิดใช้งานจนกว่าจะมีรูปภาพหรือขณะประมวลผล
                      active:scale-[0.97] ให้ความรู้สึกกดลงแบบ tactile
                      disabled:active:scale-100 ป้องกัน scale ทำงานเมื่อ disabled */}
              <button
                type="button"
                onClick={runOCR}
                disabled={!uploadedImage || isProcessing}
                className={[
                  'flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-blue-500/20',
                  'bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 text-white',
                  'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/25',
                  'active:scale-[0.97] transition-all duration-150',
                  'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
                ].join(' ')}
              >
                {isProcessing
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ScanText className="h-4 w-4" />
                }
                {isProcessing ? t.reading : t.read}
              </button>
            </div>

            {/* ── Status card ─────────────────────────────────────────── */}
            {/* [EN] Hidden when status === 'idle'. Colour-coded by outcome:
                    processing → neutral gray, done → green, error → red.
                    Contains: status icon + label, progress bar, pipeline info label.
                [TH] ซ่อนเมื่อ status === 'idle' มีรหัสสีตามผลลัพธ์:
                    กำลังประมวลผล → เทากลาง, เสร็จ → เขียว, ผิดพลาด → แดง
                    ประกอบด้วย: ไอคอน + ป้ายสถานะ, progress bar, ป้ายข้อมูล pipeline */}
            {status !== 'idle' && (
              <div className={[
                'rounded-lg border p-3.5 space-y-2.5 transition-colors',
                status === 'error'
                  ? 'border-red-200   dark:border-red-900/60   bg-red-50/60   dark:bg-red-950/20'
                  : status === 'done'
                  ? 'border-green-200 dark:border-green-900/60 bg-green-50/60 dark:bg-green-950/20'
                  : 'border-gray-200  dark:border-white/[0.08] bg-gray-50/60  dark:bg-white/[0.02]',
              ].join(' ')}>

                {/* Status icon + text */}
                <div className="flex items-start gap-2">
                  {isProcessing && (
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-blue-500" />
                  )}
                  {status === 'done' && (
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <p className={[
                    'text-xs font-medium leading-5',
                    status === 'error' ? 'text-red-600 dark:text-red-400' :
                    status === 'done'  ? 'text-green-700 dark:text-green-400' :
                                        'text-gray-600 dark:text-gray-400',
                  ].join(' ')}>
                    {status === 'error' ? t.failed : status === 'done' ? t.complete : t.processing}
                  </p>
                </div>

                {/* [EN] Progress bar — two modes:
                        • Indeterminate pulse (preprocessing / loading): width fixed at 2/5,
                          animate-pulse gives a breathing effect while waiting on I/O.
                        • Determinate (recognizing): width tracks the real 0–100% progress.
                    [TH] Progress bar — สองโหมด:
                        • Indeterminate pulse (preprocessing / loading): ความกว้างคงที่ที่ 2/5,
                          animate-pulse ให้เอฟเฟกต์หายใจขณะรอ I/O
                        • Determinate (recognizing): ความกว้างติดตามความคืบหน้า 0–100% จริง */}
                {isProcessing && (
                  <div className="h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.06]">
                    {status === 'preprocessing' || status === 'loading' ? (
                      <div className="h-full w-2/5 animate-pulse rounded-full bg-blue-400" />
                    ) : (
                      <div
                        className="h-full rounded-full bg-blue-500 transition-[width] duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </div>
                )}

                {/* [EN] Pipeline info label — reminds users that preprocessing ran.
                        Shown during preprocessing and retained after success (not on error).
                    [TH] ป้ายข้อมูล pipeline — เตือนผู้ใช้ว่าการประมวลผลทำงานแล้ว
                        แสดงระหว่าง preprocessing และคงอยู่หลังสำเร็จ (ไม่แสดงเมื่อผิดพลาด) */}
                {(status === 'preprocessing' || (isPreprocessed && status !== 'error')) && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Contrast className="h-3 w-3 shrink-0 text-gray-400 dark:text-gray-600" />
                    <span className="text-[10px] text-gray-400 dark:text-gray-600">
                      {uiLanguage === 'th' ? 'ปรับภาพให้อ่านตัวอักษรได้ชัดขึ้นอัตโนมัติ' : 'Image clarity improved automatically'}
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>
          {/* ══ End left panel ══ */}

          {/* ══ Right panel ══════════════════════════════════════════════════ */}
          {/* [EN] Result area: small toolbar above the editable textarea.
              [TH] พื้นที่ผลลัพธ์: toolbar เล็กๆ เหนือ textarea ที่แก้ไขได้ */}
          <div className="flex flex-col gap-3 rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_18px_60px_-28px_rgba(124,58,237,.25)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-5">

            {/* ── Result toolbar ───────────────────────────────────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Label + stats */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.result}
                </span>
                {/* [EN] Character and word count — tabular-nums prevents layout shift
                        as digits change during editing.
                    [TH] จำนวนตัวอักษรและคำ — tabular-nums ป้องกัน layout shift
                        เมื่อตัวเลขเปลี่ยนระหว่างแก้ไข */}
                {hasResult && (
                  <span className="tabular-nums text-xs text-gray-400 dark:text-gray-600">
                    {resultText.length.toLocaleString()} {t.chars}
                    {' · '}
                    {wordCount.toLocaleString()} {t.words}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">

                {/* [EN] Copy button — transitions green for 2 s after a successful copy.
                        Two render branches avoid icon flicker during the transition.
                    [TH] ปุ่ม Copy — เปลี่ยนเป็นสีเขียว 2 วินาทีหลัง copy สำเร็จ
                        สอง render branch ป้องกันไอคอน flicker ระหว่าง transition */}
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!hasResult}
                  aria-label="Copy extracted text to clipboard"
                  className={[
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                    'transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40',
                    copied
                      ? 'border-green-200 dark:border-green-900/60 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                      : [
                          'border-gray-200 dark:border-white/[0.08]',
                          'bg-white dark:bg-white/[0.04]',
                          'text-gray-600 dark:text-gray-400',
                          'hover:border-gray-300 dark:hover:border-white/[0.14]',
                          'hover:text-gray-900 dark:hover:text-gray-200',
                        ].join(' '),
                  ].join(' ')}
                >
                  {copied
                    ? <><CheckCheck className="h-3.5 w-3.5" />{t.copied}</>
                    : <><Copy className="h-3.5 w-3.5" />{t.copy}</>
                  }
                </button>

                {/* [EN] Download button — exports result as UTF-8 .txt with BOM.
                        The BOM is critical for Thai text in Windows environments.
                    [TH] ปุ่ม Download — export ผลลัพธ์เป็น .txt UTF-8 พร้อม BOM
                        BOM สำคัญมากสำหรับข้อความไทยบน Windows */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!hasResult}
                  aria-label="Download extracted text as UTF-8 .txt"
                  className={[
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                    'border-gray-200 dark:border-white/[0.08]',
                    'bg-white dark:bg-white/[0.04]',
                    'text-gray-600 dark:text-gray-400',
                    'hover:border-gray-300 dark:hover:border-white/[0.14]',
                    'hover:text-gray-900 dark:hover:text-gray-200',
                    'transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40',
                  ].join(' ')}
                >
                  <Download className="h-3.5 w-3.5" />
                  {t.download}
                </button>
              </div>
            </div>

            {/* ── Editable result textarea ─────────────────────────────── */}
            {/* [EN] font-mono gives each character equal width — helps users
                    visually verify alignment-sensitive extracted text.
                    spellCheck={false} avoids red squiggles under Thai words.
                    placeholder adapts to the current pipeline stage so users
                    always know what action to take next.
                [TH] font-mono ให้อักขระแต่ละตัวความกว้างเท่ากัน — ช่วยผู้ใช้
                    ตรวจสอบข้อความที่ดึงออกมาซึ่งต้องการการจัดตำแหน่ง
                    spellCheck={false} ป้องกันขีดเส้นแดงใต้คำภาษาไทย
                    placeholder ปรับตามขั้นตอน pipeline ปัจจุบันเพื่อให้ผู้ใช้
                    รู้ว่าต้องทำอะไรต่อไปเสมอ */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/35 via-violet-500/25 to-fuchsia-500/30 p-px shadow-[0_14px_40px_-24px_rgba(79,70,229,.55)]">
            <textarea
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              aria-label="OCR extracted text — editable"
              spellCheck={false}
              placeholder={
                isProcessing
                  ? t.working
                  : !uploadedImage
                  ? t.empty
                  : status === 'error'
                  ? t.failed
                  : status === 'idle'
                  ? t.ready
                  : ''
              }
              className={[
                'w-full resize-none rounded-[15px] border-0 p-4 shadow-inner sm:p-5',
                'min-h-[360px] h-[52vh] max-h-[680px] sm:min-h-[440px] lg:h-[620px]',
                'bg-white/90 dark:bg-black/20',
                'text-[15px] leading-7 text-gray-900 dark:text-gray-100 sm:text-base',
                'placeholder:text-gray-300 dark:placeholder:text-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500',
                'transition-colors',
              ].join(' ')}
            />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-violet-400 shadow-sm backdrop-blur dark:bg-white/10"><PencilLine className="h-3.5 w-3.5" /></div>
            </div>

          </div>
          {/* ══ End right panel ══ */}

        </div>

        <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-24" aria-labelledby="how-title">
          <div className="mx-auto max-w-3xl text-center"><span className="text-xs font-bold uppercase tracking-[.2em] text-violet-600 dark:text-violet-300">ProjectOCR</span><h2 id="how-title" className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">{uiLanguage === 'th' ? 'เปลี่ยนรูปให้เป็นข้อความในไม่กี่ขั้นตอน' : 'Turn an image into text in a few simple steps'}</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">{uiLanguage === 'th' ? 'เหมาะกับเอกสาร ใบเสร็จ โน้ต และภาพหน้าจอที่มีข้อความภาษาไทยหรืออังกฤษ โดยไม่ต้องพิมพ์ใหม่ทีละบรรทัด' : 'Useful for documents, receipts, notes, and screenshots in Thai or English—without retyping every line.'}</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: ShieldCheck, color: 'from-emerald-500 to-teal-500', th: 'รูปอยู่กับคุณ', en: 'Private by design', thd: 'รูปถูกอ่านภายในเบราว์เซอร์ ไม่ได้อัปโหลดไปเก็บบนเซิร์ฟเวอร์ของเรา', end: 'Images are read in your browser and are not stored on our server.' },
              { icon: Zap, color: 'from-blue-500 to-violet-500', th: 'เริ่มใช้งานได้ทันที', en: 'Ready in moments', thd: 'เลือกรูป ตั้งภาษาของเอกสาร แล้วกดอ่านข้อความได้เลย', end: 'Choose an image, select its language, and start reading.' },
              { icon: PencilLine, color: 'from-violet-500 to-fuchsia-500', th: 'แก้ไขและนำไปใช้ต่อ', en: 'Edit and reuse', thd: 'ตรวจแก้ข้อความ คัดลอก หรือบันทึกเป็นไฟล์ .txt ได้ในหน้าเดียว', end: 'Review, edit, copy, or save the result as a .txt file.' },
            ].map(({ icon: Icon, color, th, en, thd, end }) => <article key={en} className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-[0_18px_50px_-30px_rgba(37,99,235,.35)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-lg font-bold">{uiLanguage === 'th' ? th : en}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{uiLanguage === 'th' ? thd : end}</p></article>)}
          </div>
        </section>

        <section className="pb-16 sm:pb-24" aria-labelledby="seo-title"><div className="rounded-[2rem] border border-blue-200/60 bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-2xl shadow-violet-500/15"><div className="rounded-[calc(2rem-1px)] bg-white/95 p-7 dark:bg-[#101321]/95 sm:p-10"><div className="grid gap-8 lg:grid-cols-[1.3fr_.7fr] lg:items-center"><div><h2 id="seo-title" className="text-2xl font-extrabold sm:text-3xl">{uiLanguage === 'th' ? 'OCR ภาษาไทยและอังกฤษ ใช้ง่ายจากทุกอุปกรณ์' : 'Thai and English OCR on any device'}</h2><p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">{uiLanguage === 'th' ? 'ProjectOCR คือเครื่องมืออ่านข้อความจากรูปภาพออนไลน์ รองรับ PNG และ JPEG ช่วยแปลงภาพเอกสารเป็นข้อความที่แก้ไขได้ เหมาะสำหรับนักเรียน คนทำงาน และผู้ที่ต้องการดึงข้อความจากภาพอย่างรวดเร็ว' : 'ProjectOCR is an online image-to-text tool for PNG and JPEG files. It converts document images into editable text for students, teams, and anyone who needs text from an image quickly.'}</p></div><a href="#tool" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:-translate-y-0.5">{uiLanguage === 'th' ? 'เริ่มอ่านข้อความจากรูป' : 'Start reading an image'} <ExternalLink className="h-4 w-4" /></a></div></div></div></section>
      </main>

      <footer id="resources" className="relative z-10 border-t border-white/70 bg-white/60 backdrop-blur-xl dark:border-white/[0.07] dark:bg-black/10"><div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto]"><div><div className="flex items-center gap-2 font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white"><ScanText className="h-4 w-4" /></span>ProjectOCR</div><p className="mt-3 max-w-xl text-xs leading-6 text-slate-500 dark:text-slate-400">{uiLanguage === 'th' ? 'โปรเจกต์โอเพนซอร์สเพื่อการเรียนรู้และต่อยอด สร้างด้วยเทคโนโลยีจากชุมชนนักพัฒนาทั่วโลก' : 'An open-source learning project built to explore and extend tools from the global developer community.'}</p><p className="mt-4 flex items-center gap-1 text-xs text-slate-400">Made with <Heart className="h-3.5 w-3.5 fill-fuchsia-500 text-fuchsia-500" /> for useful, accessible tools.</p></div><div><h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{uiLanguage === 'th' ? 'เครดิตและแหล่งเรียนรู้' : 'Credits & resources'}</h2><div className="mt-3 flex flex-wrap gap-2 md:max-w-sm md:justify-end"><a href="https://tesseract.projectnaptha.com/" target="_blank" rel="noreferrer" className="resource-link">Tesseract.js <ExternalLink /></a><a href="https://github.com/tesseract-ocr/tesseract" target="_blank" rel="noreferrer" className="resource-link"><Github /> Tesseract OCR</a><a href="https://nextjs.org/docs" target="_blank" rel="noreferrer" className="resource-link">Next.js <ExternalLink /></a><a href="https://lucide.dev/" target="_blank" rel="noreferrer" className="resource-link">Lucide <ExternalLink /></a></div></div></div><div className="border-t border-slate-200/70 px-4 py-4 text-center text-[11px] text-slate-400 dark:border-white/[0.06]">© {new Date().getFullYear()} ProjectOCR · {uiLanguage === 'th' ? 'สร้างเพื่อการเรียนรู้และใช้งานอย่างรับผิดชอบ' : 'Built for learning and responsible use'}</div></footer>
    </div>
  );
}
