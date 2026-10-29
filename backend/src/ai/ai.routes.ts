import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { askAiAssistant } from './openaiService.js';
import { authenticate } from '../middleware/auth.js';
import { requireCompanyScope } from '../middleware/companyScope.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { recordAuditLog } from '../utils/audit.js';

const router = Router();

const chatRequestSchema = z.object({
  prompt: z.string().min(1, 'الرسالة مطلوبة'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

router.use(authenticate);
router.use(requireCompanyScope);

router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, history } = chatRequestSchema.parse(req.body);
    const companyId = req.currentCompanyId!;

    const reply = await askAiAssistant(prompt, companyId, history);

    await recordAuditLog({
      req,
      companyId,
      action: 'AI_CHAT_QUERY',
      entity: 'AI',
      details: { promptLength: prompt.length },
    });

    successResponse(res, { reply });
  } catch (err) {
    next(err);
  }
});

export default router;
