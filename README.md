# نظام المجد لإدارة التوصيل والمشاوير والشركات
## Al Majd Delivery Management System — المرحلة الثانية (Full-Stack)

نظام سحابي متكامل ومؤسسي لإدارة عمليات التوصيل، المشاوير، أسطول الموصلين، والتحصيل المالي، مع دعم أصيل لتعدد الشركات المستقلة (Multi-Tenancy)، ومركز تقارير تشغيلية ومالية متقدم، ومساعد ذكي للعمليات مدعوم بنموذج **OpenAI GPT-4o** مع تقنية **Tool/Function Calling**.

---

### 1. التقنيات وحزمة التطوير (Tech Stack)

#### الواجهة الأمامية (Frontend):
- **React 19 & Vite 8**: واجهة مستخدم فائقة السرعة مع دعم اللغة العربية وتخطيط من اليمين لليسار (RTL).
- **Tailwind CSS v3**: نظام تصميم متكامل مع خط Cairo وألوان وتدرجات احترافية.
- **Fetch API & Centralized Auth**: طبقة اتصال موحدة تمرر رموز `Bearer JWT` وترويسة نطاق الشركة `X-Company-Id`.
- **Recharts**: رسوم بيانية تفاعلية متطورة للمسارات اليومية وتوزيع حالات التسليم.
- **Lucide React**: أيقونات عصرية عالية الدقة.

#### الواجهة الخلفية وقاعدة البيانات (Backend & Database):
- **Node.js & Express & TypeScript**: خادم عالي الأداء ومنظم وفق معمارية Modular Architecture.
- **PostgreSQL 17**: قاعدة بيانات علائقية قوية تدعم قيود التكامل، الفهارس المركبة، والمعاملات المالية.
- **Prisma ORM v6**: إدارة المخططات، النماذج، العلاقات، والترحيلات (Migrations & Seed).
- **Zod**: التحقق الصارم من جميع مدخلات ومعاملات الـ API.
- **Argon2 / Bcrypt**: تشفير كلمات المرور بأعلى معايير الأمان.
- **JWT & HTTP-Only Secure Cookies**: إدارة الجلسات والمصادقة متعددة الأدوار (RBAC).
- **OpenAI API with Tool Calling**: محرك ذكاء اصطناعي للرد على الاستعلامات التشغيلية والمالية بالاستعلام المباشر من PostgreSQL.
- **Swagger / OpenAPI v3**: توثيق تفاعلي كامل ومباشر لجميع مسارات الـ API.
- **Vitest & Supertest**: مجموعة اختبارات آلية شاملة لجميع القواعد المالية، الصلاحيات، وعزل الشركات.

---

### 2. هيكل ملفات المشروع المعتمد

```
delivery-management/
├── frontend/                     # تطبيق React + Vite
│   ├── src/
│   │   ├── components/           # المكونات (layout, common, trips, drivers, companies, ai)
│   │   ├── context/              # سياق الشركات والتطبيق (CompanyContext, AppContext)
│   │   ├── pages/                # الصفحات الرئيسية (Dashboard, Trips, Drivers, Reports...)
│   │   ├── services/             # طبقة الاتصال الحقيقية بالخادم (api.js)
│   │   └── utils/                # أدوات التنسيق والحسابات والتواريخ
│   ├── package.json
│   └── .env.example
├── backend/                      # خادم Express + TypeScript + Prisma
│   ├── src/
│   │   ├── ai/                   # أدوات ومعالج الذكاء الاصطناعي (tools.ts, toolHandlers.ts, openaiService.ts)
│   │   ├── config/               # إعدادات البيئة وقاعدة البيانات (env.ts, prisma.ts)
│   │   ├── docs/                 # توثيق Swagger OpenAPI (swagger.ts)
│   │   ├── middleware/           # وسائط الأمان والتحقق (auth.ts, companyScope.ts, roleGuard.ts...)
│   │   ├── modules/              # وحدات النظام (auth, companies, drivers, trips, deliveries, payments, pricing, reports)
│   │   ├── utils/                # حاسبة التسعير، سجلات التدقيق، وتنسيق الردود
│   │   ├── app.ts                # تكوين Express والوسائط
│   │   └── server.ts             # نقطة بدء تشغيل الخادم
│   ├── prisma/
│   │   ├── schema.prisma         # مخطط قاعدة البيانات والنماذج العلائقية
│   │   └── seed.ts               # البيانات التجريبية الأولية
│   ├── tests/                    # الاختبارات الآلية (pricing.test.ts, integration.test.ts)
│   ├── package.json
│   └── .env.example
├── docs/                         # التوثيق المعماري وتوثيق الـ API
│   ├── architecture.md           # دليل البنية المعمارية وعزل البيانات
│   └── api.md                    # مواصفات مسارات REST API الكاملة
├── package.json                  # سكربتات التشغيل الموحدة للمشروع
└── README.md                     # الدليل المرجعي الرئيسي
```

---

### 3. إعداد وتشغيل المشروع على نظام Windows خطوة بخطوة

#### المتطلبات الأساسية:
1. **Node.js**: الإصدار 18 أو أحدث (موصى بـ v20 أو v22 أو v24).
2. **PostgreSQL 17**: مثبت محلياً أو قاعدة بيانات سحابية (Supabase / Neon / AWS RDS).

