'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCheck,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Github,
  Heart,
  ImagePlus,
  Languages,
  Loader2,
  Moon,
  PencilLine,
  ScanText,
  ShieldCheck,
  Sun,
  X,
  Zap,
} from 'lucide-react';

import { useOCR } from '@/hooks/useOCR';
import { LANGUAGE_OPTIONS } from '@/lib/ocr';
import type { Theme, UILanguage } from '@/types/ocr';

const UI_TEXT = {
  th: {
    brand: 'ProjectOCR',
    navTool: 'เครื่องมือ',
    navHow: 'วิธีใช้',
    navCredit: 'เครดิต',
    heroBadge: 'OCR ภาษาไทยและอังกฤษ',
    heroTitle: 'ดึงข้อความจากรูปได้เร็ว อ่านง่าย และแก้ต่อได้ทันที',
    heroDesc:
      'อัปโหลดรูปแล้วระบบจะช่วยแยกข้อความให้อัตโนมัติ เหมาะกับเอกสาร ใบเสร็จ โน้ต และภาพหน้าจอ ใช้งานได้บนมือถือและคอมพิวเตอร์แบบไม่ต้องติดตั้งอะไรเพิ่ม',
    privacy: 'ประมวลผลบนเครื่องคุณ ไม่ส่งรูปขึ้นเซิร์ฟเวอร์',
    uploadTitle: 'วางรูปตรงนี้ หรือกดเพื่อเลือกไฟล์',
    uploadHint: 'รองรับ PNG และ JPG',
    chooseFile: 'เลือกไฟล์',
    replaceImage: 'เปลี่ยนรูป',
    removeImage: 'ลบรูป',
    ocrLanguage: 'ภาษาที่อยู่ในรูป',
    theme: 'สลับโหมด',
    siteLanguage: 'เปลี่ยนภาษาเว็บ',
    start: 'เริ่มอ่านข้อความ',
    ready: 'พร้อมแล้ว กดเริ่มอ่านได้เลย',
    working: 'กำลังอ่านภาพ…',
    result: 'ข้อความที่ดึงได้',
    copy: 'คัดลอก',
    copied: 'คัดลอกแล้ว',
    download: 'ดาวน์โหลด .txt',
    chars: 'ตัวอักษร',
    words: 'คำ',
    empty: 'ยังไม่มีข้อความ แต่อัปโหลดรูปแล้วกด “เริ่มอ่านข้อความ” ได้เลย',
    error: 'อ่านไม่สำเร็จ ลองใช้รูปที่คมขึ้น หรือเลือกภาษาที่ตรงกับภาพมากกว่า',
    statusDone: 'อ่านเสร็จแล้ว',
    statusIdle: 'รอรูปอยู่',
    howTitle: 'ใช้งานยังไง',
        howDesc: 'ทำตาม 3 ขั้นสั้น ๆ',
    step1: 'อัปโหลดรูป',
    step2: 'เลือกภาษาที่ตรงกับเอกสาร',
    step3: 'กดอ่าน แล้วแก้ข้อความต่อได้ทันที',
    seoTitle: 'OCR ที่ออกแบบมาให้ค้นหาเจอง่ายและใช้จริงได้',
    seoDesc:
      'ProjectOCR ถูกวางโครงให้รองรับทั้ง SEO, responsive layout, dark mode, และการใช้งานบนมือถือแบบไม่อึดอัด เหมาะกับคนที่ต้องการดึงข้อความจากรูปอย่างรวดเร็วและนำไปใช้งานต่อได้',
    footerNote: 'สร้างไว้เพื่อเรียนรู้ ใช้งานจริง และต่อยอดต่อได้ง่าย',
    credits: 'เครดิตและแหล่งเรียนรู้',
    madeWith: 'ทำด้วย',
    resources: 'แหล่งอ้างอิง',
  },
  en: {
    brand: 'ProjectOCR',
    navTool: 'Tool',
    navHow: 'How it works',
    navCredit: 'Credits',
    heroBadge: 'Thai and English OCR',
    heroTitle: 'Pull text from images fast, clean, and ready to edit',
    heroDesc:
      'Upload an image and the app will extract the text for you. It works well for documents, receipts, notes, and screenshots on both mobile and desktop, with no extra setup.',
    privacy: 'Processed on your device. Nothing is sent to a server.',
    uploadTitle: 'Drop an image here, or click to pick a file',
    uploadHint: 'PNG and JPG are supported',
    chooseFile: 'Choose file',
    replaceImage: 'Replace image',
    removeImage: 'Remove image',
    ocrLanguage: 'Language in the image',
    theme: 'Toggle theme',
    siteLanguage: 'Switch website language',
    start: 'Start reading',
    ready: 'Ready when you are',
    working: 'Reading the image…',
    result: 'Extracted text',
    copy: 'Copy',
    copied: 'Copied',
    download: 'Download .txt',
    chars: 'characters',
    words: 'words',
    empty: 'No text yet. Upload an image and press “Start reading”.',
    error: 'The image could not be read. Try a clearer image or a different language setting.',
    statusDone: 'Done',
    statusIdle: 'Waiting for an image',
    howTitle: 'How it works',
        howDesc: 'Just 3 quick steps.',
    step1: 'Upload an image',
    step2: 'Pick the right language',
    step3: 'Read, then edit the result right away',
    seoTitle: 'OCR built to be easy to find and practical to use',
    seoDesc:
      'ProjectOCR is structured for SEO, responsive layouts, dark mode, and a smoother mobile experience. It is built for people who want to extract text from images quickly and reuse it immediately.',
    footerNote: 'Built for learning, real usage, and easy future extension.',
    credits: 'Credits & resources',
    madeWith: 'Made with',
    resources: 'Resources',
  },
} as const;

