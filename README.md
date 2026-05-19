# VibeOCR-Lite

> **[EN]** A fully client-side OCR web application built with Next.js 15 and Tesseract.js v5. Extract text from images directly in the browser — no server, no uploads, no data leaves your machine.
>
> **[TH]** แอปพลิเคชัน OCR บนเว็บแบบ client-side อย่างสมบูรณ์ สร้างด้วย Next.js 15 และ Tesseract.js v5 ดึงข้อความจากรูปภาพโดยตรงในเบราว์เซอร์ — ไม่มีเซิร์ฟเวอร์ ไม่มีการอัปโหลด ข้อมูลไม่ออกจากเครื่องของคุณ

---

## Features / ฟีเจอร์

### 🔒 No-Backend Architecture / สถาปัตยกรรมไม่มี Backend

**[EN]** Every step of the pipeline — image loading, preprocessing, and OCR recognition — runs entirely inside the user's browser tab using WebAssembly. There is no server to maintain, no API keys to manage, and no risk of image data leaving the device.

**[TH]** ทุกขั้นตอนของ pipeline — การโหลดรูปภาพ การประมวลผลล่วงหน้า และการจดจำ OCR — ทำงานทั้งหมดภายในแท็บเบราว์เซอร์ของผู้ใช้โดยใช้ WebAssembly ไม่มีเซิร์ฟเวอร์ที่ต้องดูแล ไม่มี API key ที่ต้องจัดการ และไม่มีความเสี่ยงที่ข้อมูลรูปภาพจะออกจากอุปกรณ์

---

### 🌏 Dual-Language OCR / OCR สองภาษา

**[EN]** Three language modes selectable at runtime without reloading the page:

**[TH]** สามโหมดภาษาที่เลือกได้ขณะใช้งานโดยไม่ต้องโหลดหน้าใหม่:

| Mode / โหมด | Tesseract Code | Description |
|---|---|---|
| Thai + English | `tha+eng` | Best for mixed documents / เหมาะที่สุดสำหรับเอกสารผสม |
| English Only | `eng` | Faster for pure English content / เร็วกว่าสำหรับเนื้อหาอังกฤษล้วน |
| Thai Only | `tha` | Optimised for Thai script / ปรับแต่งสำหรับอักษรไทย |

---

### 🎨 Canvas Preprocessing for Thai Accuracy / Canvas Preprocessing เพื่อความแม่นยำของภาษาไทย

**[EN]** Before Tesseract receives the image, it passes through a two-pass HTML5 Canvas pipeline that dramatically improves recognition accuracy for Thai script:

1. **Grayscale conversion** — ITU-R BT.601 luma weighting (`0.299R + 0.587G + 0.114B`) for perceptually accurate grey values
2. **Otsu's binarisation** — Adaptive histogram-based thresholding that maximises inter-class variance between text and background, producing a clean black-and-white image

**[TH]** ก่อนที่ Tesseract จะรับรูปภาพ มันจะผ่าน pipeline สองรอบบน HTML5 Canvas ที่ปรับปรุงความแม่นยำในการจดจำอักษรไทยอย่างมาก:

1. **การแปลง Grayscale** — การถ่วงน้ำหนัก luma ITU-R BT.601 (`0.299R + 0.587G + 0.114B`) สำหรับค่าสีเทาที่แม่นยำตามการรับรู้
2. **การ binarise ของ Otsu** — การ thresholding แบบ adaptive ที่อิงจาก histogram ซึ่งเพิ่ม inter-class variance ระหว่างข้อความกับพื้นหลังให้สูงสุด ผลิตรูปภาพขาวดำที่สะอาด

---

### ✏️ Edit, Copy & Download / แก้ไข คัดลอก และดาวน์โหลด

**[EN]** The extracted text lands in an editable textarea so recognition errors can be corrected inline. Two toolbar actions are provided:

- **Copy** — Writes the text to the system clipboard via the async Clipboard API. The button shows a green checkmark for 2 seconds to confirm success.
- **Download** — Exports the result as a UTF-8 `.txt` file with a BOM prefix (`U+FEFF`) prepended, ensuring Thai characters display correctly when the file is opened in Windows editors (Notepad, Excel, VS Code).

**[TH]** ข้อความที่ดึงออกมาจะอยู่ใน textarea ที่แก้ไขได้ เพื่อให้สามารถแก้ไขข้อผิดพลาดในการจดจำได้ทันที มีสองการทำงานใน toolbar:

