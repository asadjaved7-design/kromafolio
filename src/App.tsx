import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { Compass, Layers, Sparkles, User as UserIcon } from 'lucide-react';
import { auth, googleProvider } from './lib/firebase';
import {
  fetchCreatorPortfolios,
  fetchCreatorProfile,
  fetchPublishedPortfolios,
  fetchUserBookmarks,
  removePortfolioDeck,
  saveCreatorProfile,
  savePortfolioDeck,
  toggleBookmark,
  togglePortfolioAppreciation,
} from './lib/portfolioService';
import { CURATED_PORTFOLIOS } from './data/curatedPortfolios';
import type { AppTab, CreatorProfile, LegalModalKind, PortfolioDeck } from './types/portfolio';
import { ShowcaseFeed } from './components/ShowcaseFeed';
import { SlideStudio } from './components/SlideStudio';
import { AiDeckGenerator } from './components/AiDeckGenerator';
import { CreatorProfileView } from './components/CreatorProfileView';
import { CaseStudyModal } from './components/CaseStudyModal';
import { SubmitPortfolioModal } from './components/SubmitPortfolioModal';
import { AuthSheet } from './components/AuthSheet';
import { AdSenseAndLegalModal } from './components/AdSenseAndLegalModal';
import { ErrorBoundary } from './components/ErrorBoundary';

