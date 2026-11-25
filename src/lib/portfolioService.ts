import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  DISCIPLINE_CATEGORIES,
  type CreatorProfile,
  type DisciplineCategory,
  type PortfolioDeck,
  type PortfolioSlide,
} from '../types/portfolio';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `id_${Date.now()}`;
}

function sanitizeCategory(cat: string): DisciplineCategory {
  return DISCIPLINE_CATEGORIES.includes(cat as DisciplineCategory)
    ? (cat as DisciplineCategory)
    : 'UI/UX Design';
}

function sanitizeSkills(skills: string[]): string[] {
  return skills
    .map((s) => s.trim().slice(0, 40))
    .filter((s) => s.length > 0)
    .slice(0, 10);
}

function sanitizeHandle(raw: string, fallbackUid: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_.\-]/g, '')
    .slice(0, 40);
  return cleaned.length >= 2 ? cleaned : `creator_${fallbackUid.slice(0, 6).toLowerCase()}`;
}

function sanitizeSlides(slides: PortfolioSlide[]): PortfolioSlide[] {
  const list = slides.slice(0, 16).map((s, idx) => ({
    id: sanitizeId(s.id || `slide_${idx + 1}`),
    layout: s.layout || 'editorial-split',
    eyebrow: (s.eyebrow || `Slide ${idx + 1}`).slice(0, 80),
    title: (s.title || 'Untitled Slide').slice(0, 120),
    subtitle: (s.subtitle || '').slice(0, 220),
    body: (s.body || '').slice(0, 950),
    backgroundStyle: s.backgroundStyle || 'light',
    imageUrl: (s.imageUrl || '').slice(0, 400),
    bullets: Array.isArray(s.bullets) ? s.bullets.map((b) => b.slice(0, 180)).slice(0, 6) : [],
    metrics: Array.isArray(s.metrics)
      ? s.metrics
          .map((m) => ({
            label: String(m.label || '').slice(0, 40),
            value: String(m.value || '').slice(0, 24),
          }))
          .slice(0, 4)
      : [],
    paletteColors: Array.isArray(s.paletteColors)
      ? s.paletteColors.map((c) => c.slice(0, 16)).slice(0, 5)
      : ['#2563EB', '#0F172A', '#FF5A36', '#F8FAFC'],
  }));

  if (list.length === 0) {
    list.push({
      id: `slide_${Date.now()}`,
      layout: 'cover',
      eyebrow: 'Portfolio Presentation',
      title: 'Creative Case Study',
      subtitle: 'Designed with KromaFolio Studio',
      body: '',
      backgroundStyle: 'dark',
      imageUrl: '',
      bullets: [],
      metrics: [],
      paletteColors: ['#2563EB', '#0F172A', '#FF5A36', '#F8FAFC'],
    });
  }
  return list;
}

