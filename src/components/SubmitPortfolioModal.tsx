import React, { useState } from 'react';
import { Globe, Layers, Link2, Upload, X } from 'lucide-react';
import {
  DISCIPLINE_CATEGORIES,
  type CreatorProfile,
  type DisciplineCategory,
  type PortfolioDeck,
} from '../types/portfolio';
import { STUDIO_ASSET_PRESETS } from '../data/curatedPortfolios';

interface SubmitPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSignedIn: boolean;
  onRequireSignIn: () => void;
  creatorProfile: CreatorProfile | null;
  myDecks: PortfolioDeck[];
  onPublishExistingDeck: (deck: PortfolioDeck) => Promise<void>;
  onCreateExternalSubmission: (deck: PortfolioDeck) => Promise<void>;
}

export const SubmitPortfolioModal: React.FC<SubmitPortfolioModalProps> = ({
  isOpen,
  onClose,
  isSignedIn,
  onRequireSignIn,
  creatorProfile,
  myDecks,
  onPublishExistingDeck,
  onCreateExternalSubmission,
}) => {
  const [mode, setMode] = useState<'external' | 'existing'>('external');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<DisciplineCategory>(creatorProfile?.discipline || 'UI/UX Design');
  const [skillsText, setSkillsText] = useState(
    creatorProfile?.skills?.join(', ') || 'UI/UX Design, Prototyping, Visual Design'
  );
  const [behanceUrl, setBehanceUrl] = useState(creatorProfile?.behanceUrl || '');
  const [dribbbleUrl, setDribbbleUrl] = useState(creatorProfile?.dribbbleUrl || '');
  const [coverImage, setCoverImage] = useState(STUDIO_ASSET_PRESETS[0].url);
  const [accentColor, setAccentColor] = useState('#2563EB');
  const [allowFreePdf, setAllowFreePdf] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      onClose();
      onRequireSignIn();
      return;
    }
    setError(null);
    if (!title.trim()) {
      setError('Please enter a project title.');
      return;
    }

    setSubmitting(true);
    try {
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);

      const newDeck: PortfolioDeck = {
        id: `sub_${Date.now()}`,
        ownerId: creatorProfile?.uid || '',
        creatorName: creatorProfile?.displayName || 'Creator',
        creatorHandle: creatorProfile?.handle || 'creator',
        creatorLocation: creatorProfile?.location || 'Global',
        title: title.trim(),
        subtitle: subtitle.trim() || `${category} showcase presentation`,
        category,
        skills,
        accentColor,
        coverImage,
        behanceUrl: behanceUrl.trim(),
        dribbbleUrl: dribbbleUrl.trim(),
        isPublished: true,
        allowFreePdf,
        appreciationCount: 0,
        slides: [
          {
            id: `sub_s1_${Date.now()}`,
            layout: 'cover',
            eyebrow: `${category} Submission`,
            title: title.trim(),
            subtitle: subtitle.trim() || 'Published to KromaFolio Global Showcase',
            body: `Skills featured: ${skills.join(', ')}`,
            backgroundStyle: 'dark',
            imageUrl: coverImage,
            bullets: skills.slice(0, 3),
            metrics: [],
            paletteColors: [accentColor, '#0F172A', '#FF5A36', '#F8FAFC'],
          },
          {
            id: `sub_s2_${Date.now()}`,
            layout: 'editorial-split',
            eyebrow: '01. Project Overview',
            title: 'Creative Approach & Deliverables',
            subtitle: subtitle.trim() || 'Crafted for Behance, Dribbble, and global client discovery.',
            body: 'Open this project in KromaFolio Slide Studio anytime to expand additional process slides or export a high-resolution PDF deck.',
            backgroundStyle: 'light',
            imageUrl: coverImage,
            bullets: [
              `Discipline: ${category}`,
              behanceUrl ? `Behance link included` : 'Available in KromaFolio Showcase',
              allowFreePdf ? 'Free PDF presentation download enabled' : 'Showcase preview enabled',
            ],
            metrics: [],
            paletteColors: [accentColor, '#0F172A', '#FF5A36', '#F8FAFC'],
          },
          {
            id: `sub_s3_${Date.now()}`,
            layout: 'closing-credits',
            eyebrow: 'Creator Credits',
            title: `${creatorProfile?.displayName || 'Creator'} · ${creatorProfile?.location || 'Global'}`,
            subtitle: 'Connect on Behance, Dribbble, or download the free PDF summary.',
            body: 'Submitted to the KromaFolio global creative community.',
            backgroundStyle: 'dark',
            imageUrl: '',
            bullets: skills.slice(0, 4),
            metrics: [],
            paletteColors: [accentColor, '#0F172A', '#FF5A36', '#F8FAFC'],
          },
        ],
      };

      await onCreateExternalSubmission(newDeck);
      setTitle('');
      setSubtitle('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit portfolio.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Submit Portfolio to Global Showcase
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!isSignedIn && (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-700 dark:text-slate-200">
                Sign up with Google in one tap to publish portfolios and Behance/Dribbble links globally.
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequireSignIn();
                }}
                className="min-h-[40px] px-4 rounded-xl bg-[#2563EB] text-white text-xs font-semibold shrink-0"
              >
                Sign Up Free
              </button>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#F6F7FB] dark:bg-[#0A0D14] border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMode('external')}
              className={`min-h-[40px] rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                mode === 'external'
                  ? 'bg-white dark:bg-[#121722] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Behance / Dribbble / New</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`min-h-[40px] rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                mode === 'existing'
                  ? 'bg-white dark:bg-[#121722] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Publish My Deck ({myDecks.length})</span>
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {mode === 'existing' ? (
            <div className="space-y-3">
              {myDecks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  You have no saved slide decks yet. Create one in AI Generator or Slide Studio, or submit a Behance /
                  Dribbble project using the other tab.
                </div>
              ) : (
                myDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{deck.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {deck.category} · {deck.slides.length} slides · {deck.isPublished ? 'Published' : 'Draft'}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={submitting || deck.isPublished}
                      onClick={async () => {
                        setSubmitting(true);
                        try {
                          await onPublishExistingDeck(deck);
                          onClose();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Unable to publish deck.');
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      className={`min-h-[40px] px-4 rounded-xl text-xs font-semibold shrink-0 ${
                        deck.isPublished
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-[#2563EB] text-white hover:bg-blue-700'
                      }`}
                    >
                      {deck.isPublished ? 'Live in Showcase' : 'Publish Live'}
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitExternal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Project Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  required
                  placeholder="e.g., Nova Health Android App Redesign"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Case Study Summary
                </label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  maxLength={220}
                  placeholder="Describe the design challenge, outcome, or tools used..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DisciplineCategory)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white"
                  >
                    {DISCIPLINE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-2 py-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Featured Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Behance Project URL (optional)
                  </label>
                  <input
                    type="url"
                    value={behanceUrl}
                    onChange={(e) => setBehanceUrl(e.target.value)}
                    placeholder="https://behance.net/gallery/..."
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Dribbble Shot URL (optional)
                  </label>
                  <input
                    type="url"
                    value={dribbbleUrl}
                    onChange={(e) => setDribbbleUrl(e.target.value)}
                    placeholder="https://dribbble.com/shots/..."
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Cover Artwork Preset
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {STUDIO_ASSET_PRESETS.map((asset) => (
                    <button
                      key={asset.url}
                      type="button"
                      onClick={() => setCoverImage(asset.url)}
                      className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                        coverImage === asset.url ? 'border-[#2563EB] scale-[1.03]' : 'border-transparent opacity-80'
                      }`}
                    >
                      <img src={asset.url} alt={asset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowFreePdf}
                  onChange={(e) => setAllowFreePdf(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB]"
                />
                <span>Allow global visitors to download this presentation as a free PDF</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] rounded-xl bg-[#FF5A36] hover:bg-orange-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <Globe className="w-4 h-4" />
                <span>{submitting ? 'Publishing Submission...' : 'Publish to Global Showcase'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
