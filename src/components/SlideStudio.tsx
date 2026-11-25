import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  Globe,
  Monitor,
  Plus,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  DISCIPLINE_CATEGORIES,
  type CreatorProfile,
  type DisciplineCategory,
  type PortfolioDeck,
  type PortfolioSlide,
  type SlideLayout,
} from '../types/portfolio';
import { STUDIO_ASSET_PRESETS } from '../data/curatedPortfolios';
import { SlideCanvas } from './SlideCanvas';
import { exportPortfolioToPdf } from '../lib/pdfExport';

interface SlideStudioProps {
  deck: PortfolioDeck;
  onChangeDeck: (next: PortfolioDeck) => void;
  creatorProfile: CreatorProfile | null;
  isSignedIn: boolean;
  onRequireSignIn: () => void;
  onSaveDeck: (deck: PortfolioDeck) => Promise<void>;
}

const SLIDE_LAYOUT_OPTIONS: { value: SlideLayout; label: string }[] = [
  { value: 'cover', label: 'Cover Slide' },
  { value: 'editorial-split', label: 'Editorial Split' },
  { value: 'process-steps', label: 'Process Steps' },
  { value: 'palette-type', label: 'Palette & Swatches' },
  { value: 'metrics-impact', label: 'Impact Metrics' },
  { value: 'full-showcase', label: 'Visual Showcase' },
  { value: 'closing-credits', label: 'Closing Credits' },
];