function createBlankDeck(creator: CreatorProfile | null): PortfolioDeck {
  return {
    id: `deck_${Date.now()}`,
    ownerId: creator?.uid || '',
    creatorName: creator?.displayName || 'Global Creator',
    creatorHandle: creator?.handle || 'creator',
    creatorLocation: creator?.location || 'Global',
    title: 'Untitled Portfolio Presentation',
    subtitle: 'Crafted in KromaFolio Slide Studio',
    category: creator?.discipline || 'UI/UX Design',
    skills: creator?.skills?.length ? creator.skills : ['UI/UX Design', 'Prototyping'],
    accentColor: creator?.avatarColor || '#2563EB',
    coverImage: '/src/assets/images/showcase_fintech_mobile_1795601966370.jpg',
    behanceUrl: creator?.behanceUrl || '',
    dribbbleUrl: creator?.dribbbleUrl || '',
    isPublished: false,
    allowFreePdf: true,
    appreciationCount: 0,
    slides: [
      {
        id: `slide_${Date.now()}_1`,
        layout: 'cover',
        eyebrow: 'Portfolio Case Study',
        title: 'Untitled Portfolio Presentation',
        subtitle: 'Introduce your project vision, client challenge, and key deliverables.',
        body: 'Edit this slide on the right or click AI Polish Slide to refine your narrative.',
        backgroundStyle: 'dark',
        imageUrl: '/src/assets/images/showcase_fintech_mobile_1795601966370.jpg',
        bullets: ['Role: Lead Designer', 'Platform: Android & Web', 'Deliverable: Design System'],
        metrics: [],
        paletteColors: ['#2563EB', '#0F172A', '#FF5A36', '#F8FAFC'],
      },
      {
        id: `slide_${Date.now()}_2`,
        layout: 'metrics-impact',
        eyebrow: '01. Outcomes & Metrics',
        title: 'Measured Project Results',
        subtitle: 'Highlight concrete improvements in conversion, engagement, or craft.',
        body: 'Replace these sample metrics with your real project numbers.',
        backgroundStyle: 'light',
        imageUrl: '',
        bullets: [],
        metrics: [
          { label: 'User Retention', value: '+38%' },
          { label: 'Task Completion', value: '96%' },
          { label: 'App Rating', value: '4.9' },
          { label: 'Speed Gain', value: '2.1x' },
        ],
        paletteColors: ['#2563EB', '#0F172A', '#FF5A36', '#F8FAFC'],
      },
    ],
  };
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('kromafolio_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  const [activeTab, setActiveTab] = useState<AppTab>('discover');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);

  const [publishedDecks, setPublishedDecks] = useState<PortfolioDeck[]>([]);
  const [myDecks, setMyDecks] = useState<PortfolioDeck[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const [appreciatedIds, setAppreciatedIds] = useState<Set<string>>(new Set());
  const [demoLikesDelta, setDemoLikesDelta] = useState<Record<string, number>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const [studioDeck, setStudioDeck] = useState<PortfolioDeck>(() => createBlankDeck(null));
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<PortfolioDeck | null>(null);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalKind>(null);

  // Sync Tailwind .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('kromafolio_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load global published portfolios
  const loadPublicShowcase = useCallback(async () => {
    setLoadingFeed(true);
    try {
      const remote = await fetchPublishedPortfolios();
      setPublishedDecks(remote);
    } catch {
      setPublishedDecks([]);
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    void loadPublicShowcase();
  }, [loadPublicShowcase]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (nextUser) {
        try {
          const [prof, owned, bookmarks] = await Promise.all([
            fetchCreatorProfile(nextUser.uid),
            fetchCreatorPortfolios(nextUser.uid),
            fetchUserBookmarks(nextUser.uid),
          ]);
          setCreatorProfile(prof);
          setMyDecks(owned);
          setBookmarkedIds(bookmarks);
          if (!prof) {
            setAuthSheetOpen(true);
          }
        } catch {
          // Handled cleanly via ErrorBoundary or inline messages
        }
      } else {
        setCreatorProfile(null);
        setMyDecks([]);
        setBookmarkedIds(new Set());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in with Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async (input: Omit<CreatorProfile, 'uid' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const saved = await saveCreatorProfile(user, input, theme);
    setCreatorProfile(saved);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveTab('discover');
  };

  // Merge Firestore published portfolios with curated showcase examples
  const allShowcasePortfolios = useMemo(() => {
    const map = new Map<string, PortfolioDeck>();
    publishedDecks.forEach((d) => map.set(d.id, d));
    CURATED_PORTFOLIOS.forEach((d) => {
      if (!map.has(d.id)) {
        const delta = demoLikesDelta[d.id] || 0;
        map.set(d.id, { ...d, appreciationCount: Math.max(0, d.appreciationCount + delta) });
      }
    });
    return Array.from(map.values());
  }, [publishedDecks, demoLikesDelta]);

  const bookmarkedDecks = useMemo(() => {
    return allShowcasePortfolios.filter((p) => bookmarkedIds.has(p.id));
  }, [allShowcasePortfolios, bookmarkedIds]);

  const handleSaveDeck = async (deck: PortfolioDeck) => {
    if (!user) {
      setAuthSheetOpen(true);
      return;
    }
    const saved = await savePortfolioDeck(user, creatorProfile, deck);
    setMyDecks((prev) => {
      const exists = prev.some((d) => d.id === saved.id);
      return exists ? prev.map((d) => (d.id === saved.id ? saved : d)) : [saved, ...prev];
    });
    if (saved.isPublished) {
      setPublishedDecks((prev) => {
        const exists = prev.some((d) => d.id === saved.id);
        return exists ? prev.map((d) => (d.id === saved.id ? saved : d)) : [saved, ...prev];
      });
    } else {
      setPublishedDecks((prev) => prev.filter((d) => d.id !== saved.id));
    }
  };

  const handleDeleteDeck = async (id: string) => {
    await removePortfolioDeck(id);
    setMyDecks((prev) => prev.filter((d) => d.id !== id));
    setPublishedDecks((prev) => prev.filter((d) => d.id !== id));
  };

  const handleToggleAppreciate = async (deck: PortfolioDeck) => {
    const already = appreciatedIds.has(deck.id);

    if (deck.isCuratedDemo) {
      setAppreciatedIds((prev) => {
        const next = new Set(prev);
        if (already) next.delete(deck.id);
        else next.add(deck.id);
        return next;
      });
      setDemoLikesDelta((prev) => ({
        ...prev,
        [deck.id]: (prev[deck.id] || 0) + (already ? -1 : 1),
      }));
      if (selectedCaseStudy?.id === deck.id) {
        setSelectedCaseStudy((prev) =>
          prev
            ? {
                ...prev,
                appreciationCount: Math.max(0, prev.appreciationCount + (already ? -1 : 1)),
              }
            : null
        );
      }
      return;
    }

    if (!user) {
      setAuthSheetOpen(true);
      return;
    }

    const nextCount = await togglePortfolioAppreciation(user, deck, already);
    setAppreciatedIds((prev) => {
      const next = new Set(prev);
      if (already) next.delete(deck.id);
      else next.add(deck.id);
      return next;
    });
    setPublishedDecks((prev) =>
      prev.map((d) => (d.id === deck.id ? { ...d, appreciationCount: nextCount } : d))
    );
    if (selectedCaseStudy?.id === deck.id) {
      setSelectedCaseStudy((prev) => (prev ? { ...prev, appreciationCount: nextCount } : null));
    }
  };

  const handleToggleBookmark = async (deck: PortfolioDeck) => {
    const already = bookmarkedIds.has(deck.id);
    if (deck.isCuratedDemo || !user) {
      if (!user && !deck.isCuratedDemo) {
        setAuthSheetOpen(true);
        return;
      }
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (already) next.delete(deck.id);
        else next.add(deck.id);
        return next;
      });
      if (user && !deck.isCuratedDemo) {
        await toggleBookmark(user.uid, deck.id, already);
      }
      return;
    }

    await toggleBookmark(user.uid, deck.id, already);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (already) next.delete(deck.id);
      else next.add(deck.id);
      return next;
    });
  };

  const handleOpenInStudio = (deck: PortfolioDeck) => {
    setStudioDeck({
      ...deck,
      id: deck.isCuratedDemo ? `deck_${Date.now()}` : deck.id,
      isCuratedDemo: false,
      ownerId: user?.uid || deck.ownerId,
      creatorName: creatorProfile?.displayName || deck.creatorName,
      creatorHandle: creatorProfile?.handle || deck.creatorHandle,
    });
    setSelectedCaseStudy(null);
    setActiveTab('studio');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#F6F7FB] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 transition-colors">
        {/* Strict 3-Zone Top Bar Contract */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/90 dark:bg-[#121722]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
            {/* Zone 1: Single-line Brand Wordmark */}
            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
            >
              KromaFolio
            </button>

            {/* Zone 2: 4 Single-line Text Nav Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab('discover')}
                className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'discover' ? 'text-[#2563EB] dark:text-blue-400 font-semibold' : ''
                }`}
              >
                Showcase
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'studio' ? 'text-[#2563EB] dark:text-blue-400 font-semibold' : ''
                }`}
              >
                Slide Studio
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'ai' ? 'text-[#2563EB] dark:text-blue-400 font-semibold' : ''
                }`}
              >
                AI Generator
              </button>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(true)}
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Submit Work
              </button>
            </nav>

            {/* Zone 3: Single Primary Action */}
            <div className="shrink-0">
              {user ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                >
                  {creatorProfile?.displayName || 'Creator Studio'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!authReady}
                  onClick={() => setAuthSheetOpen(true)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  Join Free
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Responsive Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-12">
          {activeTab === 'discover' && (
            <ShowcaseFeed
              portfolios={allShowcasePortfolios}
              theme={theme}
              onToggleTheme={toggleTheme}
              onNavigate={setActiveTab}
              onOpenSubmitModal={() => setSubmitModalOpen(true)}
              onSelectDeck={setSelectedCaseStudy}
              appreciatedIds={appreciatedIds}
              bookmarkedIds={bookmarkedIds}
              onToggleAppreciate={(d) => void handleToggleAppreciate(d)}
              onToggleBookmark={(d) => void handleToggleBookmark(d)}
              onOpenAdSenseGuide={() => setLegalModal('adsense')}
              loading={loadingFeed}
            />
          )}

          {activeTab === 'studio' && (
            <SlideStudio
              deck={studioDeck}
              onChangeDeck={setStudioDeck}
              creatorProfile={creatorProfile}
              isSignedIn={Boolean(user)}
              onRequireSignIn={() => setAuthSheetOpen(true)}
              onSaveDeck={handleSaveDeck}
            />
          )}

          {activeTab === 'ai' && (
            <AiDeckGenerator
              creatorProfile={creatorProfile}
              isSignedIn={Boolean(user)}
              onRequireSignIn={() => setAuthSheetOpen(true)}
              onOpenInStudio={handleOpenInStudio}
              onSaveAndPublish={async (deck) => {
                await handleSaveDeck(deck);
              }}
            />
          )}

          {activeTab === 'profile' && (
            <CreatorProfileView
              user={user}
              profile={creatorProfile}
              myDecks={myDecks}
              bookmarkedDecks={bookmarkedDecks}
              theme={theme}
              onToggleTheme={toggleTheme}
              onOpenAuth={() => setAuthSheetOpen(true)}
              onSignOut={handleSignOut}
              onEditDeck={handleOpenInStudio}
              onViewDeck={setSelectedCaseStudy}
              onDeleteDeck={handleDeleteDeck}
              onCreateNewDeck={() => {
                setStudioDeck(createBlankDeck(creatorProfile));
                setActiveTab('studio');
              }}
            />
          )}
        </main>

        {/* Policy-Compliant Footer (Required for Google AdSense Readiness) */}
        <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121722]">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div>
              KromaFolio · Free AI Portfolio & Behance Slide Studio for Global Creators
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <button type="button" onClick={() => setLegalModal('about')} className="hover:text-slate-900 dark:hover:text-white">
                About
              </button>
              <button type="button" onClick={() => setLegalModal('privacy')} className="hover:text-slate-900 dark:hover:text-white">
                Privacy Policy
              </button>
              <button type="button" onClick={() => setLegalModal('terms')} className="hover:text-slate-900 dark:hover:text-white">
                Terms
              </button>
              <button type="button" onClick={() => setLegalModal('contact')} className="hover:text-slate-900 dark:hover:text-white">
                Contact
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('adsense')}
                className="font-semibold text-[#2563EB] dark:text-blue-400 hover:underline"
              >
                AdSense Setup
              </button>
            </div>
          </div>
        </footer>

        {/* Mobile Legal Quick Row above bottom nav */}
        <div className="md:hidden px-4 pb-20 pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <button type="button" onClick={() => setLegalModal('about')}>About</button>
          <button type="button" onClick={() => setLegalModal('privacy')}>Privacy</button>
          <button type="button" onClick={() => setLegalModal('terms')}>Terms</button>
          <button type="button" onClick={() => setLegalModal('contact')}>Contact</button>
          <button type="button" onClick={() => setLegalModal('adsense')} className="text-[#2563EB] font-semibold">
            AdSense
          </button>
        </div>

        {/* Android Mobile Thumb-Zone Bottom Navigation Bar (< md) */}
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[58px] pb-safe bg-white/95 dark:bg-[#121722]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 items-center"
        >
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'discover' ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Showcase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'studio' ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'ai' ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-semibold">AI Deck</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'profile' ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Profile</span>
          </button>
        </nav>

        {/* Modals & Android Bottom Sheets */}
        <CaseStudyModal
          deck={selectedCaseStudy}
          onClose={() => setSelectedCaseStudy(null)}
          isAppreciated={selectedCaseStudy ? appreciatedIds.has(selectedCaseStudy.id) : false}
          isBookmarked={selectedCaseStudy ? bookmarkedIds.has(selectedCaseStudy.id) : false}
          onToggleAppreciate={(d) => void handleToggleAppreciate(d)}
          onToggleBookmark={(d) => void handleToggleBookmark(d)}
          onRemixInStudio={handleOpenInStudio}
          onOpenAdSenseGuide={() => setLegalModal('adsense')}
        />

        <SubmitPortfolioModal
          isOpen={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
          isSignedIn={Boolean(user)}
          onRequireSignIn={() => setAuthSheetOpen(true)}
          creatorProfile={creatorProfile}
          myDecks={myDecks}
          onPublishExistingDeck={async (deck) => {
            await handleSaveDeck({ ...deck, isPublished: true });
          }}
          onCreateExternalSubmission={async (deck) => {
            await handleSaveDeck(deck);
          }}
        />

        <AuthSheet
          isOpen={authSheetOpen}
          onClose={() => setAuthSheetOpen(false)}
          user={user}
          profile={creatorProfile}
          onGoogleSignIn={handleGoogleSignIn}
          onSaveProfile={handleSaveProfile}
          authError={authError}
          isLoading={authLoading}
        />

        <AdSenseAndLegalModal kind={legalModal} onClose={() => setLegalModal(null)} />
      </div>
    </ErrorBoundary>
  );
}
