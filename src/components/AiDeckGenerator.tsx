import React, { useState } from 'react';
import { Download, Globe, Layers, Plus, Sparkles } from 'lucide-react';
import {
  DISCIPLINE_CATEGORIES,
  type CreatorProfile,
  type DisciplineCategory,
  type PortfolioDeck,
  type PortfolioSlide,
} from '../types/portfolio';
import { STUDIO_ASSET_PRESETS } from '../data/curatedPortfolios';
import { SlideCanvas } from './SlideCanvas';
import { exportPortfolioToPdf } from '../lib/pdfExport';

interface AiDeckGeneratorProps {
  creatorProfile: CreatorProfile | null;
  isSignedIn: boolean;
  onRequireSignIn: () => void;
  onOpenInStudio: (deck: PortfolioDeck) => void;
  onSaveAndPublish: (deck: PortfolioDeck, publish: boolean) => Promise<void>;
}

const SUGGESTED_SKILL_CHIPS = [
  'Figma',
  'Android Material 3',
  'UX Research',
  'Brand Identity',
  'Typography',
  'Motion Design',
  'Cinema 4D',
  'React & TypeScript',
  'Illustration',
  'Packaging',
];

const TONE_PRESETS = [
  { label: 'Electric Cobalt', accent: '#2563EB' },
  { label: 'Vibrant Coral', accent: '#FF5A36' },
  { label: 'Emerald Studio', accent: '#059669' },
  { label: 'Editorial Indigo', accent: '#4F46E5' },
  { label: 'Amber Monograph', accent: '#D97706' },
];

