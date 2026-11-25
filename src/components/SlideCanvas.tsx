import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { PortfolioSlide } from '../types/portfolio';

interface SlideCanvasProps {
  slide: PortfolioSlide;
  slideNumber: number;
  totalSlides: number;
  accentColor: string;
  creatorName: string;
  creatorHandle: string;
  category: string;
  compact?: boolean;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  slideNumber,
  totalSlides,
  accentColor,
  creatorName,
  creatorHandle,
  category,
  compact = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const isDark = slide.backgroundStyle === 'dark';
  const isAccent = slide.backgroundStyle === 'accent';

  const containerBg = isAccent
    ? { backgroundColor: accentColor, color: '#FFFFFF' }
    : isDark
      ? { backgroundColor: '#0C101A', color: '#F8FAFC' }
      : { backgroundColor: '#FFFFFF', color: '#0F172A' };

  const mutedClass = isAccent
    ? 'text-white/80'
    : isDark
      ? 'text-slate-400'
      : 'text-slate-600';

  const surfaceClass = isAccent
    ? 'bg-white/15 border-white/20 text-white'
    : isDark
      ? 'bg-[#151B2B] border-slate-800 text-slate-100'
      : 'bg-[#F6F7FB] border-slate-200 text-slate-900';

  const hasImage = Boolean(slide.imageUrl) && !imgFailed;
  const showSplitImage =
    hasImage && (slide.layout === 'cover' || slide.layout === 'editorial-split' || slide.layout === 'full-showcase');

  return (
    <div
      style={containerBg}
      className={`relative w-full overflow-hidden rounded-2xl border ${
        isDark ? 'border-slate-800' : isAccent ? 'border-transparent' : 'border-slate-200'
      } ${compact ? 'p-4 sm:p-6' : 'p-6 sm:p-10'} flex flex-col justify-between min-h-[280px] sm:min-h-[380px]`}
    >
      {/* Top 3px brand accent edge */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: isAccent ? '#FFFFFF' : accentColor }}
      />

      {/* Slide Top Metadata */}
      <div className="flex items-center justify-between gap-4 pb-4">
        <span
          className="text-xs font-semibold tracking-wider uppercase truncate"
          style={{ color: isAccent ? '#FFFFFF' : accentColor }}
        >
          {slide.eyebrow || `Section ${slideNumber}`}
        </span>
        <span className={`font-mono-tabular text-xs shrink-0 ${mutedClass}`}>
          {String(slideNumber).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
        </span>
      </div>

      {/* Main Slide Body */}
      <div
        className={`flex-1 grid gap-6 items-center ${
          showSplitImage ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
        }`}
      >
        <div className={showSplitImage ? 'lg:col-span-6 space-y-4' : 'space-y-5 max-w-4xl'}>
          <h3
            className={`${
              slide.layout === 'cover'
                ? compact
                  ? 'text-xl sm:text-2xl font-extrabold'
                  : 'text-2xl sm:text-4xl font-extrabold'
                : compact
                  ? 'text-lg sm:text-xl font-bold'
                  : 'text-xl sm:text-3xl font-bold'
            } tracking-tight leading-tight text-balance`}
          >
            {slide.title || 'Untitled Slide'}
          </h3>

          {slide.subtitle && (
            <p className={`${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-medium leading-relaxed ${mutedClass}`}>
              {slide.subtitle}
            </p>
          )}

          {slide.body && !compact && (
            <p className={`text-sm leading-relaxed ${isAccent ? 'text-white/90' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {slide.body}
            </p>
          )}

          {/* Metrics Grid */}
          {slide.metrics && slide.metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {slide.metrics.slice(0, 4).map((metric, idx) => (
                <div key={`${metric.label}_${idx}`} className={`rounded-xl border p-3.5 ${surfaceClass}`}>
                  <div
                    className="font-mono-tabular text-xl sm:text-2xl font-bold"
                    style={{ color: isAccent ? '#FFFFFF' : accentColor }}
                  >
                    {metric.value}
                  </div>
                  <div className={`text-xs mt-1 ${mutedClass}`}>{metric.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Palette Swatches */}
          {slide.layout === 'palette-type' && slide.paletteColors && slide.paletteColors.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {slide.paletteColors.slice(0, 4).map((hex, idx) => (
                <div key={`${hex}_${idx}`} className={`rounded-xl border p-2.5 ${surfaceClass}`}>
                  <div
                    className="h-12 w-full rounded-lg border border-black/10"
                    style={{ backgroundColor: hex }}
                  />
                  <div className="font-mono-tabular text-xs font-semibold mt-2">{hex.toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}

          {/* Bullet Highlights */}
          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="space-y-2 pt-1">
              {slide.bullets.slice(0, compact ? 2 : 4).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
                  <span
                    className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: isAccent ? '#FFFFFF' : accentColor }}
                    aria-hidden="true"
                  />
                  <span className={isAccent ? 'text-white/95' : isDark ? 'text-slate-200' : 'text-slate-700'}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showSplitImage && (
          <div className="lg:col-span-6 h-full">
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-slate-200 dark:bg-slate-800">
              <img
                src={slide.imageUrl}
                alt={slide.title || 'Portfolio slide visual'}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {!showSplitImage && slide.imageUrl && imgFailed && (
          <div className={`rounded-xl border p-6 flex items-center justify-center gap-2 text-xs ${surfaceClass}`}>
            <ImageIcon className="w-4 h-4" />
            <span>Visual preview unavailable</span>
          </div>
        )}
      </div>

      {/* Slide Footer */}
      <div
        className={`mt-6 pt-3 border-t flex items-center justify-between gap-4 text-xs ${
          isAccent ? 'border-white/20 text-white/80' : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <span className="truncate font-medium">
          {creatorName} · @{creatorHandle}
        </span>
        <span className="truncate">{category}</span>
      </div>
    </div>
  );
};
