import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Loader2,
  AlertCircle,
  HelpCircle,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import api from '../../services/api';

const QUICK_PROMPTS = [
  'كم رحلة أنجزنا اليوم؟',
  'ما إجمالي تكاليف التوصيل هذا الشهر؟',
  'من السائق الأعلى في نسبة نجاح التوصيل؟',
  'ما الرحلات التي لم يتم تسليمها بعد؟',
  'كم المبالغ المتبقية على المشاوير؟',
  'لخص أداء السائقين وتكاليفهم',
];

export default function AiAssistantModal({ isOpen, onClose }) {
  const { activeCompany } = useCompany();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `أهلاً بك! أنا المساعد الذكي لنظام المجد لإدارة التوصيل لشركة "${activeCompany?.name || 'الشركة'}".
يمكنك سؤالي باللغة العربية عن الرحلات، أداء السائقين، المبالغ المستحقة، ونسب نجاح التوصيل في أي وقت.`,
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // إرسال سجل المحادثة مع السؤال الجديد
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.chatWithAi(prompt, history);
      const replyText = typeof res === 'string' ? res : res?.reply || 'تمت معالجة الاستعلام بنجاح';

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyText,
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        isError: true,
        content: `تعذر الاتصال بخدمة الذكاء الاصطناعي: ${err.message || 'خطأ في الخادم'}. تأكد من تفعيل مفتاح OPENAI_API_KEY في ملف .env بالخادم.`,
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl h-[650px] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">المساعد الذكي للعمليات</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  OpenAI GPT-4o
                </span>
              </div>
              <p className="text-xs text-brand-200 font-medium">
                {activeCompany?.name ? `نطاق شركة: ${activeCompany.name}` : 'استعلامات دقيقة ومحمية'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-6 py-3 bg-slate-50/90 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">أسئلة مقترحة:</span>
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-xs px-3 py-1 rounded-full bg-white border border-slate-200/80 text-slate-700 hover:border-brand-500 hover:text-brand-700 hover:bg-brand-50/50 transition whitespace-nowrap shadow-xs disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-50/40 to-white">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-xs ${
                    isUser
                      ? 'bg-brand-600 text-white'
                      : m.isError
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs relative group ${
                      isUser
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : m.isError
                        ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-none'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {!isUser && (
                      <button
                        onClick={() => copyToClipboard(m.content, m.id)}
                        className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                        title="نسخ النص"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 rounded-tl-none flex items-center gap-2 text-xs text-slate-500 shadow-xs">
                <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                <span>جاري استعلام البيانات وتحليلها...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك هنا عن الرحلات أو السائقين أو الإحصائيات..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span>إرسال</span>
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            يستعلم المساعد من قاعدة بيانات PostgreSQL المشفرة والخاصة بالشركة النشطة فقط عبر Tool Calling.
          </p>
        </div>
      </div>
    </div>
  );
}