export const AiDeckGenerator: React.FC<AiDeckGeneratorProps> = ({
  creatorProfile,
  isSignedIn,
  onRequireSignIn,
  onOpenInStudio,
  onSaveAndPublish,
}) => {
  const [creatorName, setCreatorName] = useState(creatorProfile?.displayName || '');
  const [discipline, setDiscipline] = useState<DisciplineCategory>(creatorProfile?.discipline || 'UI/UX Design');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectBrief, setProjectBrief] = useState('');
  const [targetAudience, setTargetAudience] = useState('Design directors, tech recruiters, and startup founders');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    creatorProfile?.skills?.length ? creatorProfile.skills.slice(0, 6) : ['Figma', 'Android Material 3', 'UX Research']
  );
  const [customSkill, setCustomSkill] = useState('');
  const [slideCount, setSlideCount] = useState(6);
  const [accentColor, setAccentColor] = useState('#2563EB');
  const [coverImage, setCoverImage] = useState(STUDIO_ASSET_PRESETS[0].url);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDeck, setGeneratedDeck] = useState<PortfolioDeck | null>(null);
  const [savingCloud, setSavingCloud] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : prev.length < 10 ? [...prev, skill] : prev
    );
  };

  const addCustomSkill = () => {
    const clean = customSkill.trim().slice(0, 32);
    if (!clean || selectedSkills.includes(clean) || selectedSkills.length >= 10) return;
    setSelectedSkills((prev) => [...prev, clean]);
    setCustomSkill('');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    if (!projectTitle.trim() || !projectBrief.trim()) {
      setError('Enter both a project title and a short brief describing what you built.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorName: creatorName.trim() || creatorProfile?.displayName || 'Global Creator',
          discipline,
          projectTitle: projectTitle.trim(),
          projectBrief: projectBrief.trim(),
          targetAudience: targetAudience.trim(),
          visualTone: TONE_PRESETS.find((t) => t.accent === accentColor)?.label || 'Electric Cobalt',
          skills: selectedSkills,
          slideCount,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        title?: string;
        subtitle?: string;
        accentColor?: string;
        suggestedSkills?: string[];
        slides?: PortfolioSlide[];
      };

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Unable to generate presentation slides.');
      }

      const slides = (data.slides || []).map((s, idx) => ({
        ...s,
        imageUrl: idx === 0 || s.layout === 'editorial-split' || s.layout === 'full-showcase' ? coverImage : '',
      }));

      const deck: PortfolioDeck = {
        id: `ai_deck_${Date.now()}`,
        ownerId: creatorProfile?.uid || '',
        creatorName: creatorName.trim() || creatorProfile?.displayName || 'Global Creator',
        creatorHandle: creatorProfile?.handle || 'creator',
        creatorLocation: creatorProfile?.location || 'Global',
        title: data.title || projectTitle.trim(),
        subtitle: data.subtitle || `${discipline} case study`,
        category: discipline,
        skills: selectedSkills.length > 0 ? selectedSkills : data.suggestedSkills || [discipline],
        accentColor,
        coverImage,
        behanceUrl: creatorProfile?.behanceUrl || '',
        dribbbleUrl: creatorProfile?.dribbbleUrl || '',
        isPublished: false,
        allowFreePdf: true,
        appreciationCount: 0,
        slides,
      };

      setGeneratedDeck(deck);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCloud = async (publish: boolean) => {
    if (!generatedDeck) return;
    if (!isSignedIn) {
      onRequireSignIn();
      return;
    }
    setSavingCloud(true);
    setStatusMessage(null);
    try {
      await onSaveAndPublish({ ...generatedDeck, isPublished: publish }, publish);
      setGeneratedDeck((prev) => (prev ? { ...prev, isPublished: publish } : null));
      setStatusMessage(publish ? 'Published live to the Global Showcase!' : 'Saved privately to your Creator Studio.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save deck.');
    } finally {
      setSavingCloud(false);
    }
  };

  const handleFreePdf = async () => {
    if (!generatedDeck) return;
    setDownloadingPdf(true);
    try {
      await exportPortfolioToPdf(generatedDeck);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#2563EB] dark:text-blue-400">
          AI Presentation Architect
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Generate a Behance-Style Portfolio Deck from Your Skills
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
          Describe your project, pick your skills, and generate a multi-slide presentation ready to customize, publish,
          or download free as a PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Controls */}
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5"
        >
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Creator Name
              </label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="Your name or studio"
                maxLength={80}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Discipline
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as DisciplineCategory)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white"
              >
                {DISCIPLINE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g., PulseFit Android Health Tracker Case Study"
              maxLength={120}
              required
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Project Brief & Results
            </label>
            <textarea
              rows={4}
              value={projectBrief}
              onChange={(e) => setProjectBrief(e.target.value)}
              maxLength={1200}
              required
              placeholder="Describe the problem you solved, your design process, tools used, and measurable outcomes..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] p-3.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Creator Skills ({selectedSkills.length}/10)
            </span>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {SUGGESTED_SKILL_CHIPS.map((skill) => {
                const active = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#F6F7FB] dark:bg-[#0A0D14] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
                placeholder="Add custom skill..."
                className="flex-1 min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="min-h-[42px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Slide Count: <span className="font-mono-tabular">{slideCount}</span>
              </label>
              <input
                type="range"
                min={4}
                max={10}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-full accent-[#2563EB]"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Accent Palette
              </span>
              <div className="flex items-center gap-2">
                {TONE_PRESETS.map((tone) => (
                  <button
                    key={tone.accent}
                    type="button"
                    onClick={() => setAccentColor(tone.accent)}
                    aria-label={tone.label}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      accentColor === tone.accent ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: tone.accent }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Presentation Visual Backdrop
            </span>
            <div className="grid grid-cols-5 gap-2">
              {STUDIO_ASSET_PRESETS.map((asset) => (
                <button
                  key={asset.url}
                  type="button"
                  onClick={() => setCoverImage(asset.url)}
                  className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                    coverImage === asset.url ? 'border-[#2563EB] scale-[1.03]' : 'border-transparent opacity-75'
                  }`}
                >
                  <img src={asset.url} alt={asset.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              maxLength={160}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full min-h-[48px] rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generating ? 'Designing Presentation Slides...' : 'Generate Portfolio Deck'}</span>
          </button>
        </form>

        {/* Right Live Preview Area */}
        <div className="lg:col-span-7 space-y-5">
          {!generatedDeck ? (
            <div className="rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Your AI Presentation Deck Appears Here
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Fill in your project title, skills, and brief on the left. Gemini AI structures a complete Behance-style
                case study with cover, process, metrics, and credits slides ready for free PDF download.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Action Toolbar */}
              <div className="rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {generatedDeck.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {generatedDeck.slides.length} AI slides · Ready to customize or download
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenInStudio(generatedDeck)}
                    className="min-h-[42px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Edit in Studio</span>
                  </button>

                  <button
                    type="button"
                    disabled={savingCloud}
                    onClick={() => void handleSaveCloud(true)}
                    className="min-h-[42px] px-3.5 rounded-xl bg-[#FF5A36] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{savingCloud ? 'Saving...' : 'Publish to Showcase'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={downloadingPdf}
                    onClick={() => void handleFreePdf()}
                    className="min-h-[42px] px-4 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingPdf ? 'Exporting...' : 'Free PDF'}</span>
                  </button>
                </div>
              </div>

              {statusMessage && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {statusMessage}
                </div>
              )}

              <div className="space-y-5">
                {generatedDeck.slides.map((slide, idx) => (
                  <SlideCanvas
                    key={slide.id}
                    slide={slide}
                    slideNumber={idx + 1}
                    totalSlides={generatedDeck.slides.length}
                    accentColor={generatedDeck.accentColor}
                    creatorName={generatedDeck.creatorName}
                    creatorHandle={generatedDeck.creatorHandle}
                    category={generatedDeck.category}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
