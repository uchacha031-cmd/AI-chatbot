import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { processMiyuPipeline } from './src/services/geminiService.ts';
import { INITIAL_EMOTION, INITIAL_PERSONALITY, INITIAL_RELATIONSHIP } from './src/features/constants.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Miyu AI Companion V2',
      time: new Date().toISOString(),
      hasGeminiKey: !!process.env.GEMINI_API_KEY
    });
  });

  // Miyu Chat Response Pipeline API
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const {
        message,
        batchedMessages,
        batchId,
        conversationHistory = [],
        userProfile = null,
        memories = [],
        currentEmotion,
        personality,
        relationship,
        temporalContext,
        imageAttachment,
        miyuNickname,
        userNickname,
        miyuOriginalName,
        userOriginalName,
      } = req.body;

      let rawMessages: string[] = Array.isArray(batchedMessages) && batchedMessages.length > 0
        ? batchedMessages.map((m: any) => String(m).trim()).filter((m: string) => m.length > 0)
        : (message && typeof message === 'string' && message.trim().length > 0 ? [message.trim()] : []);

      if (rawMessages.length === 0 && imageAttachment) {
        rawMessages = ['[Hình ảnh]'];
      }

      if (rawMessages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Tin nhắn không được để trống'
        });
      }

      const combinedMessage = rawMessages.join('\n');

      const result = await processMiyuPipeline({
        userMessage: combinedMessage,
        batchedMessages: rawMessages,
        batchId,
        conversationHistory,
        userProfile,
        memories,
        currentEmotion: currentEmotion || INITIAL_EMOTION,
        personality: personality || INITIAL_PERSONALITY,
        relationship: relationship || INITIAL_RELATIONSHIP,
        temporalContext,
        imageAttachment,
        miyuNickname,
        userNickname,
        miyuOriginalName,
        userOriginalName,
      });

      return res.json({
        ...result,
        batchId: batchId || undefined
      });
    } catch (err: any) {
      console.error('API /api/chat error:', err);
      return res.status(500).json({
        success: false,
        reply: "Mạng bên em hơi chập chờn một chút. Anh gửi lại sau vài giây nhé.",
        error: err.message || 'Lỗi xử lý server'
      });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Miyu companion server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
