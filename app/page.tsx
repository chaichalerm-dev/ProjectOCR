'use client';

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
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;

type OCRLanguage = 'tha+eng' | 'eng' | 'tha';
type ProcessStatus = 'idle' | 'loading' | 'recognizing' | 'done' | 'error';

interface LanguageOption {
  value: OCRLanguage;
  label: string;
}

interface ImageData {
  file: File;
  preview: string;
}

interface TesseractLoggerMessage {
  status: string;
  progress: number;
  jobId?: string;
  workerId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'tha+eng', label: 'Thai + English' },
  { value: 'eng',     label: 'English Only'   },
  { value: 'tha',     label: 'Thai Only'       },
];

const ACCEPTED_MIME = new Set(['image/png', 'image/jpeg']);

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  // ── State ──
  const [imageData, setImageData]     = useState<ImageData | null>(null);
  const [language, setLanguage]       = useState<OCRLanguage>('tha+eng');
  const [status, setStatus]           = useState<ProcessStatus>('idle');
  const [progress, setProgress]       = useState<number>(0);
  const [statusLabel, setStatusLabel] = useState<string>('');
  const [resultText, setResultText]   = useState<string>('');
  const [errorMsg, setErrorMsg]       = useState<string>('');
  const [isDragging, setIsDragging]   = useState<boolean>(false);
  const [copied, setCopied]           = useState<boolean>(false);

  // ── Refs ──
  const workerRef     = useRef<TesseractWorker | null>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const copyTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup worker and object URL on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // ── File handling ─────────────────────────────────────────────────────────

  const loadFile = useCallback((file: File) => {
    if (!ACCEPTED_MIME.has(file.type)) {
      setErrorMsg('Unsupported format. Please upload a PNG or JPEG image.');
      setStatus('error');
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    const preview = URL.createObjectURL(file);
    previewUrlRef.current = preview;

    setImageData({ file, preview });
    setResultText('');
    setStatus('idle');
    setStatusLabel('');
    setErrorMsg('');
    setProgress(0);
  }, []);

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
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = '';
  }, [loadFile]);

  const clearImage = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setImageData(null);
    setResultText('');
    setStatus('idle');
    setStatusLabel('');
    setErrorMsg('');
    setProgress(0);
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ── OCR ───────────────────────────────────────────────────────────────────

  const runOCR = useCallback(async () => {
    if (!imageData || status === 'loading' || status === 'recognizing') return;

    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }

    setStatus('loading');
    setProgress(0);
    setResultText('');
    setErrorMsg('');
    setStatusLabel('Starting Tesseract engine…');

    try {
      const worker = await createWorker(language, 1, {
        logger: (m: TesseractLoggerMessage) => {
          const pct = Math.round(m.progress * 100);
          switch (m.status) {
            case 'loading tesseract core':
              setStatusLabel('Loading Tesseract core…');
              break;
            case 'loading language traineddata':
              setStatusLabel(`Downloading language data… ${pct}%`);
              setProgress(pct);
              break;
            case 'initializing api':
              setStatusLabel('Initializing OCR engine…');
              break;
            case 'recognizing text':
              setStatus('recognizing');
              setProgress(pct);
              setStatusLabel(`Recognizing text… ${pct}%`);
              break;
          }
        },
      });

      workerRef.current = worker;

      const { data } = await worker.recognize(imageData.file);

      setResultText(data.text.trimEnd());
      setStatus('done');
      setProgress(100);
      setStatusLabel('Extraction complete');

      await worker.terminate();
      workerRef.current = null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(msg);
      setStatus('error');
      setStatusLabel('');
    }
  }, [imageData, language, status]);

  // ── Toolbar actions ───────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  }, [resultText]);

  const handleDownload = useCallback(() => {
    if (!resultText) return;
    // UTF-8 BOM ensures Thai characters render correctly in Windows editors
    const blob = new Blob(['﻿', resultText], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const baseName = imageData?.file.name.replace(/\.[^/.]+$/, '') ?? 'ocr-result';
    anchor.href     = url;
    anchor.download = `${baseName}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [resultText, imageData]);

  // ── Upload zone keyboard handler ──────────────────────────────────────────

  const handleZoneKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (!imageData && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openFilePicker();
    }
  }, [imageData, openFilePicker]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const isProcessing = status === 'loading' || status === 'recognizing';
  const hasResult    = resultText.length > 0;
  const wordCount    = hasResult ? resultText.split(/\s+/).filter(Boolean).length : 0;

  const fileSizeLabel = imageData
    ? imageData.file.size >= 1_048_576
      ? `${(imageData.file.size / 1_048_576).toFixed(1)} MB`
      : `${(imageData.file.size / 1024).toFixed(0)} KB`
    : '';

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 h-14 border-b border-gray-100 dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 dark:bg-white shadow-sm">
              <ScanText className="h-4 w-4 text-white dark:text-gray-900" />
            </div>
            <span className="text-sm font-semibold tracking-tight">ProjectOCR</span>
          </div>
          <span className="hidden sm:inline-block text-xs text-gray-400 dark:text-gray-600">
            Client-side only · your images never leave the browser
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-5 py-8">

        {/* Page heading */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight">Text Extraction</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload an image and extract text instantly in your browser using Tesseract.js.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-5 items-start">

          {/* ══ Left panel ══ */}
          <div className="flex flex-col gap-4">

            {/* Upload zone */}
            <div
              role="button"
              tabIndex={0}
              aria-label={imageData ? 'Image preview' : 'Click or drag to upload an image'}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => { if (!imageData) openFilePicker(); }}
              onKeyDown={handleZoneKeyDown}
              className={[
                'relative overflow-hidden rounded-xl border-2 transition-all duration-150 outline-none',
                'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]',
                imageData
                  ? 'border-gray-200 dark:border-white/[0.08] cursor-default'
                  : 'cursor-pointer border-dashed',
                !imageData && isDragging
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                  : !imageData
                  ? 'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.14] hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                  : '',
              ].join(' ')}
            >
              {imageData ? (
                /* Preview */
                <div className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageData.preview}
                    alt={imageData.file.name}
                    className="block w-full max-h-72 object-contain bg-gray-100 dark:bg-white/[0.03] rounded-[10px]"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-[10px] bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openFilePicker(); }}
                      className="flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-gray-800 shadow hover:bg-white active:scale-95 transition-transform"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearImage(); }}
                      className="flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-red-600 shadow hover:bg-white active:scale-95 transition-transform"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="flex select-none flex-col items-center justify-center gap-3 py-14 px-6 text-center">
                  <div className={[
                    'rounded-xl p-3 transition-colors',
                    isDragging
                      ? 'bg-blue-100 dark:bg-blue-900/40'
                      : 'bg-gray-100 dark:bg-white/[0.06]',
                  ].join(' ')}>
                    <ImagePlus className={[
                      'h-6 w-6 transition-colors',
                      isDragging ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500',
                    ].join(' ')} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isDragging
                        ? 'Drop image here'
                        : <span>Drop image or <span className="text-blue-600 dark:text-blue-400">browse files</span></span>
                      }
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-600">
                      PNG or JPEG · Max 10 MB recommended
                    </p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileInput}
              className="sr-only"
            />

            {/* File metadata */}
            {imageData && (
              <div className="flex items-center gap-1.5 px-0.5">
                <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="min-w-0 truncate text-xs text-gray-500 dark:text-gray-400">
                  {imageData.file.name}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-gray-400 dark:text-gray-600">
                  {fileSizeLabel}
                </span>
              </div>
            )}

            {/* Controls row */}
            <div className="flex gap-2">
              {/* Language selector */}
              <div className="relative flex-1 min-w-0">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as OCRLanguage)}
                  disabled={isProcessing}
                  aria-label="OCR language"
                  className={[
                    'w-full appearance-none rounded-lg border px-3 py-2.5 pr-8 text-sm',
                    'bg-white dark:bg-white/[0.04] text-gray-900 dark:text-gray-100',
                    'border-gray-200 dark:border-white/[0.08]',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'transition-colors',
                  ].join(' ')}
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </div>
              </div>

              {/* Extract button */}
              <button
                type="button"
                onClick={runOCR}
                disabled={!imageData || isProcessing}
                className={[
                  'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium',
                  'bg-gray-900 dark:bg-white text-white dark:text-gray-900',
                  'hover:bg-gray-700 dark:hover:bg-gray-100',
                  'active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40',
                  'disabled:active:scale-100 transition-all duration-150 shadow-sm',
                ].join(' ')}
              >
                {isProcessing
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ScanText className="h-4 w-4" />
                }
                {isProcessing ? 'Processing…' : 'Extract'}
              </button>
            </div>

            {/* Status card */}
            {status !== 'idle' && (
              <div className={[
                'rounded-lg border p-3.5 transition-colors',
                status === 'error'
                  ? 'border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20'
                  : status === 'done'
                  ? 'border-green-200 dark:border-green-900/60 bg-green-50/60 dark:bg-green-950/20'
                  : 'border-gray-200 dark:border-white/[0.08] bg-gray-50/60 dark:bg-white/[0.02]',
              ].join(' ')}>
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
                    {status === 'error' ? errorMsg : statusLabel}
                  </p>
                </div>

                {/* Progress bar */}
                {isProcessing && (
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.06]">
                    {status === 'loading' ? (
                      /* Indeterminate – pulsing fill while engine loads */
                      <div className="h-full w-2/5 animate-pulse rounded-full bg-blue-400" />
                    ) : (
                      /* Determinate – real progress during recognition */
                      <div
                        className="h-full rounded-full bg-blue-500 transition-[width] duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══ Right panel ══ */}
          <div className="flex flex-col gap-3">

            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Extracted Text
                </span>
                {hasResult && (
                  <span className="tabular-nums text-xs text-gray-400 dark:text-gray-600">
                    {resultText.length.toLocaleString()} chars · {wordCount.toLocaleString()} words
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Copy button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!hasResult}
                  aria-label="Copy extracted text"
                  className={[
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                    'transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40',
                    copied
                      ? 'border-green-200 dark:border-green-900/60 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                      : [
                          'border-gray-200 dark:border-white/[0.08]',
                          'bg-white dark:bg-white/[0.04]',
                          'text-gray-600 dark:text-gray-400',
                          'hover:border-gray-300 dark:hover:border-white/[0.14] hover:text-gray-900 dark:hover:text-gray-200',
                        ].join(' '),
                  ].join(' ')}
                >
                  {copied
                    ? <><CheckCheck className="h-3.5 w-3.5" />Copied!</>
                    : <><Copy className="h-3.5 w-3.5" />Copy</>
                  }
                </button>

                {/* Download button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!hasResult}
                  aria-label="Download extracted text as .txt"
                  className={[
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                    'border-gray-200 dark:border-white/[0.08]',
                    'bg-white dark:bg-white/[0.04]',
                    'text-gray-600 dark:text-gray-400',
                    'hover:border-gray-300 dark:hover:border-white/[0.14] hover:text-gray-900 dark:hover:text-gray-200',
                    'transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40',
                  ].join(' ')}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download .txt
                </button>
              </div>
            </div>

            {/* Result textarea */}
            <textarea
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              aria-label="OCR result — editable"
              spellCheck={false}
              placeholder={
                isProcessing
                  ? 'Extracting text from your image…'
                  : !imageData
                  ? 'Upload an image, then click "Extract" to begin…'
                  : status === 'error'
                  ? 'Extraction failed. Adjust settings and try again.'
                  : status === 'idle'
                  ? 'Click "Extract" to start the OCR process…'
                  : ''
              }
              className={[
                'w-full resize-none rounded-xl border p-4',
                'h-[480px] lg:h-[620px]',
                'bg-white dark:bg-white/[0.03]',
                'text-sm leading-7 font-mono text-gray-900 dark:text-gray-100',
                'placeholder:text-gray-300 dark:placeholder:text-gray-700',
                'border-gray-200 dark:border-white/[0.08]',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'transition-colors',
              ].join(' ')}
            />

          </div>
          {/* ══ End right panel ══ */}

        </div>
      </main>
    </div>
  );
}
