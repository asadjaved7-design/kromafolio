import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function sanitizeSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, 40))
    .filter((item) => item.length > 0)
    .slice(0, 10);
}

const VALID_LAYOUTS = new Set([
  'cover',
  'editorial-split',
  'metrics-impact',
  'palette-type',
  'process-steps',
  'full-showcase',
  'closing-credits',
]);

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'kromafolio-studio' });
  });

  app.post('/api/ai/generate-deck', async (req: Request, res: Response) => {
    try {
      const creatorName = sanitizeText(req.body?.creatorName, 80) || 'Global Creator';
      const discipline = sanitizeText(req.body?.discipline, 60) || 'UI/UX Design';
      const projectTitle = sanitizeText(req.body?.projectTitle, 120);
      const projectBrief = sanitizeText(req.body?.projectBrief, 1200);
      const targetAudience = sanitizeText(req.body?.targetAudience, 160) || 'Hiring managers and design directors';
      const visualTone = sanitizeText(req.body?.visualTone, 60) || 'Editorial Cobalt';
      const skills = sanitizeSkills(req.body?.skills);
      const requestedSlides = Number(req.body?.slideCount);
      const slideCount = Number.isFinite(requestedSlides)
        ? Math.min(10, Math.max(4, Math.round(requestedSlides)))
        : 6;

      if (!projectTitle || !projectBrief) {
        res.status(400).json({ error: 'Please provide both a project title and brief.' });
        return;
      }

      const ai = getGeminiClient();

      const prompt = [
        `Create a Behance-grade ${slideCount}-slide portfolio presentation deck for ${creatorName}.`,
        `Primary Discipline: ${discipline}`,
        `Creator Skills: ${skills.length > 0 ? skills.join(', ') : discipline}`,
        `Project Title: ${projectTitle}`,
        `Project Brief: ${projectBrief}`,
        `Target Audience: ${targetAudience}`,
        `Visual Tone: ${visualTone}`,
        `Requirements:`,
        `- Slide 1 must use layout "cover".`,
        `- Final slide must use layout "closing-credits".`,
        `- Middle slides should vary across "editorial-split", "process-steps", "palette-type", "metrics-impact", and "full-showcase".`,
        `- Every slide needs crisp, human-sounding design case study prose, realistic deliverables, and 2-4 concrete bullet takeaways or metrics.`,
        `- Avoid robotic jargon or placeholder lorem ipsum.`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an executive creative director crafting award-winning Behance and Dribbble portfolio case study presentations. Return clean, structured JSON matching the requested schema.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              accentColor: { type: Type.STRING, description: 'Hex color like #2563EB or #FF5A36' },
              suggestedSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    layout: { type: Type.STRING },
                    eyebrow: { type: Type.STRING },
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    body: { type: Type.STRING },
                    backgroundStyle: { type: Type.STRING, description: 'light, dark, or accent' },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    metrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          value: { type: Type.STRING },
                        },
                      },
                    },
                    paletteColors: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as {
        title?: string;
        subtitle?: string;
        accentColor?: string;
        suggestedSkills?: string[];
        slides?: Array<Record<string, unknown>>;
      };

      const rawSlides = Array.isArray(parsed.slides) ? parsed.slides : [];
      if (rawSlides.length === 0) {
        res.status(502).json({ error: 'The AI generator returned an empty deck. Please try again.' });
        return;
      }

      const normalizedSlides = rawSlides.slice(0, 12).map((s, idx) => {
        const rawLayout = typeof s.layout === 'string' ? s.layout : 'editorial-split';
        const layout = VALID_LAYOUTS.has(rawLayout)
          ? rawLayout
          : idx === 0
            ? 'cover'
            : idx === rawSlides.length - 1
              ? 'closing-credits'
              : 'editorial-split';
        const bg =
          s.backgroundStyle === 'dark' || s.backgroundStyle === 'accent' || s.backgroundStyle === 'light'
            ? s.backgroundStyle
            : idx === 0
              ? 'dark'
              : 'light';

        const bullets = Array.isArray(s.bullets)
          ? s.bullets.filter((b): b is string => typeof b === 'string').slice(0, 5)
          : [];
        const metrics = Array.isArray(s.metrics)
          ? s.metrics
              .filter(
                (m): m is { label: string; value: string } =>
                  typeof m === 'object' &&
                  m !== null &&
                  typeof (m as Record<string, unknown>).label === 'string' &&
                  typeof (m as Record<string, unknown>).value === 'string'
              )
              .slice(0, 4)
          : [];
        const paletteColors = Array.isArray(s.paletteColors)
          ? s.paletteColors
              .filter((c): c is string => typeof c === 'string' && /^#[0-9A-Fa-f]{3,8}$/.test(c))
              .slice(0, 5)
          : [];

        return {
          id: `slide_${Date.now()}_${idx + 1}`,
          layout,
          eyebrow: sanitizeText(s.eyebrow, 60) || `Chapter ${idx + 1}`,
          title: sanitizeText(s.title, 120) || projectTitle,
          subtitle: sanitizeText(s.subtitle, 200),
          body: sanitizeText(s.body, 900),
          backgroundStyle: bg,
          imageUrl: '',
          bullets,
          metrics,
          paletteColors: paletteColors.length > 0 ? paletteColors : ['#2563EB', '#0F172A', '#FF5A36', '#F8FAFC'],
        };
      });

      const accent =
        typeof parsed.accentColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(parsed.accentColor)
          ? parsed.accentColor
          : '#2563EB';

      res.json({
        title: sanitizeText(parsed.title, 120) || projectTitle,
        subtitle: sanitizeText(parsed.subtitle, 220) || `${discipline} Case Study by ${creatorName}`,
        accentColor: accent,
        suggestedSkills: sanitizeSkills(parsed.suggestedSkills),
        slides: normalizedSlides,
      });
    } catch (error) {
      console.error('AI Deck Generation Error:', error);
      const message = error instanceof Error ? error.message : 'Unable to generate presentation deck.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/refine-slide', async (req: Request, res: Response) => {
    try {
      const title = sanitizeText(req.body?.title, 120);
      const body = sanitizeText(req.body?.body, 900);
      const discipline = sanitizeText(req.body?.discipline, 60) || 'Design';
      const goal = sanitizeText(req.body?.goal, 200) || 'Make the narrative sharper, clearer, and impact-focused';

      if (!title && !body) {
        res.status(400).json({ error: 'Provide slide title or body text to refine.' });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Discipline: ${discipline}\nGoal: ${goal}\nCurrent Slide Title: ${title}\nCurrent Slide Body: ${body}\n\nRewrite the slide title, subtitle, concise body copy, and 3 crisp bullet takeaways suitable for a Behance PDF slide.`,
        config: {
          systemInstruction: 'You are a senior design editor polishing portfolio presentation copy.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              body: { type: Type.STRING },
              bullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        title?: string;
        subtitle?: string;
        body?: string;
        bullets?: string[];
      };

      res.json({
        title: sanitizeText(parsed.title, 120) || title,
        subtitle: sanitizeText(parsed.subtitle, 200),
        body: sanitizeText(parsed.body, 900) || body,
        bullets: Array.isArray(parsed.bullets)
          ? parsed.bullets.filter((b): b is string => typeof b === 'string').slice(0, 4)
          : [],
      });
    } catch (error) {
      console.error('AI Slide Refine Error:', error);
      const message = error instanceof Error ? error.message : 'Unable to refine slide content.';
      res.status(500).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KromaFolio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
