import React, { useEffect } from 'react';

interface AdBannerSlotProps {
  slotType: 'feed' | 'reader';
  onOpenAdSenseGuide: () => void;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const AdBannerSlot: React.FC<AdBannerSlotProps> = ({ slotType, onOpenAdSenseGuide }) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined;
  const slotId =
    slotType === 'feed'
      ? (import.meta.env.VITE_ADSENSE_SLOT_FEED as string | undefined)
      : (import.meta.env.VITE_ADSENSE_SLOT_READER as string | undefined);

  const isConfigured = Boolean(clientId && clientId.startsWith('ca-pub-') && slotId);

  useEffect(() => {
    if (!isConfigured || !clientId) return;

    const scriptId = 'kromafolio-adsense-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      document.head.appendChild(script);
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script still initializing
    }
  }, [isConfigured, clientId]);

  if (isConfigured && clientId && slotId) {
    return (
      <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121722] p-3 text-center overflow-hidden">
        <span className="block text-[11px] text-slate-400 dark:text-slate-500 mb-1">Advertisement</span>
        <ins
          className="adsbygoogle block"
          style={{ display: 'block' }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-[#121722]/70 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="space-y-0.5">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Sponsored Placement · Google AdSense Ready
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Responsive {slotType === 'feed' ? 'Showcase Feed' : 'Case Study Reader'} ad unit configured for AdSense approval.
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenAdSenseGuide}
        className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
      >
        AdSense Setup Guide
      </button>
    </div>
  );
};
