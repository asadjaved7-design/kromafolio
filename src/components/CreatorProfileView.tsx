import React from 'react';
import {
  Download,
  Edit3,
  ExternalLink,
  Globe,
  LogOut,
  MapPin,
  Moon,
  Plus,
  Sun,
  Trash2,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { CreatorProfile, PortfolioDeck } from '../types/portfolio';
import { exportPortfolioToPdf } from '../lib/pdfExport';

interface CreatorProfileViewProps {
  user: User | null;
  profile: CreatorProfile | null;
  myDecks: PortfolioDeck[];
  bookmarkedDecks: PortfolioDeck[];
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onSignOut: () => Promise<void>;
  onEditDeck: (deck: PortfolioDeck) => void;
  onViewDeck: (deck: PortfolioDeck) => void;
  onDeleteDeck: (id: string) => Promise<void>;
  onCreateNewDeck: () => void;
}

export const CreatorProfileView: React.FC<CreatorProfileViewProps> = ({
  user,
  profile,
  myDecks,
  bookmarkedDecks,
  theme,
  onToggleTheme,
  onOpenAuth,
  onSignOut,
  onEditDeck,
  onViewDeck,
  onDeleteDeck,
  onCreateNewDeck,
}) => {
  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="rounded-3xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#2563EB] text-white font-extrabold text-xl mx-auto flex items-center justify-center">
            KF
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Create Your Global Creator Profile
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Sign up with Google from any country to save your AI presentation decks in the cloud, submit projects to
              the global showcase, and export free PDFs anytime.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full sm:w-auto min-h-[48px] px-6 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold"
            >
              Sign Up Free with Google
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-full sm:w-auto min-h-[48px] px-5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center justify-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#2563EB]" />}
              <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Creator Header Card */}
      <section className="rounded-3xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shrink-0"
            style={{ backgroundColor: profile?.avatarColor || '#2563EB' }}
          >
            {(profile?.displayName || user.displayName || 'CR').slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {profile?.displayName || user.displayName || 'Creator'}
              </h1>
              <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                @{profile?.handle || 'creator'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#2563EB] dark:text-blue-400">
                {profile?.discipline || 'UI/UX Design'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {profile?.location || 'Global'}
              </span>
              {profile?.skills && profile.skills.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{profile.skills.join(' / ')}</span>
                </>
              )}
            </div>
            {profile?.bio && (
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl pt-1">{profile.bio}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-2"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#2563EB]" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAuth}
            className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => void onSignOut()}
            className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-red-600 dark:text-red-400 inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {/* My Portfolio Decks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              My Portfolio Decks ({myDecks.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Edit slides, download free widescreen PDFs, or publish to the Global Showcase.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateNewDeck}
            className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Deck</span>
          </button>
        </div>

        {myDecks.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#121722] border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You have not saved any portfolio presentations yet. Start with Gemini AI or open Slide Studio.
            </p>
            <button
              type="button"
              onClick={onCreateNewDeck}
              className="min-h-[44px] px-5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold"
            >
              Create First Presentation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myDecks.map((deck) => (
              <div
                key={deck.id}
                className="rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-[#2563EB] dark:text-blue-400">{deck.category}</span>
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      {deck.isPublished ? 'Published' : 'Private Draft'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">{deck.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                    {deck.slides.length} slides · {deck.appreciationCount} appreciations
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onEditDeck(deck)}
                    className="flex-1 min-h-[40px] rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
                  >
                    Edit Slides
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewDeck(deck)}
                    aria-label="Preview deck"
                    className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void exportPortfolioToPdf(deck)}
                    aria-label="Download free PDF"
                    className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteDeck(deck.id)}
                    aria-label="Delete deck"
                    className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bookmarked Showcase Items */}
      {bookmarkedDecks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Saved Inspirations ({bookmarkedDecks.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bookmarkedDecks.map((deck) => (
              <div
                key={deck.id}
                onClick={() => onViewDeck(deck)}
                className="cursor-pointer rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 p-5 space-y-2 hover:border-[#2563EB] transition-colors"
              >
                <div className="text-xs text-[#2563EB] dark:text-blue-400 font-semibold">
                  {deck.category} · {deck.creatorName}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">{deck.title}</h3>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
