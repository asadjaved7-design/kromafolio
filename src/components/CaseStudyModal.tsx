import React, { useState } from 'react';
import {
  Bookmark,
  Download,
  ExternalLink,
  Heart,
  Layers,
  MapPin,
  X,
} from 'lucide-react';
import type { PortfolioDeck } from '../types/portfolio';
import { SlideCanvas } from './SlideCanvas';
import { AdBannerSlot } from './AdBannerSlot';
import { exportPortfolioToPdf } from '../lib/pdfExport';

interface CaseStudyModalProps {
  deck: PortfolioDeck | null;
  onClose: () => void;
  isAppreciated: boolean;
  isBookmarked: boolean;
  onToggleAppreciate: (deck: PortfolioDeck) => void;
  onToggleBookmark: (deck: PortfolioDeck) => void;
  onRemixInStudio: (deck: PortfolioDeck) => void;
  onOpenAdSenseGuide: () => void;
}

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({
  deck,
  onClose,
  isAppreciated,
  isBookmarked,
  onToggleAppreciate,
  onToggleBookmark,
  onRemixInStudio,
  onOpenAdSenseGuide,
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!deck) return null;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await exportPortfolioToPdf(deck);
    } finally {
      setDownloading(false);
    }
  };

  const safeExternalUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('https://') || url.startsWith('http://') ? url : '';
  };

  const behanceLink = safeExternalUrl(deck.behanceUrl);
  const dribbbleLink = safeExternalUrl(deck.dribbbleUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#F6F7FB] dark:bg-[#0A0D14] overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Reader Bar */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-4 sm:px-8 h-16 bg-white/95 dark:bg-[#121722]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ backgroundColor: deck.accentColor || '#2563EB' }}
          >
            {deck.creatorName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {deck.title}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {deck.creatorName} · {deck.category} · {deck.slides.length} Slides
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {deck.allowFreePdf && (
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={downloading}
              className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{downloading ? 'Exporting PDF...' : 'Download Free PDF'}</span>
              <span className="sm:hidden">{downloading ? 'PDF...' : 'PDF'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close case study"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Vertical Behance-Style Case Study Canvas */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Case Study Header Overview */}
          <div className="rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-[#2563EB] dark:text-blue-400">{deck.category}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {deck.creatorLocation || 'Global'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{deck.skills.join(' / ')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
                {deck.title}
              </h1>
              {deck.subtitle && (
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {deck.subtitle}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleAppreciate(deck)}
                className={`min-h-[44px] px-4 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                  isAppreciated
                    ? 'bg-[#FF5A36] border-[#FF5A36] text-white'
                    : 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Heart className={`w-4 h-4 ${isAppreciated ? 'fill-current' : ''}`} />
                <span className="font-mono-tabular">{deck.appreciationCount}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleBookmark(deck)}
                aria-label="Bookmark portfolio"
                className={`min-h-[44px] min-w-[44px] px-3.5 rounded-xl border inline-flex items-center justify-center transition-colors ${
                  isBookmarked
                    ? 'bg-[#2563EB] border-[#2563EB] text-white'
                    : 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => onRemixInStudio(deck)}
                className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Layers className="w-4 h-4" />
                <span>Remix Slides</span>
              </button>
            </div>
          </div>

          {/* Stacked Presentation Slides */}
          <div className="space-y-6">
            {deck.slides.map((slide, idx) => (
              <SlideCanvas
                key={slide.id || idx}
                slide={slide}
                slideNumber={idx + 1}
                totalSlides={deck.slides.length}
                accentColor={deck.accentColor}
                creatorName={deck.creatorName}
                creatorHandle={deck.creatorHandle}
                category={deck.category}
              />
            ))}
          </div>

          {/* Creator External Links & Download Card */}
          <div className="rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Presented by {deck.creatorName} (@{deck.creatorHandle})
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Explore external case studies or download the full widescreen PDF deck free.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {behanceLink && (
                <a
                  href={behanceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                >
                  <span>Behance</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {dribbbleLink && (
                <a
                  href={dribbbleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                >
                  <span>Dribbble</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {deck.allowFreePdf && (
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={downloading}
                  className="min-h-[44px] px-5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloading ? 'Preparing PDF...' : 'Free PDF Presentation'}</span>
                </button>
              )}
            </div>
          </div>

          <AdBannerSlot slotType="reader" onOpenAdSenseGuide={onOpenAdSenseGuide} />
        </div>
      </div>
    </div>
  );
};