---

#### الخطوة 1: إعداد قاعدة بيانات PostgreSQL
إذا كنت تستخدم عنقود PostgreSQL المحلي المرفق في مجلد `backend/db_data` (على المنفذ 5434):
```powershell
& "C:\Program Files\PostgreSQL\17\bin\postgres.exe" -D "c:\Users\MBCS\OneDrive\Desktop\delivery-management\backend\db_data" -p 5434
```
أو إذا كان لديك خادم PostgreSQL قياسي يعمل على المنفذ 5432، يمكنك إنشاء قاعدة بيانات باسم `almajd_delivery`:
```sql
CREATE DATABASE almajd_delivery;
```

---

#### الخطوة 2: ضبط متغيرات البيئة (Environment Variables)

1. أنشئ ملف `backend/.env` بناءً على `backend/.env.example`:
```ini
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://postgres@127.0.0.1:5434/almajd_delivery?schema=public"
JWT_SECRET=super_secret_jwt_almajd_key_2026_secure
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
```
*(ملاحظة: إذا لم تقم بإدخال مفتاح `OPENAI_API_KEY`، سيعمل النظام بكامل وظائفه الحسابية والتشغيلية وسيعرض المساعد الذكي تنبيهاً آمناً يوضح طريقة التفعيل)*.

2. أنشئ ملف `frontend/.env` بناءً على `frontend/.env.example`:
```ini
VITE_API_URL=http://localhost:4000/api/v1
```

---

#### الخطوة 3: تجهيز قاعدة البيانات وإدخال البيانات التجريبية

من داخل مجلد `backend`:
```powershell
cd "c:\Users\MBCS\OneDrive\Desktop\delivery-management\backend"

# 1. تثبيت الحزم
npm install

# 2. توليد عميل Prisma وتطبيق المخطط
npm run prisma:generate
npm run prisma:push

# 3. إدخال البيانات التجريبية الشاملة
npm run prisma:seed
```

#### الحسابات التجريبية المعتمدة بعد تشغيل الـ Seed:
- **مدير عام النظام (Super Admin)**:
  - البريد: `admin@almajd.sa`
  - كلمة المرور: `Admin@123456`
  - الصلاحية: إدارة جميع الشركات وعرض تقاريرها.
- **موظف تشغيل لشركة المجد (Staff)**:
  - البريد: `staff@almajd.sa`
  - كلمة المرور: `Staff@123456`
- **مدير شركة أفق الأثاث والديكور (Company Admin)**:
  - البريد: `ofok.admin@decor.sa`
  - كلمة المرور: `Admin@123456`

---

#### الخطوة 4: تشغيل خوادم التطوير (Frontend & Backend)

من المجلد الرئيسي للمشروع:
```powershell
cd "c:\Users\MBCS\OneDrive\Desktop\delivery-management"

# لتشغيل الخادم الخلفي (Backend) على المنفذ 4000:
npm run dev:backend

# في نافذة طرفية أخرى، لتشغيل الواجهة الأمامية (Frontend) على المنفذ 5173:
npm run dev:frontend
```

الروابط المباشرة:
- **تطبيق الويب (Frontend)**: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
- **توثيق الـ API التفاعلي (Swagger UI)**: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)
- **فحص صحة الخادم (Health Check)**: [http://localhost:4000/health](http://localhost:4000/health)

---

### 4. تشغيل الاختبارات الآلية (Automated Testing)

يحتوي النظام على 17 اختباراً آلياً عبر **Vitest** و **Supertest** تغطي كافة الجوانب الحرجة:
- حماية المصادقة والصلاحيات (RBAC).
- عزل بيانات الشركات ومنع الوصول المتبادل (Multi-Tenant Isolation).
- منع ربط سائق من شركة أخرى بمشوار الشركة الحالية.
- التحقق من جميع حدود التسعير (19، 20، 29، 30، 60، 61، 120، 121 دقيقة).
- رفض المدد الصفرية والسالبة.
- تسجيل التسليم والوقت الفعلي.
- رفض الدفعات التي تتجاوز المبلغ المستحق المتبقي.
- منع تكرار تسجيل الدفعات بفضل مفتاح `idempotencyKey`.
- صحة مؤشرات لوحة التحكم وحسابات التقارير.

لتشغيل الاختبارات:
```powershell
cd backend
npm test
```
**النتيجة الفعلية**: نجاح 17 اختباراً من أصل 17 بنسبة 100% (Green).

---

### 5. بناء نسخة الإنتاج (Production Build)

لتجميع واختبار بناء نسخة الإنتاج:
```powershell
# من المجلد الرئيسي للمشروع:
npm run build
```
يقوم هذا الأمر بتجميع كود TypeScript للخادم الخلفي عبر `tsc`، وبناء ملفات الواجهة الأمامية عبر Vite مع تصغير الحجم (Minification) وتوليد حزم الإنتاج الجاهزة للنشر.

---

### 6. التوثيق المعماري والمراجع

- [دليل البنية المعمارية وعزل الشركات](file:///c:/Users/MBCS/OneDrive/Desktop/delivery-management/docs/architecture.md)
- [مرجع واجهات برمجة التطبيقات REST API](file:///c:/Users/MBCS/OneDrive/Desktop/delivery-management/docs/api.md)
