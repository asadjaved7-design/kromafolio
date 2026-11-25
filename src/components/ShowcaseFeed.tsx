import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Download,
  Heart,
  Image as ImageIcon,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
} from 'lucide-react';
import {
  DISCIPLINE_CATEGORIES,
  type AppTab,
  type PortfolioDeck,
} from '../types/portfolio';
import { HERO_STUDIO_IMAGE } from '../data/curatedPortfolios';
import { AdBannerSlot } from './AdBannerSlot';
import { exportPortfolioToPdf } from '../lib/pdfExport';

interface ShowcaseFeedProps {
  portfolios: PortfolioDeck[];
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (tab: AppTab) => void;
  onOpenSubmitModal: () => void;
  onSelectDeck: (deck: PortfolioDeck) => void;
  appreciatedIds: Set<string>;
  bookmarkedIds: Set<string>;
  onToggleAppreciate: (deck: PortfolioDeck) => void;
  onToggleBookmark: (deck: PortfolioDeck) => void;
  onOpenAdSenseGuide: () => void;
  loading: boolean;
}

export const ShowcaseFeed: React.FC<ShowcaseFeedProps> = ({
  portfolios,
  theme,
  onToggleTheme,
  onNavigate,
  onOpenSubmitModal,
  onSelectDeck,
  appreciatedIds,
  bookmarkedIds,
  onToggleAppreciate,
  onToggleBookmark,
  onOpenAdSenseGuide,
  loading,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'appreciated'>('trending');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const filteredPortfolios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = portfolios.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.creatorName.toLowerCase().includes(q) ||
        p.creatorLocation.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q))
      );
    });

    if (sortBy === 'appreciated') {
      return [...list].sort((a, b) => (b.appreciationCount || 0) - (a.appreciationCount || 0));
    }
    if (sortBy === 'newest') {
      return [...list].sort((a, b) => (a.isCuratedDemo ? 1 : 0) - (b.isCuratedDemo ? 1 : 0));
    }
    return list;
  }, [portfolios, selectedCategory, searchQuery, sortBy]);

  const handleQuickPdf = async (e: React.MouseEvent, deck: PortfolioDeck) => {
    e.stopPropagation();
    setDownloadingId(deck.id);
    try {
      await exportPortfolioToPdf(deck);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-10 pb-8">
      {/* Hero Split Section */}
      <section className="rounded-3xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold tracking-wide text-[#2563EB] dark:text-blue-400">
                  Global Creator Studio · Android & Web
                </span>

                {/* Theme Toggle in Hero Workspace Bar */}
                <button
                  type="button"
                  onClick={onToggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F7FB] dark:bg-[#0A0D14] text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#2563EB]" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] text-balance">
                Build Behance-grade portfolio slides with AI and export free PDFs.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Sign up from anywhere in the world, craft multi-slide case studies tailored to your skills, download
                print-ready PDFs at zero cost, and submit your work to our Behance and Dribbble community showcase.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('ai')}
                className="min-h-[48px] px-6 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors active:scale-[0.98] whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Portfolio</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('studio')}
                className="min-h-[48px] px-5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>Open Slide Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[240px] sm:min-h-[320px] lg:min-h-full bg-slate-100 dark:bg-slate-900">
            <img
              src={HERO_STUDIO_IMAGE}
              alt="KromaFolio mobile and tablet portfolio slide studio on designer desk"
              referrerPolicy="no-referrer"
              className="w-full h-full lg:h-full object-cover"
            />
          </div>
        </div>

        {/* Full-Width 4-Column Proof Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-slate-200 dark:border-slate-800 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-5">
            <div className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white">100% Free</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Widescreen PDF presentation export</div>
          </div>
          <div className="p-5">
            <div className="font-mono-tabular text-xl font-bold text-[#2563EB] dark:text-blue-400">Gemini AI</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Skill-tailored slide deck builder</div>
          </div>
          <div className="p-5">
            <div className="font-mono-tabular text-xl font-bold text-[#FF5A36]">8 Disciplines</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">UI/UX, Brand, 3D, Dev & Photo</div>
          </div>
          <div className="p-5">
            <div className="font-mono-tabular text-xl font-bold text-emerald-600 dark:text-emerald-400">Global</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Behance & Dribbble style showcase</div>
          </div>
        </div>
      </section>

      {/* Showcase Toolbar */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Global Creator Showcase
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Explore live presentation decks or submit your Behance, Dribbble, and KromaFolio projects.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSubmitModal}
            className="min-h-[44px] px-5 rounded-xl bg-[#FF5A36] hover:bg-orange-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Your Portfolio</span>
          </button>
        </div>

        {/* Filter & Search Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {['All', ...DISCIPLINE_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills, creators..."
                className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121722] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'trending' | 'newest' | 'appreciated')}
              aria-label="Sort portfolios"
              className="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121722] text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="trending">Trending</option>
              <option value="appreciated">Most Appreciated</option>
              <option value="newest">Community Latest</option>
            </select>
          </div>
        </div>

        {/* Showcase Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPortfolios.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No portfolios match your filter</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Try switching categories or be the first creator to submit a case study here.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="min-h-[44px] px-5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPortfolios.map((deck) => {
                const isAppreciated = appreciatedIds.has(deck.id);
                const isBookmarked = bookmarkedIds.has(deck.id);
                const imgBroken = failedImages.has(deck.id) || !deck.coverImage;

                return (
                  <article
                    key={deck.id}
                    onClick={() => onSelectDeck(deck)}
                    className="group cursor-pointer rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
                        {!imgBroken ? (
                          <img
                            src={deck.coverImage}
                            alt={deck.title}
                            referrerPolicy="no-referrer"
                            onError={() => setFailedImages((prev) => new Set(prev).add(deck.id))}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex flex-col items-center justify-center p-6 text-white text-center gap-2"
                            style={{
                              background: `linear-gradient(135deg, ${deck.accentColor || '#2563EB'}, #0F172A)`,
                            }}
                          >
                            <ImageIcon className="w-7 h-7 opacity-80" />
                            <span className="text-sm font-bold line-clamp-2">{deck.title}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 space-y-2.5">
                        {/* Zero-pill unboxed metadata */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                          <span className="font-semibold text-[#2563EB] dark:text-blue-400">{deck.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{deck.creatorLocation || 'Global'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular shrink-0">{deck.slides.length} Slides</span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">
                          {deck.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {deck.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                          style={{ backgroundColor: deck.accentColor || '#2563EB' }}
                        >
                          {deck.creatorName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {deck.creatorName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleAppreciate(deck);
                          }}
                          aria-label={`Appreciate ${deck.title}`}
                          className={`min-h-[40px] px-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                            isAppreciated
                              ? 'text-[#FF5A36]'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isAppreciated ? 'fill-current' : ''}`} />
                          <span className="font-mono-tabular">{deck.appreciationCount}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleBookmark(deck);
                          }}
                          aria-label={`Bookmark ${deck.title}`}
                          className={`min-h-[40px] min-w-[40px] rounded-lg inline-flex items-center justify-center transition-colors ${
                            isBookmarked
                              ? 'text-[#2563EB] dark:text-blue-400'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>

                        {deck.allowFreePdf && (
                          <button
                            type="button"
                            onClick={(e) => void handleQuickPdf(e, deck)}
                            disabled={downloadingId === deck.id}
                            aria-label={`Download PDF for ${deck.title}`}
                            className="min-h-[40px] min-w-[40px] rounded-lg inline-flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Policy-compliant responsive AdSense placement */}
            <div className="pt-2">
              <AdBannerSlot slotType="feed" onOpenAdSenseGuide={onOpenAdSenseGuide} />
            </div>
          </>
        )}
      </section>
    </div>
  );
};
