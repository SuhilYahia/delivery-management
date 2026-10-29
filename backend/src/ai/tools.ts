import { z } from 'zod';
import type { ChatCompletionTool } from 'openai/resources/chat/completions.js';

export const tripSummaryToolSchema = z.object({
  startDate: z.string().optional().describe('تاريخ البداية بصيغة YYYY-MM-DD'),
  endDate: z.string().optional().describe('تاريخ النهاية بصيغة YYYY-MM-DD'),
});

export const driverPerformanceToolSchema = z.object({
  driverId: z.string().optional().describe('معرف السائق الاختياري لجلب تقريره بمفرده'),
  startDate: z.string().optional().describe('تاريخ البداية بصيغة YYYY-MM-DD'),
  endDate: z.string().optional().describe('تاريخ النهاية بصيغة YYYY-MM-DD'),
});

export const deliveryStatusToolSchema = z.object({
  status: z.enum(['PENDING', 'DELIVERED', 'FAILED', 'RETURNED']).optional().describe('حالة الاستلام المراد حصرها'),
  startDate: z.string().optional().describe('تاريخ البداية بصيغة YYYY-MM-DD'),
  endDate: z.string().optional().describe('تاريخ النهاية بصيغة YYYY-MM-DD'),
});

export const financialSummaryToolSchema = z.object({
  startDate: z.string().optional().describe('تاريخ البداية بصيغة YYYY-MM-DD'),
  endDate: z.string().optional().describe('تاريخ النهاية بصيغة YYYY-MM-DD'),
  includeCancelled: z.boolean().optional().describe('تضمين المشاوير الملغاة في الحساب المالي'),
});

export const undeliveredTripsToolSchema = z.object({
  limit: z.number().int().min(1).max(50).optional().default(10).describe('الحد الأقصى لعدد المشاوير المسترجعة'),
});

// تعريف الأدوات الرسمية لـ OpenAI
export const AI_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_trip_summary',
      description: 'استعلام ملخص المشاوير التشغيلي (إجمالي المشاوير، المكتملة، الملغاة، المسلّمة، ونسبة النجاح) ضمن نطاق زمني محدد',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'تاريخ البداية YYYY-MM-DD' },
          endDate: { type: 'string', description: 'تاريخ النهاية YYYY-MM-DD' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_driver_performance',
      description: 'استعلام تقرير أداء السائقين ومقارنة عدد المشاوير، نسب النجاح في التسليم، والتكاليف',
      parameters: {
        type: 'object',
        properties: {
          driverId: { type: 'string', description: 'معرف السائق إن وجد' },
          startDate: { type: 'string', description: 'تاريخ البداية YYYY-MM-DD' },
          endDate: { type: 'string', description: 'تاريخ النهاية YYYY-MM-DD' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_delivery_status_report',
      description: 'استعلام إحصائيات ونتائج تسليم الطلبات (مسلّمة، معلقة لم تُسلّم، متعذرة، مرتجعة)',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['PENDING', 'DELIVERED', 'FAILED', 'RETURNED'] },
          startDate: { type: 'string', description: 'تاريخ البداية YYYY-MM-DD' },
          endDate: { type: 'string', description: 'تاريخ النهاية YYYY-MM-DD' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_financial_summary',
      description: 'استعلام الملخص المالي لتكاليف التوصيل، المبالغ المحصلة، والمبالغ المتبقية للتحصيل',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'تاريخ البداية YYYY-MM-DD' },
          endDate: { type: 'string', description: 'تاريخ النهاية YYYY-MM-DD' },
          includeCancelled: { type: 'boolean', description: 'تضمين المشاوير الملغاة' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_undelivered_trips',
      description: 'عرض قائمة بالرحلات التي لم تُسلّم أو تعذرت مع أسباب عدم التسليم ومواعيد المحاولة التالية',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', description: 'العدد الأقصى المطلوب عرضه' },
        },
      },
    },
  },
];
