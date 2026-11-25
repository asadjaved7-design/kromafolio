import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  DISCIPLINE_CATEGORIES,
  type CreatorProfile,
  type DisciplineCategory,
} from '../types/portfolio';

interface AuthSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  profile: CreatorProfile | null;
  onGoogleSignIn: () => Promise<void>;
  onSaveProfile: (input: Omit<CreatorProfile, 'uid' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  authError: string | null;
  isLoading: boolean;
}

const AVATAR_COLORS = ['#2563EB', '#FF5A36', '#059669', '#7C3AED', '#D97706', '#0F172A'];

export const AuthSheet: React.FC<AuthSheetProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onGoogleSignIn,
  onSaveProfile,
  authError,
  isLoading,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [discipline, setDiscipline] = useState<DisciplineCategory>('UI/UX Design');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [avatarColor, setAvatarColor] = useState('#2563EB');
  const [behanceUrl, setBehanceUrl] = useState('');
  const [dribbbleUrl, setDribbbleUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setHandle(profile.handle);
      setDiscipline(profile.discipline);
      setLocation(profile.location);
      setBio(profile.bio);
      setSkillsText(profile.skills.join(', '));
      setAvatarColor(profile.avatarColor || '#2563EB');
      setBehanceUrl(profile.behanceUrl);
      setDribbbleUrl(profile.dribbbleUrl);
      setWebsiteUrl(profile.websiteUrl);
    } else if (user) {
      setDisplayName(user.displayName || 'Creative Designer');
      const suggested = (user.email?.split('@')[0] || 'creator')
        .toLowerCase()
        .replace(/[^a-z0-9_.\-]/g, '');
      setHandle(suggested.length >= 2 ? suggested : 'creator');
      setLocation('Global');
      setSkillsText('UI Design, Prototyping, Brand Systems');
    }
  }, [profile, user, isOpen]);

  if (!isOpen) return null;

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!displayName.trim()) {
      setFormError('Display name is required.');
      return;
    }
    const cleanHandle = handle
      .toLowerCase()
      .replace(/[^a-z0-9_.\-]/g, '')
      .slice(0, 40);
    if (cleanHandle.length < 2) {
      setFormError('Handle must be at least 2 characters (letters, numbers, dot, underscore, hyphen).');
      return;
    }

    setSaving(true);
    try {
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);

      await onSaveProfile({
        displayName: displayName.trim(),
        handle: cleanHandle,
        discipline,
        location: location.trim() || 'Global',
        bio: bio.trim(),
        skills,
        avatarColor,
        behanceUrl: behanceUrl.trim(),
        dribbbleUrl: dribbbleUrl.trim(),
        websiteUrl: websiteUrl.trim(),
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {!user ? 'Join KromaFolio Globally' : profile ? 'Edit Creator Profile' : 'Complete Your Creator Profile'}
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
          {!user ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Sign up free from anywhere in the world
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Create unlimited Behance-style slide presentations with Gemini AI, export free PDFs, and submit your
                  portfolio to the global creator showcase.
                </p>
              </div>

              {authError && (
                <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300">
                  {authError}
                </div>
              )}

              <button
                type="button"
                disabled={isLoading}
                onClick={() => void onGoogleSignIn()}
                className="w-full min-h-[48px] rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-colors active:scale-[0.99] disabled:opacity-60"
              >
                <span className="w-6 h-6 rounded-full bg-white text-[#2563EB] font-bold flex items-center justify-center text-xs">
                  G
                </span>
                <span>{isLoading ? 'Connecting Account...' : 'Continue with Google'}</span>
              </button>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Works across Android mobile browsers and desktop. Zero subscription fees.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitProfile} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={80}
                    required
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Creator Handle
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    maxLength={40}
                    required
                    placeholder="yourname.ux"
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Primary Discipline
                  </label>
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value as DisciplineCategory)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {DISCIPLINE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    City & Country
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={80}
                    placeholder="Lahore, Pakistan"
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Skills (comma separated, up to 10)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="Figma, Android UI, Motion Design, Branding"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Short Bio
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={400}
                  placeholder="Tell global clients and studios what you craft best..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Behance Profile URL
                  </label>
                  <input
                    type="url"
                    value={behanceUrl}
                    onChange={(e) => setBehanceUrl(e.target.value)}
                    placeholder="https://behance.net/..."
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Dribbble Profile URL
                  </label>
                  <input
                    type="url"
                    value={dribbbleUrl}
                    onChange={(e) => setDribbbleUrl(e.target.value)}
                    placeholder="https://dribbble.com/..."
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D14] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Signature Accent Color
                </span>
                <div className="flex items-center gap-2.5">
                  {AVATAR_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setAvatarColor(hex)}
                      aria-label={`Select color ${hex}`}
                      className={`w-9 h-9 rounded-full border-2 transition-transform ${
                        avatarColor === hex ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full min-h-[48px] rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving Creator Profile...' : 'Save Creator Profile'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