export const SlideStudio: React.FC<SlideStudioProps> = ({
  deck,
  onChangeDeck,
  creatorProfile,
  isSignedIn,
  onRequireSignIn,
  onSaveDeck,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewFrame, setPreviewFrame] = useState<'widescreen' | 'mobile'>('widescreen');
  const [polishing, setPolishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const safeIdx = Math.min(activeIndex, Math.max(0, deck.slides.length - 1));
  const activeSlide = deck.slides[safeIdx];

  const updateSlide = (patch: Partial<PortfolioSlide>) => {
    const nextSlides = deck.slides.map((s, i) => (i === safeIdx ? { ...s, ...patch } : s));
    onChangeDeck({ ...deck, slides: nextSlides });
  };

  const addSlide = () => {
    if (deck.slides.length >= 16) return;
    const newSlide: PortfolioSlide = {
      id: `slide_${Date.now()}`,
      layout: 'editorial-split',
      eyebrow: `0${deck.slides.length}. Case Study Chapter`,
      title: 'New Presentation Slide',
      subtitle: 'Summarize the design decision or user research insight.',
      body: 'Write concise, persuasive storytelling for clients and creative directors.',
      backgroundStyle: 'light',
      imageUrl: STUDIO_ASSET_PRESETS[0].url,
      bullets: ['Key deliverable or UX highlight', 'Measured outcome or validation'],
      metrics: [],
      paletteColors: [deck.accentColor, '#0F172A', '#FF5A36', '#F8FAFC'],
    };
    const nextSlides = [...deck.slides, newSlide];
    onChangeDeck({ ...deck, slides: nextSlides });
    setActiveIndex(nextSlides.length - 1);
  };

  const duplicateSlide = () => {
    if (deck.slides.length >= 16 || !activeSlide) return;
    const clone: PortfolioSlide = {
      ...activeSlide,
      id: `slide_${Date.now()}`,
      title: `${activeSlide.title} (Copy)`,
    };
    const nextSlides = [
      ...deck.slides.slice(0, safeIdx + 1),
      clone,
      ...deck.slides.slice(safeIdx + 1),
    ];
    onChangeDeck({ ...deck, slides: nextSlides });
    setActiveIndex(safeIdx + 1);
  };

  const moveSlide = (dir: -1 | 1) => {
    const target = safeIdx + dir;
    if (target < 0 || target >= deck.slides.length) return;
    const next = [...deck.slides];
    const [removed] = next.splice(safeIdx, 1);
    next.splice(target, 0, removed);
    onChangeDeck({ ...deck, slides: next });
    setActiveIndex(target);
  };

  const deleteSlide = () => {
    if (deck.slides.length <= 1) return;
    const next = deck.slides.filter((_, i) => i !== safeIdx);
    onChangeDeck({ ...deck, slides: next });
    setActiveIndex(Math.max(0, safeIdx - 1));
  };

  const handleAiPolishSlide = async () => {
    if (!activeSlide) return;
    setPolishing(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/ai/refine-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeSlide.title,
          body: activeSlide.body,
          discipline: deck.category,
          goal: 'Sharpen for a Behance PDF case study presentation',
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        title?: string;
        subtitle?: string;
        body?: string;
        bullets?: string[];
      };
      if (!response.ok || data.error) {
        throw new Error(data.error || 'AI slide polish failed.');
      }
      updateSlide({
        title: data.title || activeSlide.title,
        subtitle: data.subtitle || activeSlide.subtitle,
        body: data.body || activeSlide.body,
        bullets: data.bullets?.length ? data.bullets : activeSlide.bullets,
      });
      setFeedback({ type: 'success', text: 'Slide copy elevated with AI.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'AI polish failed.' });
    } finally {
      setPolishing(false);
    }
  };

  const handleSave = async (publishNow?: boolean) => {
    if (!isSignedIn) {
      onRequireSignIn();
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const targetDeck: PortfolioDeck = {
        ...deck,
        id: deck.isCuratedDemo ? `deck_${Date.now()}` : deck.id,
        isCuratedDemo: false,
        creatorName: creatorProfile?.displayName || deck.creatorName,
        creatorHandle: creatorProfile?.handle || deck.creatorHandle,
        creatorLocation: creatorProfile?.location || deck.creatorLocation,
        isPublished: publishNow !== undefined ? publishNow : deck.isPublished,
      };
      await onSaveDeck(targetDeck);
      onChangeDeck(targetDeck);
      setFeedback({
        type: 'success',
        text: targetDeck.isPublished
          ? 'Saved and published live to the Global Showcase.'
          : 'Saved privately to your Creator Studio.',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Unable to save deck.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setExporting(true);
    try {
      await exportPortfolioToPdf(deck);
      setFeedback({ type: 'success', text: 'Free widescreen PDF presentation downloaded.' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Studio Top Toolbar */}
      <div className="rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-xs font-semibold text-[#2563EB] dark:text-blue-400">
            Behance Slide Studio · {deck.slides.length}/16 Slides
          </div>
          <input
            type="text"
            value={deck.title}
            onChange={(e) => onChangeDeck({ ...deck, title: e.target.value })}
            maxLength={120}
            aria-label="Presentation Title"
            className="w-full text-lg sm:text-xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent focus:border-[#2563EB] focus:outline-none py-0.5"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-xl bg-[#F6F7FB] dark:bg-[#0A0D14] border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPreviewFrame('widescreen')}
              aria-label="Widescreen slide view"
              className={`min-h-[36px] px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                previewFrame === 'widescreen'
                  ? 'bg-white dark:bg-[#121722] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deck</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewFrame('mobile')}
              aria-label="Android mobile frame view"
              className={`min-h-[36px] px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                previewFrame === 'mobile'
                  ? 'bg-white dark:bg-[#121722] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Android</span>
            </button>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave(true)}
            className="min-h-[44px] px-4 rounded-xl bg-[#FF5A36] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4" />
            <span>{deck.isPublished ? 'Update Showcase' : 'Publish'}</span>
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleDownloadPdf()}
            className="min-h-[44px] px-4 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Exporting...' : 'Free PDF'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Slide Filmstrip Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {deck.slides.map((s, idx) => (
          <button
            key={s.id || idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left transition-colors shrink-0 max-w-[190px] ${
              idx === safeIdx
                ? 'bg-[#2563EB] border-[#2563EB] text-white'
                : 'bg-white dark:bg-[#121722] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="font-mono-tabular text-[10px] opacity-80">
              Slide {String(idx + 1).padStart(2, '0')}
            </div>
            <div className="text-xs font-semibold truncate">{s.title || 'Untitled'}</div>
          </button>
        ))}

        <button
          type="button"
          onClick={addSlide}
          disabled={deck.slides.length >= 16}
          className="min-h-[44px] px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-[#121722] inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Slide</span>
        </button>
      </div>

      {/* Main Studio Split: Canvas Preview + Slide Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div
            className={
              previewFrame === 'mobile'
                ? 'max-w-[390px] mx-auto rounded-[28px] border-[6px] border-slate-900 dark:border-slate-700 p-2 bg-slate-900 shadow-xl'
                : ''
            }
          >
            {activeSlide && (
              <SlideCanvas
                slide={activeSlide}
                slideNumber={safeIdx + 1}
                totalSlides={deck.slides.length}
                accentColor={deck.accentColor}
                creatorName={deck.creatorName}
                creatorHandle={deck.creatorHandle}
                category={deck.category}
                compact={previewFrame === 'mobile'}
              />
            )}
          </div>

          {/* Slide Reorder / Duplicate Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => moveSlide(-1)}
                disabled={safeIdx === 0}
                aria-label="Move slide up"
                className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveSlide(1)}
                disabled={safeIdx === deck.slides.length - 1}
                aria-label="Move slide down"
                className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={duplicateSlide}
                disabled={deck.slides.length >= 16}
                className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
              <button
                type="button"
                onClick={deleteSlide}
                disabled={deck.slides.length <= 1}
                aria-label="Delete slide"
                className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-red-600 dark:text-red-400 disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={polishing}
              onClick={() => void handleAiPolishSlide()}
              className="min-h-[40px] px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{polishing ? 'Polishing...' : 'AI Polish Slide'}</span>
            </button>
          </div>
        </div>

        {/* Right Inspector Panel */}
        {activeSlide && (
          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Slide {safeIdx + 1} Inspector
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Layout Template
                </label>
                <select
                  value={activeSlide.layout}
                  onChange={(e) => updateSlide({ layout: e.target.value as SlideLayout })}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3 text-xs font-medium text-slate-900 dark:text-white"
                >
                  {SLIDE_LAYOUT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Slide Surface
                </label>
                <select
                  value={activeSlide.backgroundStyle}
                  onChange={(e) =>
                    updateSlide({ backgroundStyle: e.target.value as 'light' | 'dark' | 'accent' })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="light">Crisp Light</option>
                  <option value="dark">Obsidian Dark</option>
                  <option value="accent">Brand Accent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Eyebrow Label
              </label>
              <input
                type="text"
                value={activeSlide.eyebrow}
                onChange={(e) => updateSlide({ eyebrow: e.target.value })}
                maxLength={80}
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Slide Headline
              </label>
              <input
                type="text"
                value={activeSlide.title}
                onChange={(e) => updateSlide({ title: e.target.value })}
                maxLength={120}
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={activeSlide.subtitle}
                onChange={(e) => updateSlide({ subtitle: e.target.value })}
                maxLength={220}
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Case Study Body Copy
              </label>
              <textarea
                rows={3}
                value={activeSlide.body}
                onChange={(e) => updateSlide({ body: e.target.value })}
                maxLength={900}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] p-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Key Bullet Points (one per line)
              </label>
              <textarea
                rows={3}
                value={activeSlide.bullets.join('\n')}
                onChange={(e) =>
                  updateSlide({
                    bullets: e.target.value
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean)
                      .slice(0, 5),
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] p-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {activeSlide.layout === 'metrics-impact' && (
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Impact Metrics (up to 4)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(activeSlide.metrics.length
                    ? activeSlide.metrics
                    : [
                        { label: 'Conversion', value: '+38%' },
                        { label: 'Task Time', value: '12s' },
                      ]
                  ).map((m, mIdx) => (
                    <div key={mIdx} className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 space-y-1">
                      <input
                        type="text"
                        value={m.value}
                        onChange={(e) => {
                          const base = activeSlide.metrics.length
                            ? [...activeSlide.metrics]
                            : [
                                { label: 'Conversion', value: '+38%' },
                                { label: 'Task Time', value: '12s' },
                              ];
                          base[mIdx] = { ...base[mIdx], value: e.target.value };
                          updateSlide({ metrics: base });
                        }}
                        placeholder="+40%"
                        className="w-full text-xs font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={m.label}
                        onChange={(e) => {
                          const base = activeSlide.metrics.length
                            ? [...activeSlide.metrics]
                            : [
                                { label: 'Conversion', value: '+38%' },
                                { label: 'Task Time', value: '12s' },
                              ];
                          base[mIdx] = { ...base[mIdx], label: e.target.value };
                          updateSlide({ metrics: base });
                        }}
                        placeholder="Metric label"
                        className="w-full text-[11px] bg-transparent text-slate-500 dark:text-slate-400 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Slide Visual Artwork
              </span>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {STUDIO_ASSET_PRESETS.map((asset) => (
                  <button
                    key={asset.url}
                    type="button"
                    onClick={() => updateSlide({ imageUrl: asset.url })}
                    className={`aspect-[4/3] rounded-lg overflow-hidden border-2 ${
                      activeSlide.imageUrl === asset.url ? 'border-[#2563EB]' : 'border-transparent opacity-75'
                    }`}
                  >
                    <img src={asset.url} alt={asset.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={activeSlide.imageUrl}
                onChange={(e) => updateSlide({ imageUrl: e.target.value })}
                placeholder="Paste image URL or leave blank for typography-only slide"
                className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Deck Category
                </label>
                <select
                  value={deck.category}
                  onChange={(e) => onChangeDeck({ ...deck, category: e.target.value as DisciplineCategory })}
                  className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3 text-xs text-slate-900 dark:text-white"
                >
                  {DISCIPLINE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Brand Accent
                </label>
                <input
                  type="color"
                  value={deck.accentColor}
                  onChange={(e) => onChangeDeck({ ...deck, accentColor: e.target.value })}
                  className="w-full h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-1.5 py-1 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