export async function fetchCreatorProfile(uid: string): Promise<CreatorProfile | null> {
  const path = `creators/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'creators', uid));
    if (!snap.exists()) return null;
    return snap.data() as CreatorProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveCreatorProfile(
  user: User,
  profileInput: Omit<CreatorProfile, 'uid' | 'createdAt' | 'updatedAt'>,
  preferredTheme: 'light' | 'dark'
): Promise<CreatorProfile> {
  const uid = sanitizeId(user.uid);
  const publicPath = `creators/${uid}`;
  const privatePath = `creators/${uid}/private/info`;

  const existing = await fetchCreatorProfile(uid);

  const sanitizedPublic: Record<string, unknown> = {
    uid,
    displayName: (profileInput.displayName || user.displayName || 'Creator').trim().slice(0, 80) || 'Creator',
    handle: sanitizeHandle(profileInput.handle || user.email?.split('@')[0] || 'creator', uid),
    discipline: sanitizeCategory(profileInput.discipline),
    location: (profileInput.location || 'Global').trim().slice(0, 80),
    bio: (profileInput.bio || '').trim().slice(0, 400),
    skills: sanitizeSkills(profileInput.skills || []),
    avatarColor: (profileInput.avatarColor || '#2563EB').slice(0, 20),
    behanceUrl: (profileInput.behanceUrl || '').trim().slice(0, 240),
    dribbbleUrl: (profileInput.dribbbleUrl || '').trim().slice(0, 240),
    websiteUrl: (profileInput.websiteUrl || '').trim().slice(0, 240),
    createdAt: existing?.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'creators', uid), sanitizedPublic, { merge: existing !== null });
  } catch (error) {
    handleFirestoreError(error, existing ? OperationType.UPDATE : OperationType.CREATE, publicPath);
  }

  try {
    await setDoc(doc(db, 'creators', uid, 'private', 'info'), {
      uid,
      email: (user.email || '').slice(0, 160),
      preferredTheme,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }

  return {
    ...(sanitizedPublic as unknown as CreatorProfile),
  };
}

export async function fetchPublishedPortfolios(): Promise<PortfolioDeck[]> {
  const path = 'portfolios';
  try {
    const q = query(collection(db, 'portfolios'), where('isPublished', '==', true), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PortfolioDeck);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchCreatorPortfolios(ownerId: string): Promise<PortfolioDeck[]> {
  const path = 'portfolios';
  try {
    const q = query(collection(db, 'portfolios'), where('ownerId', '==', ownerId), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PortfolioDeck);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function savePortfolioDeck(
  user: User,
  creator: CreatorProfile | null,
  deck: PortfolioDeck
): Promise<PortfolioDeck> {
  const portfolioId = sanitizeId(deck.id || `deck_${Date.now()}`);
  const ownerId = sanitizeId(user.uid);
  const path = `portfolios/${portfolioId}`;

  let existingSnap = null;
  try {
    const snap = await getDoc(doc(db, 'portfolios', portfolioId));
    if (snap.exists()) {
      existingSnap = snap.data() as PortfolioDeck;
    }
  } catch {
    existingSnap = null;
  }

  const isUpdate = existingSnap !== null && existingSnap.ownerId === ownerId;

  const payload: Record<string, unknown> = {
    id: portfolioId,
    ownerId,
    creatorName: (creator?.displayName || deck.creatorName || user.displayName || 'Creator').slice(0, 80),
    creatorHandle: sanitizeHandle(creator?.handle || deck.creatorHandle || 'creator', ownerId),
    creatorLocation: (creator?.location || deck.creatorLocation || 'Global').slice(0, 80),
    title: (deck.title || 'Untitled Portfolio').trim().slice(0, 120) || 'Untitled Portfolio',
    subtitle: (deck.subtitle || '').trim().slice(0, 220),
    category: sanitizeCategory(deck.category),
    skills: sanitizeSkills(deck.skills || []),
    accentColor: (deck.accentColor || '#2563EB').slice(0, 20),
    coverImage: (deck.coverImage || '').slice(0, 400),
    behanceUrl: (deck.behanceUrl || '').trim().slice(0, 240),
    dribbbleUrl: (deck.dribbbleUrl || '').trim().slice(0, 240),
    isPublished: Boolean(deck.isPublished),
    allowFreePdf: Boolean(deck.allowFreePdf),
    appreciationCount: isUpdate ? Number(existingSnap?.appreciationCount ?? 0) : 0,
    slides: sanitizeSlides(deck.slides),
    createdAt: isUpdate ? existingSnap?.createdAt ?? serverTimestamp() : serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'portfolios', portfolioId), payload, { merge: isUpdate });
  } catch (error) {
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, path);
  }

  return {
    ...(payload as unknown as PortfolioDeck),
  };
}

export async function removePortfolioDeck(portfolioId: string): Promise<void> {
  const id = sanitizeId(portfolioId);
  const path = `portfolios/${id}`;
  try {
    await deleteDoc(doc(db, 'portfolios', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function togglePortfolioAppreciation(
  user: User,
  portfolio: PortfolioDeck,
  currentlyAppreciated: boolean
): Promise<number> {
  const portfolioId = sanitizeId(portfolio.id);
  const userId = sanitizeId(user.uid);
  const path = `portfolios/${portfolioId}/appreciations/${userId}`;

  const portfolioRef = doc(db, 'portfolios', portfolioId);
  const appreciationRef = doc(db, 'portfolios', portfolioId, 'appreciations', userId);

  const batch = writeBatch(db);
  const currentCount = Math.max(0, Math.floor(portfolio.appreciationCount || 0));
  const nextCount = currentlyAppreciated ? Math.max(0, currentCount - 1) : currentCount + 1;

  if (currentlyAppreciated) {
    batch.delete(appreciationRef);
  } else {
    batch.set(appreciationRef, {
      userId,
      portfolioId,
      createdAt: serverTimestamp(),
    });
  }

  batch.update(portfolioRef, {
    appreciationCount: nextCount,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return nextCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserAppreciatedIds(uid: string): Promise<Set<string>> {
  // Query user's own appreciations? Since appreciations are subcollections under portfolios,
  // we check cleanly per portfolio or track in bookmarks/local session + doc check when needed.
  // Checking creator's bookmarks collection directly is O(1) list!
  void uid;
  return new Set<string>();
}

export async function fetchUserBookmarks(uid: string): Promise<Set<string>> {
  const path = `creators/${uid}/bookmarks`;
  try {
    const q = query(collection(db, 'creators', uid, 'bookmarks'), where('ownerId', '==', uid), limit(100));
    const snap = await getDocs(q);
    return new Set(snap.docs.map((d) => d.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function toggleBookmark(
  uid: string,
  portfolioId: string,
  currentlyBookmarked: boolean
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const safePortfolioId = sanitizeId(portfolioId);
  const path = `creators/${safeUid}/bookmarks/${safePortfolioId}`;
  const ref = doc(db, 'creators', safeUid, 'bookmarks', safePortfolioId);

  try {
    if (currentlyBookmarked) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        portfolioId: safePortfolioId,
        ownerId: safeUid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, currentlyBookmarked ? OperationType.DELETE : OperationType.CREATE, path);
  }
}
