import React, { useState } from 'react';
import { Check, Copy, Globe, ShieldCheck, X } from 'lucide-react';
import type { LegalModalKind } from '../types/portfolio';

interface AdSenseAndLegalModalProps {
  kind: LegalModalKind;
  onClose: () => void;
}

export const AdSenseAndLegalModal: React.FC<AdSenseAndLegalModalProps> = ({ kind, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!kind) return null;

  const copySnippet = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const adsTxtSnippet = 'google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0';
  const metaSnippet = '<meta name="google-adsense-account" content="ca-pub-0000000000000000" />';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full sm:max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Android bottom sheet drag affordance */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {kind === 'adsense' && 'Google AdSense Readiness & Publisher Setup'}
            {kind === 'about' && 'About KromaFolio'}
            {kind === 'privacy' && 'Privacy Policy'}
            {kind === 'terms' && 'Terms of Service'}
            {kind === 'contact' && 'Contact & Support'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {kind === 'adsense' && (
            <>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Built for Google AdSense Policy Compliance
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    KromaFolio includes dedicated About, Privacy Policy, Terms, Contact pages, public{' '}
                    <code className="font-mono-tabular">/ads.txt</code> support, and non-intrusive responsive ad containers.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">1. Configure Your Publisher ID</h3>
                <p>
                  Set <code className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">VITE_ADSENSE_CLIENT_ID</code>,{' '}
                  <code className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">VITE_ADSENSE_SLOT_FEED</code>, and{' '}
                  <code className="font-mono-tabular px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">VITE_ADSENSE_SLOT_READER</code>{' '}
                  in your environment variables to activate live Google AdSense banners automatically.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">2. Update public/ads.txt</h3>
                  <button
                    type="button"
                    onClick={() => void copySnippet('ads', adsTxtSnippet)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    {copiedKey === 'ads' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'ads' ? 'Copied' : 'Copy line'}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono-tabular overflow-x-auto">
                  {adsTxtSnippet}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">3. Verify Site Ownership in index.html</h3>
                  <button
                    type="button"
                    onClick={() => void copySnippet('meta', metaSnippet)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    {copiedKey === 'meta' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'meta' ? 'Copied' : 'Copy meta tag'}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono-tabular overflow-x-auto">
                  {metaSnippet}
                </pre>
              </div>
            </>
          )}

          {kind === 'about' && (
            <>
              <div className="flex items-center gap-2 text-[#2563EB] font-semibold">
                <Globe className="w-4 h-4" />
                <span>Empowering Digital Creators Worldwide</span>
              </div>
              <p>
                KromaFolio is an open mobile-first portfolio studio designed for UI/UX designers, illustrators,
                3D artists, brand strategists, photographers, and software engineers around the globe.
              </p>
              <p>
                Every creator can sign up in seconds, design Behance-grade multi-slide case studies with AI assistance,
                export unlimited high-resolution PDFs completely free, and publish work to the global community showcase.
              </p>
            </>
          )}

          {kind === 'privacy' && (
            <>
              <p>
                <strong>Effective Date:</strong> November 2026
              </p>
              <p>
                KromaFolio collects only the information needed to authenticate your creator account via Google Sign-In
                and store your chosen portfolio decks and public showcase details. Your email address is isolated in a
                private account record and never exposed on public portfolio pages.
              </p>
              <p>
                When Google AdSense is enabled on this domain, third-party vendors including Google may use cookies to
                serve ads based on prior visits. Users may opt out of personalized advertising by visiting Google Ads Settings.
              </p>
            </>
          )}

          {kind === 'terms' && (
            <>
              <p>
                Creators retain 100% ownership and copyright of all presentation slides, text, images, and PDFs created
                or submitted on KromaFolio.
              </p>
              <p>
                By publishing a portfolio to the public Showcase, you confirm you hold the rights to display the work
                and link external Behance or Dribbble case studies. Downloading and exporting your presentation slides as
                PDF is completely free for personal and commercial job applications.
              </p>
            </>
          )}

          {kind === 'contact' && (
            <>
              <p>
                Need support with creator verification, portfolio submissions, or publisher advertising?
              </p>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 bg-slate-50 dark:bg-slate-900/60">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">Creator Support:</span>{' '}
                  support@kromafolio.studio
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">Global Community:</span>{' '}
                  Available across Android mobile web and desktop browsers worldwide.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
