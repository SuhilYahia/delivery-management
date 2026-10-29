import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AI_TOOLS } from './tools.js';
import { executeAiTool } from './toolHandlers.js';
import prisma from '../config/prisma.js';

let openaiClient: OpenAI | null = null;
if (env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

export async function askAiAssistant(
  prompt: string,
  companyId: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  if (!openaiClient || !env.OPENAI_API_KEY) {
    return 'مساعد الذكاء الاصطناعي غير مفعل حالياً. لتفعيله، يرجى إضافة مفتاح OPENAI_API_KEY إلى ملف .env الخاص بالخادم. باقي وظائف النظام تعمل بشكل طبيعي تماماً.';
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, city: true, defaultCurrency: true },
  });

  const companyName = company ? company.name : 'الشركة';

  const messages: any[] = [
    {
      role: 'system',
      content: `أنت المساعد الذكي المتخصص لنظام المجد لإدارة التوصيل والمشاوير، وتعمل حالياً لصالح شركة "${companyName}".
مهمتك مساعدة المدير وفرق العمل في الإجابة على الأسئلة التشغيلية والمالية بدقة وموضوعية وباللغة العربية الفصحى.

تعليمات إلزامية وأمنية:
1. لا تخترع أو تخمن أي أرقام أو إحصائيات من عندك أبداً.
2. استخدم الأدوات البرمجية المتاحة (Function Calling) للاستعلام عن البيانات الفعلية من قاعدة البيانات قبل الإجابة.
3. إذا كانت البيانات غير موجودة أو فارغة، وضّح ذلك بكل صراحة وأمانة.
4. إجاباتك يجب أن تكون منسقة وواضحة ومباشرة.
5. العملة المعتمدة هي ${company?.defaultCurrency || 'SAR'}.
6. التاريخ اليوم والمنطقة الزمنية هي الرياض (Asia/Riyadh).`,
    },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt },
  ];

  try {
    // المحاولة الأولى لاستدعاء النموذج مع الأدوات
    let response = await openaiClient.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages,
      tools: AI_TOOLS,
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 800,
    });

    let choice = response.choices[0];

    // حلقة معالجة الأدوات (Tool Calling Loop)
    let iterations = 0;
    while (choice.finish_reason === 'tool_calls' && choice.message.tool_calls && iterations < 3) {
      iterations++;
      messages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        let toolResult: any;
        try {
          toolResult = await executeAiTool(
            toolCall.function.name,
            toolCall.function.arguments,
            companyId
          );
        } catch (toolErr: any) {
          toolResult = { error: toolErr.message || 'فشل استعلام الأداة' };
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      response = await openaiClient.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 800,
      });

      choice = response.choices[0];
    }

    return choice.message.content || 'عذراً، لم أتمكن من استخراج إجابة مناسبة بناءً على البيانات.';
  } catch (err: any) {
    console.error('خطأ في استدعاء OpenAI API:', err);
    return `تعذر معالجة الطلب عبر الذكاء الاصطناعي: ${err.message || 'خطأ غير معروف'}. يرجى المحاولة لاحقاً.`;
  }
}