const featureCards = [
  {
    icon: ShieldCheck,
    tone: 'from-emerald-500 to-teal-500',
    th: 'ใช้งานได้บนเครื่องคุณ',
    en: 'Runs on your device',
    thDesc: 'ภาพถูกประมวลผลในแท็บเบราว์เซอร์ ไม่มีการส่งไฟล์ขึ้นเซิร์ฟเวอร์',
    enDesc: 'Images are handled in the browser. Nothing needs to leave the device.',
  },
  {
    icon: Zap,
    tone: 'from-blue-500 to-cyan-500',
    th: 'อ่านง่ายขึ้น',
    en: 'Cleaner output',
    thDesc: 'มีการปรับภาพก่อนอ่านเพื่อช่วยให้ตัวอักษรชัดขึ้น โดยเฉพาะข้อความไทย',
    enDesc: 'Images are preprocessed so text becomes easier for OCR to read.',
  },
  {
    icon: PencilLine,
    tone: 'from-violet-500 to-fuchsia-500',
    th: 'แก้ต่อได้ทันที',
    en: 'Editable result',
    thDesc: 'ข้อความที่อ่านได้อยู่ในช่องแก้ไข กดคัดลอกหรือดาวน์โหลดต่อได้เลย',
    enDesc: 'The extracted text stays editable, so you can copy or save it right away.',
  },
] as const;