- **Copy** — เขียนข้อความไปยัง clipboard ของระบบผ่าน async Clipboard API ปุ่มจะแสดงเครื่องหมายถูกสีเขียวนาน 2 วินาทีเพื่อยืนยันความสำเร็จ
- **Download** — Export ผลลัพธ์เป็นไฟล์ `.txt` UTF-8 พร้อม BOM prefix (`U+FEFF`) ที่เพิ่มไว้ เพื่อให้ตัวอักษรไทยแสดงผลถูกต้องเมื่อเปิดไฟล์ใน Windows editors (Notepad, Excel, VS Code)

---

## Tech Stack / เทคโนโลยีที่ใช้

| Technology | Version | Role |
|---|---|---|
| [Next.js](https://nextjs.org/) | ^15.0.0 | App Router, SSR-free client page |
| [React](https://react.dev/) | ^19.0.0 | UI rendering & state |
| [TypeScript](https://www.typescriptlang.org/) | ^5.0.0 | Strict type safety |
| [Tailwind CSS](https://tailwindcss.com/) | ^3.4.0 | Utility-first styling, dark mode |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | ^5.0.0 | In-browser OCR via WASM |
| [Lucide React](https://lucide.dev/) | ^0.400.0 | Icon library |

---

## Installation & Setup / การติดตั้งและตั้งค่า

### Prerequisites / ข้อกำหนดเบื้องต้น

**[EN]** Ensure the following are installed before proceeding:

**[TH]** ตรวจสอบให้แน่ใจว่าติดตั้งสิ่งต่อไปนี้ก่อนดำเนินการ:

- **Node.js** `>= 18.x` — [nodejs.org](https://nodejs.org/)
- **npm** `>= 9.x` (included with Node.js / รวมมากับ Node.js)

---

### Step 1 — Clone or enter the project directory / โคลนหรือเข้าไปที่ไดเรกทอรีโปรเจกต์

```bash
# If cloning from a remote repository / ถ้า clone จาก remote repository
git clone <your-repository-url> VibeOCR-Lite
cd VibeOCR-Lite

# Or navigate to the existing directory / หรือเข้าไปที่ไดเรกทอรีที่มีอยู่
cd C:\xampp\htdocs\myproject\ProjectOCR
```

---

### Step 2 — Install dependencies / ติดตั้ง dependencies

**[EN]** Install all project dependencies listed in `package.json`:

**[TH]** ติดตั้ง dependencies ทั้งหมดของโปรเจกต์ที่ระบุใน `package.json`:

```bash
npm install
```

**[EN]** This installs: Next.js, React, TypeScript, Tailwind CSS, Tesseract.js, and Lucide React.

**[TH]** ซึ่งติดตั้ง: Next.js, React, TypeScript, Tailwind CSS, Tesseract.js และ Lucide React

> **Note / หมายเหตุ:** Tesseract language model files (`tha.traineddata`, `eng.traineddata`) are **not** bundled — they are downloaded by the browser automatically on the first OCR run and cached for subsequent uses.
>
> ไฟล์โมเดลภาษา Tesseract (`tha.traineddata`, `eng.traineddata`) **ไม่ได้** รวมไว้ในโปรเจกต์ — เบราว์เซอร์จะดาวน์โหลดอัตโนมัติในการรัน OCR ครั้งแรกและ cache ไว้สำหรับการใช้งานครั้งถัดไป

---

### Step 3 — Start the development server / เริ่ม development server

**[EN]** Run the local development server with hot-reload:

**[TH]** รัน local development server พร้อม hot-reload:

```bash
npm run dev
```

**[EN]** Open [http://localhost:3000](http://localhost:3000) in your browser.

**[TH]** เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์ของคุณ

---

### Step 4 (Optional) — Production build / build สำหรับ production (ไม่บังคับ)

**[EN]** Build an optimised production bundle and serve it locally:

**[TH]** Build production bundle ที่ปรับแต่งแล้วและรันในเครื่อง:

```bash
# Build / บิลด์
npm run build

# Serve the production build locally / รัน production build ในเครื่อง
npm run start
```

---

### Available Scripts / คำสั่งที่ใช้ได้

| Command / คำสั่ง | Description / คำอธิบาย |
|---|---|
| `npm run dev` | Start dev server with hot-reload / เริ่ม dev server พร้อม hot-reload |
| `npm run build` | Create optimised production bundle / สร้าง production bundle ที่ปรับแต่งแล้ว |
| `npm run start` | Serve the production build / รัน production build |
| `npm run lint` | Run ESLint checks / รัน ESLint ตรวจสอบโค้ด |

---

## Project Structure / โครงสร้างโปรเจกต์

```
VibeOCR-Lite/
│
├── app/                        # Next.js App Router directory
│   ├── globals.css             # Global styles — Tailwind directives, CSS variables
│   ├── layout.tsx              # Root layout — <html>, <body>, metadata
│   └── page.tsx                # ⭐ Main page — all OCR logic, state, and UI live here
│
├── hooks/
│   └── useOCR.ts               # (Legacy) Simple single-language OCR hook
│                               # Not used by page.tsx — kept for reference
│
├── lib/
│   └── utils.ts                # Pure utility functions (formatFileSize, isImageFile, etc.)
│
├── types/
│   └── index.ts                # Shared TypeScript interfaces (OCRResult, OCRWord, etc.)
│
├── public/                     # Static assets served at root (favicon, images)
│
├── node_modules/               # Installed npm packages (gitignored)
│
├── next.config.ts              # Next.js configuration (reactStrictMode: true)
├── tailwind.config.ts          # Tailwind CSS content paths, theme extensions
├── postcss.config.mjs          # PostCSS plugins (tailwindcss, autoprefixer)
├── tsconfig.json               # TypeScript compiler options, path aliases (@/*)
├── package.json                # Project manifest, scripts, dependencies
├── .gitignore                  # Git exclusion rules
└── README.md                   # This file / ไฟล์นี้
```

> **[EN]** The entire application is self-contained in `app/page.tsx`. The `hooks/`, `lib/`, and `types/` directories exist as extension points for future multi-page or multi-component growth.
>
> **[TH]** แอปพลิเคชันทั้งหมดอยู่ใน `app/page.tsx` ไดเรกทอรี `hooks/`, `lib/` และ `types/` มีไว้เป็นจุดขยายสำหรับการเติบโตเป็นหลายหน้าหรือหลาย component ในอนาคต

---

## Code Architecture Overview / ภาพรวมสถาปัตยกรรมโค้ด

> **[EN]** All core logic lives inside `app/page.tsx`. The file is structured into four conceptual layers described below.
>
> **[TH]** Logic หลักทั้งหมดอยู่ใน `app/page.tsx` ไฟล์ถูกจัดโครงสร้างเป็นสี่ layer ตามแนวคิดที่อธิบายด้านล่าง

---

### 1. State Management / การจัดการ State

**[EN]** The component uses React `useState` and `useRef` exclusively — no external state library. State is split by purpose:

**[TH]** Component ใช้ React `useState` และ `useRef` เพียงอย่างเดียว — ไม่มี state library ภายนอก State แบ่งตามวัตถุประสงค์:

| Hook | Variable | Purpose / จุดประสงค์ |
|---|---|---|
| `useState` | `uploadedImage` | Holds the loaded `File` and its object URL preview |
| `useState` | `processedPreview` | PNG data-URL of the B&W canvas result |
| `useState` | `language` | Active Tesseract language code (`tha+eng` / `eng` / `tha`) |
| `useState` | `status` | Pipeline FSM: `idle → preprocessing → loading → recognizing → done / error` |
| `useState` | `progress` | Integer 0–100 for the determinate progress bar |
| `useState` | `statusLabel` | Human-readable step description shown in the status card |
| `useState` | `resultText` | Editable OCR output string |
| `useState` | `errorMsg` | Error description shown when `status === 'error'` |
| `useState` | `isDragging` | Drag-over highlight for the upload zone |
| `useState` | `copied` | Drives the 2-second Copy success animation |
| `useRef` | `workerRef` | Active `TesseractWorker` — terminated on unmount and before each new run |
| `useRef` | `previewRef` | Tracks the current object URL so it can be revoked precisely |
| `useRef` | `copyTimerRef` | `setTimeout` ID for the copy-reset timer — cancelled on unmount |
| `useRef` | `fileInputRef` | DOM reference to the hidden `<input type="file">` |

**[EN]** Three refs are cleaned up in a single `useEffect` with an empty dependency array (runs once on mount, cleanup fires on unmount):

**[TH]** Ref สามตัวถูก cleanup ใน `useEffect` เดียวที่มี dependency array ว่าง (รันครั้งเดียวเมื่อ mount, cleanup ทำงานเมื่อ unmount):

```typescript
useEffect(() => {
  return () => {
    workerRef.current?.terminate();           // Free WASM memory (~40–80 MB)
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  };
}, []);
```

---

### 2. OCR Logic / Logic การจดจำ OCR

**[EN]** The `runOCR` callback orchestrates the full four-step pipeline:

**[TH]** callback `runOCR` ควบคุม pipeline สี่ขั้นตอนทั้งหมด:

```
Step 1  →  Canvas Preprocessing   (grayscale → Otsu threshold → B&W canvas)
Step 2  →  Worker Initialisation  (WASM load + language traineddata download)
Step 3  →  Text Recognition       (LSTM inference, real-time progress 0–100%)
Step 4  →  Result & Cleanup       (set result text, terminate worker)
```

**[EN]** Key design decisions:

**[TH]** การตัดสินใจออกแบบที่สำคัญ:

- **Worker lifecycle** — A new worker is created per run and terminated immediately after. This avoids memory accumulation across multiple extractions.
  *(วงจรชีวิต Worker — สร้าง worker ใหม่ต่อการรันและยุติทันทีหลังจากนั้น ป้องกันการสะสม memory ในการดึงข้อความหลายครั้ง)*

- **Non-fatal preprocessing** — If the canvas throws (e.g., image too large for GPU memory), the pipeline silently falls back to the raw `File` and OCR continues unenhanced.
  *(Preprocessing ไม่ fatal — ถ้า canvas throw เช่น รูปภาพใหญ่เกินไปสำหรับ GPU memory pipeline จะ fallback ไปใช้ `File` ดิบโดยไม่แจ้งและ OCR ยังทำงานต่อ)*

- **Tesseract type derivation** — The `Worker` type is derived as `Awaited<ReturnType<typeof createWorker>>` instead of a named import, because Tesseract.js uses `export = Tesseract` (CommonJS namespace), which breaks named type imports.
  *(การ derive type Tesseract — ประเภท `Worker` ถูก derive เป็น `Awaited<ReturnType<typeof createWorker>>` แทนการ named import เพราะ Tesseract.js ใช้ `export = Tesseract` (CommonJS namespace) ซึ่งทำให้ named type imports ใช้ไม่ได้)*

- **OEM 1 (LSTM_ONLY)** — The `oem` parameter is hardcoded to `1` for maximum accuracy. The legacy Tesseract engine (OEM 0) is not used.
  *(OEM 1 (LSTM_ONLY) — parameter `oem` ถูกกำหนดเป็น `1` เพื่อความแม่นยำสูงสุด ไม่ใช้ engine Tesseract แบบ legacy (OEM 0))*

---

### 3. Canvas Preprocessing / Canvas Preprocessing

**[EN]** Two pure functions handle image enhancement before OCR. Neither has side effects beyond the Canvas API.

**[TH]** ฟังก์ชันบริสุทธิ์สองตัวจัดการการปรับปรุงรูปภาพก่อน OCR ไม่มี side effects นอกจาก Canvas API

#### `otsuThreshold(data, pixelCount)` → `number`

**[EN]** Calculates the optimal binarisation threshold for a grayscale image using Otsu's method:

**[TH]** คำนวณค่า binarisation threshold ที่เหมาะสมที่สุดสำหรับรูปภาพ grayscale โดยใช้วิธี Otsu:

1. Build a 256-bin intensity histogram from the pixel buffer / สร้าง histogram ความเข้ม 256 ช่องจาก pixel buffer
2. Iterate over all possible thresholds 0–255 / วนซ้ำผ่านค่า threshold ที่เป็นไปได้ทั้งหมด 0–255
3. At each threshold, compute the between-class variance: `wB × wF × (μB − μF)²` / ที่ threshold แต่ละตัว คำนวณ between-class variance
4. Return the threshold that maximises this variance / คืนค่า threshold ที่ทำให้ variance นี้สูงสุด

**Complexity / ความซับซ้อน:** `O(n)` pixel scan + `O(256)` histogram scan

#### `preprocessImage(file)` → `Promise<{ canvas, previewDataUrl }>`

**[EN]** Runs a two-pass pixel transformation on an offscreen canvas:

**[TH]** รัน pixel transformation สองรอบบน canvas นอกหน้าจอ:

```
Pass 1 — Luminance grayscale  →  g = (0.299R + 0.587G + 0.114B) | 0
Pass 2 — Otsu binary          →  pixel ≥ threshold ? 255 : 0
```

**[EN]** Returns the finished `HTMLCanvasElement` (fed directly to Tesseract as `ImageLike`, avoiding re-encoding) and a lossless PNG data-URL for the UI preview.

**[TH]** คืน `HTMLCanvasElement` ที่เสร็จแล้ว (ส่งตรงให้ Tesseract เป็น `ImageLike` หลีกเลี่ยงการ re-encode) และ PNG data-URL แบบ lossless สำหรับ UI preview

> **[EN] Why PNG for the preview?** JPEG re-compression would reintroduce blur artefacts around thin Thai strokes, defeating the purpose of binarisation.
>
> **[TH] ทำไมถึงใช้ PNG สำหรับ preview?** การบีบอัด JPEG ซ้ำจะนำ blur artefacts กลับมาบริเวณเส้นบางของอักษรไทย ทำให้ binarisation ไม่มีประโยชน์

---

### 4. UTF-8 Safe Export / การ Export ที่ปลอดภัยสำหรับ UTF-8

**[EN]** Thai characters require explicit encoding metadata to display correctly across platforms. Two mechanisms work together:

**[TH]** ตัวอักษรไทยต้องการ metadata การเข้ารหัสที่ชัดเจนเพื่อแสดงผลถูกต้องบนทุกแพลตฟอร์ม กลไกสองอย่างทำงานร่วมกัน:

#### Blob with `charset=utf-8`

```typescript
new Blob(['﻿', resultText], { type: 'text/plain;charset=utf-8' })
```

**[EN]** The `charset=utf-8` MIME parameter instructs the browser to encode the text as UTF-8 when serialising the Blob.

**[TH]** parameter MIME `charset=utf-8` สั่งให้เบราว์เซอร์เข้ารหัสข้อความเป็น UTF-8 เมื่อ serialise Blob

#### UTF-8 BOM (`U+FEFF`)

**[EN]** The character `'﻿'` (Unicode code point `U+FEFF`, the Byte Order Mark) is prepended as the first element of the Blob array. When a Windows application opens the `.txt` file, it reads this BOM and correctly identifies the encoding as UTF-8 rather than defaulting to the system locale (Windows-1252 in many regions), which would corrupt Thai characters.

**[TH]** อักขระ `'﻿'` (Unicode code point `U+FEFF`, Byte Order Mark) ถูกเพิ่มไว้หน้าเป็น element แรกของ Blob array เมื่อแอปพลิเคชัน Windows เปิดไฟล์ `.txt` จะอ่าน BOM นี้และระบุการเข้ารหัสเป็น UTF-8 ได้อย่างถูกต้อง แทนที่จะใช้ค่าเริ่มต้นของ locale ของระบบ (Windows-1252 ในหลายภูมิภาค) ซึ่งจะทำให้ตัวอักษรไทยเสียหาย

| Platform / แพลตฟอร์ม | Without BOM / ไม่มี BOM | With BOM / มี BOM |
|---|---|---|
| Windows Notepad | ❌ Garbled Thai / ภาษาไทยเสียหาย | ✅ Correct / ถูกต้อง |
| Microsoft Excel | ❌ Garbled Thai / ภาษาไทยเสียหาย | ✅ Correct / ถูกต้อง |
| VS Code (Windows) | ✅ Correct | ✅ Correct |
| macOS TextEdit | ✅ Correct | ✅ Correct (BOM ignored) |

---

## How It Works — Full Pipeline / วิธีทำงาน — Pipeline ทั้งหมด

```
User uploads image (PNG / JPEG)
        │
        ▼
  loadFile()
  ├── Validate MIME type (PNG / JPEG only)
  ├── Revoke previous object URL
  ├── Create new object URL → show in upload zone
  └── Reset all pipeline state

        │  (user clicks "Extract")
        ▼
  runOCR()
  │
  ├── [Step 1] preprocessImage(file)
  │   ├── Decode image via <img> element
  │   ├── Draw to offscreen <canvas>
  │   ├── Pass 1: Grayscale (ITU-R BT.601 luma)
  │   ├── Pass 2: Otsu threshold → binary B&W
  │   ├── Export lossless PNG → update UI preview
  │   └── Return HTMLCanvasElement as ocrSource
  │
  ├── [Step 2] createWorker(language, 1, { logger })
  │   ├── Download Tesseract WASM binary (cached after first load)
  │   ├── Download language traineddata (cached after first load)
  │   └── Initialise Tesseract API
  │
  ├── [Step 3] worker.recognize(ocrSource)
  │   ├── LSTM inference runs on canvas pixel data
  │   ├── logger fires with progress 0–100%
  │   └── Returns { data: { text, confidence, words, ... } }
  │
  └── [Step 4] Cleanup
      ├── setResultText(data.text.trimEnd())
      ├── worker.terminate()   → free WASM memory
      └── status → 'done'

        │  (user clicks "Copy" or "Download")
        ▼
  handleCopy()    →  navigator.clipboard.writeText(resultText)
  handleDownload() →  Blob(['﻿', resultText], { type: 'text/plain;charset=utf-8' })
                      → <a download> click → URL.revokeObjectURL()
```

---

## Future Expansion Ideas / แนวคิดการขยายในอนาคต

**[EN]** The following enhancements are natural next steps for this codebase:

**[TH]** การปรับปรุงต่อไปนี้เป็นขั้นตอนถัดไปที่เป็นธรรมชาติสำหรับ codebase นี้:

- **Image resizing before preprocessing** — Large images (> 4000px) should be downscaled before the canvas pass to avoid GPU memory exhaustion and reduce recognition time.
  *(การปรับขนาดรูปภาพก่อน preprocessing — รูปภาพขนาดใหญ่ควรลดขนาดก่อน canvas pass เพื่อหลีกเลี่ยง GPU memory หมดและลดเวลาในการจดจำ)*

- **Confidence score display** — Tesseract returns per-word confidence values. These could be visualised as colour-coded highlights in the textarea.
  *(การแสดง confidence score — Tesseract คืนค่า confidence ต่อคำ ซึ่งสามารถแสดงเป็นไฮไลต์รหัสสีใน textarea)*

- **Multi-page / batch processing** — Extend the upload zone to accept multiple files and queue them through the OCR pipeline sequentially.
  *(การประมวลผลหลายหน้า / batch — ขยาย upload zone ให้รับหลายไฟล์และจัดคิวผ่าน OCR pipeline ตามลำดับ)*

- **PDF export** — Tesseract.js supports `worker.getPDF()` which returns a searchable PDF. This could be added as a second download format.
  *(การ export PDF — Tesseract.js รองรับ `worker.getPDF()` ซึ่งคืน PDF ที่ค้นหาได้ สามารถเพิ่มเป็นรูปแบบดาวน์โหลดที่สอง)*

- **Deskewing / rotation correction** — Use `RecognizeOptions.rotateAuto` or a custom canvas transform to straighten skewed scans before recognition.
  *(การแก้ไขความเอียง / การหมุน — ใช้ `RecognizeOptions.rotateAuto` หรือ canvas transform แบบ custom เพื่อทำให้ภาพสแกนที่เอียงตรงก่อนจดจำ)*

- **PWA / offline support** — Add a `manifest.json` and service worker to cache Tesseract WASM and language data for full offline usage.
  *(รองรับ PWA / offline — เพิ่ม `manifest.json` และ service worker เพื่อ cache Tesseract WASM และข้อมูลภาษาสำหรับการใช้งาน offline เต็มรูปแบบ)*

---

## License / สัญญาอนุญาต

**[EN]** This project is released under the [MIT License](https://opensource.org/licenses/MIT). Tesseract.js is licensed under [Apache 2.0](https://github.com/naptha/tesseract.js/blob/master/LICENSE.md).

**[TH]** โปรเจกต์นี้เผยแพร่ภายใต้ [MIT License](https://opensource.org/licenses/MIT) Tesseract.js อยู่ภายใต้ [Apache 2.0](https://github.com/naptha/tesseract.js/blob/master/LICENSE.md)

---

*Built with ❤️ using Next.js + Tesseract.js · ทำด้วยความตั้งใจโดยใช้ Next.js + Tesseract.js*