export default function Home() {
  const [uiLanguage, setUiLanguage] = useState<UILanguage>('th');
  const [theme, setTheme] = useState<Theme>('light');
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [ocrMenuOpen, setOcrMenuOpen] = useState(false);
  const ocrMenuRef = useRef<HTMLDivElement>(null);

  const {
    fileInputRef,
    uploadedImage,
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
  } = useOCR();

  const t = UI_TEXT[uiLanguage];
  const isLoadingPhase = status === 'preprocessing' || status === 'loading';
  const isRecognizingPhase = status === 'recognizing';

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!ocrMenuRef.current?.contains(event.target as Node)) {
        setOcrMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOcrMenuOpen(false);
      }
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

    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }

    if (savedLanguage === 'th' || savedLanguage === 'en') {
      setUiLanguage(savedLanguage);
    }

    setPreferencesReady(true);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;

    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.lang = uiLanguage;
    localStorage.setItem('projectocr-theme', theme);
    localStorage.setItem('projectocr-language', uiLanguage);
  }, [preferencesReady, theme, uiLanguage]);

  const selectedOcrLabel =
    LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? LANGUAGE_OPTIONS[0].label;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,.16),_transparent_30%),linear-gradient(to_bottom,_#f8fbff,_#eef5ff)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,.18),_transparent_28%),linear-gradient(to_bottom,_#08111f,_#020617)] dark:text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <header className="sticky top-2 z-40 mb-3 rounded-2xl border border-white/70 bg-white/85 px-3 py-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 sm:top-3 sm:mb-4 sm:rounded-3xl sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <a href="#top" className="flex min-w-0 items-center gap-2 font-bold sm:gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20 sm:h-11 sm:w-11">
                <ScanText className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm leading-tight sm:text-base">{t.brand}</span>
                <span className="hidden text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:block">
                  {t.heroBadge}
                </span>
              </span>
            </a>

            <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
              <a className="rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-blue-300" href="#tool">
                {t.navTool}
              </a>
              <a className="rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-blue-300" href="#how">
                {t.navHow}
              </a>
              <a className="rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-blue-300" href="#credits">
                {t.navCredit}
              </a>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setUiLanguage((value) => (value === 'th' ? 'en' : 'th'))}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:h-11 sm:gap-2 sm:px-3 sm:text-sm"
                aria-label={t.siteLanguage}
                title={t.siteLanguage}
              >
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline">{uiLanguage === 'th' ? 'EN' : 'ไทย'}</span>
                <span className="sm:hidden">{uiLanguage === 'th' ? 'EN' : 'TH'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:h-11 sm:w-11 sm:rounded-2xl"
                aria-label={t.theme}
                title={t.theme}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        <section id="top" className="grid flex-1 gap-6 pb-8 pt-2 lg:grid-cols-[1fr_.95fr] lg:items-start lg:gap-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {t.privacy}
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl xl:text-6xl">
                {t.heroTitle}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                {t.heroDesc}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.en}
                    className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_16px_40px_-26px_rgba(15,23,42,.35)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-4 text-base font-bold">{uiLanguage === 'th' ? card.th : card.en}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {uiLanguage === 'th' ? card.thDesc : card.enDesc}
                    </p>
                  </article>
                );
              })}
            </div>

            <section
              id="how"
              className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_70px_-40px_rgba(37,99,235,.42)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 px-5 py-5 text-white sm:px-7 sm:py-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xl font-black tracking-tight sm:text-2xl">{t.howTitle}</h2>
                    <p className="mt-1 text-sm leading-6 text-white/85">
                      {t.howDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
                {[
                  {
                    step: '01',
                    title: t.step1,
                    desc: uiLanguage === 'th' ? 'ลากรูปหรือแตะเพื่อเลือกไฟล์' : 'Drop or tap to choose a file.',
                  },
                  {
                    step: '02',
                    title: t.step2,
                    desc: uiLanguage === 'th' ? 'เลือกภาษาให้ตรงกับข้อความ' : 'Pick the matching language.',
                  },
                  {
                    step: '03',
                    title: t.step3,
                    desc: uiLanguage === 'th' ? 'กดอ่าน แล้วแก้ต่อได้ทันที' : 'Read, then edit right away.',
                  },
                ].map((item, index) => (
                  <div
                    key={item.title}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.03]"
                  >
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-blue-500/20">
                        {item.step}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </div>
                        <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section
            id="tool"
            className="rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_70px_-35px_rgba(37,99,235,.45)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-white/10">
              <div>
                <h2 className="text-xl font-extrabold sm:text-2xl">{t.result}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {uploadedImage ? (isProcessing ? t.working : t.ready) : t.statusIdle}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleFileInput}
              />

              <div
                role="button"
                tabIndex={0}
                onKeyDown={handleZoneKeyDown}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFilePicker}
                className={`group relative overflow-hidden rounded-[1.6rem] border-2 border-dashed p-5 text-center transition sm:p-8 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-500/10'
                    : 'border-slate-200 bg-slate-50/80 hover:border-blue-300 hover:bg-blue-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10'
                }`}
              >
                {previewSrc ? (
                  <div className="grid gap-4 lg:grid-cols-[240px_1fr] lg:items-start">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                      <img
                        src={previewSrc}
                        alt={uiLanguage === 'th' ? 'ภาพที่อัปโหลด' : 'Uploaded preview'}
                        className="h-auto w-full object-cover"
                      />
                    </div>

                    <div className="space-y-4 text-left">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {uploadedImage?.file.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {fileSizeLabel}
                          {isPreprocessed ? ` · ${uiLanguage === 'th' ? 'ปรับภาพแล้ว' : 'Preprocessed'}` : ''}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openFilePicker();
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                        >
                          <ImagePlus className="h-4 w-4" />
                          {t.replaceImage}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            clearImage();
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                          <X className="h-4 w-4" />
                          {t.removeImage}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <span className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg">
                      <ImagePlus className="h-7 w-7" />
                    </span>
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{t.uploadTitle}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.uploadHint}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 dark:bg-white/5 dark:text-blue-300 dark:ring-white/10">
                      {t.chooseFile}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.3fr_.7fr]">
                <div ref={ocrMenuRef} className="relative">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {t.ocrLanguage}
                  </label>
                  <button
                    type="button"
                    onClick={() => setOcrMenuOpen((value) => !value)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    <span>{selectedOcrLabel}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {ocrMenuOpen ? (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-950">
                      {LANGUAGE_OPTIONS.map((option) => {
                        const active = option.value === language;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setLanguage(option.value);
                              setOcrMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                              active
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200'
                                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5'
                            }`}
                          >
                            <span>{option.label}</span>
                            {active ? <Check className="h-4 w-4" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={runOCR}
                    disabled={!uploadedImage || isProcessing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    {t.start}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{statusLabel || (hasResult ? t.statusDone : t.statusIdle)}</span>
                  <span>{isRecognizingPhase ? `${progress}%` : '0%'}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  {isLoadingPhase ? (
                    <div className="h-full w-0 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 opacity-80 transition-[width] duration-300" />
                  ) : (
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-[width] duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </div>
              </div>

              {errorMsg ? (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              ) : null}

              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold">{t.result}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {resultText.length} {t.chars} · {wordCount} {t.words}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!hasResult}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? t.copied : t.copy}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={!hasResult}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      <Download className="h-4 w-4" />
                      {t.download}
                    </button>
                  </div>
                </div>

                <textarea
                  value={resultText}
                  onChange={(event) => setResultText(event.target.value)}
                  placeholder={t.empty}
                  className="mt-4 min-h-[240px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-white/[0.05] dark:focus:ring-blue-500/10"
                />
              </div>
            </div>
          </section>
        </section>

        <section id="seo" className="pb-8">
          <div className="rounded-[2rem] border border-blue-200/70 bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-2xl shadow-violet-500/15">
            <div className="rounded-[calc(2rem-1px)] bg-white/95 p-6 dark:bg-slate-950/95 sm:p-8">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold sm:text-3xl">{t.seoTitle}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
                    {t.seoDesc}
                  </p>
                </div>
                <a
                  href="#tool"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5 dark:bg-slate-100"
                >
                  {t.start}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer id="credits" className="border-t border-white/70 bg-white/60 px-1 py-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.02]">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <div className="flex items-center gap-2 font-bold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                  <ScanText className="h-4 w-4" />
                </span>
                {t.brand}
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                {t.footerNote}
              </p>
              <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                {t.madeWith} <Heart className="h-3.5 w-3.5 fill-fuchsia-500 text-fuchsia-500" />{' '}
                {uiLanguage === 'th' ? 'เพื่อเครื่องมือที่ใช้งานได้จริง' : 'for useful tools'}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.credits}</h3>
              <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
                <a
                  href="https://tesseract.projectnaptha.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Tesseract.js <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://github.com/tesseract-ocr/tesseract"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <Github className="h-3.5 w-3.5" /> Tesseract OCR
                </a>
                <a
                  href="https://nextjs.org/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Next.js <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://lucide.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Lucide <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
