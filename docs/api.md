# مرجع واجهات برمجة التطبيقات (REST API Documentation)
## نظام المجد لإدارة التوصيل — الإصدار v1

- **عنوان الخادم الأساسي (Base URL)**: `http://localhost:4000/api/v1`
- **واجهة توثيق Swagger التفاعلية**: `http://localhost:4000/api-docs`
- **فحص صحة الخادم**: `http://localhost:4000/health`

---

### الترويسات الإلزامية (Mandatory Headers)

| الترويسة | الوصف | مثال |
| :--- | :--- | :--- |
| `Content-Type` | نوع البيانات | `application/json` |
| `Authorization` | رمز الدخول المشفر | `Bearer <JWT_TOKEN>` |
| `X-Company-Id` | معرف الشركة المستهدفة للطلب | `1abc7306-4189-406c-b21b-bc57e5b3b870` |

---

### 1. المصادقة والمستخدمين (`/auth`)

#### `POST /auth/login`
تسجيل الدخول واستلام رمز JWT.
- **Body**:
  ```json
  {
    "email": "admin@almajd.sa",
    "password": "Admin@123456"
  }
  ```
- **Response 200**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "...", "name": "...", "email": "..." },
      "token": "eyJhbGciOi...",
      "companies": [{ "id": "...", "name": "المجد هوم للمفروشات", "role": "COMPANY_ADMIN" }]
    }
  }
  ```

#### `GET /auth/me`
استرجاع بيانات المستخدم الحالي والشركات المصرح له بالوصول إليها.

#### `POST /auth/register`
إنشاء حساب مستخدم جديد مع شركة جديدة تلقائياً.

#### `POST /auth/change-password`
تغيير كلمة المرور بشكل آمن بالتحقق من كلمة المرور القديمة.

#### `POST /auth/logout`
تسجيل الخروج وإلغاء الكوكيز.

---

### 2. الشركات (`/companies`)

#### `GET /companies`
جلب جميع الشركات التي يملك المستخدم صلاحية عليها، مع عدد السائقين والمشاوير وإعدادات التسعير.

#### `GET /companies/:companyId`
جلب تفاصيل شركة محددة.

#### `POST /companies`
تسجيل شركة جديدة في النظام.
- **الصلاحية المطلوبة**: `SYSTEM_ADMIN` أو مدير نظام.

#### `PUT /companies/:companyId`
تعديل بيانات الشركة (الاسم، الهاتف، الرقم الضريبي، السجل التجاري، الشعار).

#### `PATCH /companies/:companyId/status`
تفعيل أو تعطيل الشركة.

---

### 3. السائقون والموصلون (`/drivers`)

#### `GET /drivers`
جلب سائقي الشركة النشطة مع إحصائيات مشاويرهم وتكاليفهم ونسب تسليمهم.

#### `POST /drivers`
تسجيل سائق جديد تابع للشركة النشطة.
- **Body**:
  ```json
  {
    "name": "سالم الدوسري",
    "phone": "0503344551",
    "vehicleType": "دينا نقل مفروشات مغلقة"
  }
  ```

#### `PUT /drivers/:driverId`
تحديث بيانات السائق.

#### `PATCH /drivers/:driverId/status`
تفعيل أو تعطيل حساب السائق.

#### `DELETE /drivers/:driverId`
حذف السائق (إذا كانت لديه مشاوير تاريخية، يتم تعطيله تلقائياً مع تنبيه آمن لمنع فقدان البيانات).

---

### 4. المشاوير والرحلات (`/trips`)

#### `GET /trips`
استرجاع قائمة المشاوير مع دعم البحث، التصفية المتقدمة، والترقيم (Pagination).
- **Query Parameters**:
  - `page`: رقم الصفحة (افتراضياً 1).
  - `limit`: عدد النتائج (افتراضياً 50، بحد أقصى 100).
  - `search`: بحث برقم المشوار، اسم العميل، رقم الجوال، أو رقم الطلب.
  - `driverId`: تصفية حسب السائق.
  - `status`: حالة المشوار (`NEW`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
  - `deliveryStatus`: حالة الاستلام (`PENDING`, `DELIVERED`, `FAILED`, `RETURNED`).
  - `startDate`, `endDate`: نطاق تاريخ المشوار.
  - `sortField`, `sortOrder`: حقل الترتيب واتجاهه.

#### `POST /trips`
إنشاء مشوار جديد، مع احتساب التكلفة تلقائياً على الخادم وفق مدة المشوار وتسعيرة الشركة وحفظ لقطة تاريخية للتسعيرة المطبقة.
- **Body**:
  ```json
  {
    "driverId": "2bf160c1-...",
    "orderNumber": "ORD-9841",
    "customerName": "سليمان المعجل",
    "customerPhone": "0505123456",
    "deliveryAddress": "الرياض - حي النرجس",
    "tripDate": "2026-10-29",
    "tripTime": "10:30",
    "durationMinutes": 45,
    "status": "COMPLETED",
    "deliveryStatus": "DELIVERED",
    "paymentMethod": "CASH",
    "paidAmount": 50,
    "notes": "تسليم كنب مجلس"
  }
  ```

#### `PUT /trips/:tripId`
تعديل بيانات المشوار أو تحديث المدة وإعادة احتساب التكلفة.

#### `DELETE /trips/:tripId`
حذف مشوار مع سجلاته المرتبطة.

---

### 5. دورة استلام الطلب والتوصيل (`/deliveries`)

#### `PATCH /deliveries/:tripId/status`
تحديث حالة استلام الطلب من العميل وتوثيق التاريخ والوقت الفعليين.
- **Body**:
  ```json
  {
    "status": "DELIVERED",
    "actualDeliveryDate": "2026-10-29",
    "actualDeliveryTime": "11:15",
    "recipientName": "سليمان المعجل",
    "deliveryNotes": "تم تسليم الطلب بحالة ممتازة"
  }
  ```

---

### 6. المدفوعات والتحصيل (`/payments`)

#### `POST /payments`
تسجيل دفعة جديدة لمشوار، مع التحقق من عدم تجاوز المبلغ المستحق واستخدام مفتاح `idempotencyKey` لمنع التكرار.
- **Body**:
  ```json
  {
    "tripId": "b848e5e5-...",
    "amount": 50,
    "paymentMethod": "BANK_TRANSFER",
    "reference": "TRX-987654",
    "notes": "سداد عبر تطبيق الراجحي",
    "idempotencyKey": "pay-unique-uuid-12345"
  }
  ```

#### `GET /payments/trip/:tripId`
عرض جميع الدفعات المسجلة لمشوار محدد مع ملخص المتبقي.

---

### 7. إعدادات التسعير (`/pricing`)

#### `GET /pricing`
جلب قواعد التسعير النشطة للشركة.

#### `PUT /pricing`
تعديل شرائح التسعير الخاصة بالشركة النشطة، مع التحقق من صحة الشرائح وعدم وجود تداخل أو قيم سالبة.

---

### 8. التقارير والإحصائيات (`/reports`)

#### `GET /reports/dashboard`
استرجاع مؤشرات لوحة التحكم الرئيسية (مشاوير اليوم، التكاليف، نسب الإنجاز، أحدث العمليات).

#### `GET /reports/data`
استرجاع بيانات التحليلات المتقدمة المفلترة بالتواريخ والسائقين وحالات الاستلام.

---

### 9. المساعد الذكي للعمليات (`/ai`)

#### `POST /ai/chat`
طرح أسئلة باللغة العربية حول العمليات والتقارير المالية والتشغيلية عبر OpenAI GPT-4o Tool Calling.
- **Body**:
  ```json
  {
    "prompt": "كم رحلة أنجزنا اليوم وما إجمالي تكلفتها؟",
    "history": []
  }
  ```
- **Response 200**:
  ```json
  {
    "success": true,
    "data": {
      "reply": "أنجزت شركة المجد هوم اليوم 5 مشاوير، بإجمالي تكلفة بلغت 450 ريالاً، وبلغت نسبة نجاح التسليم 63.6%."
    }
  }
  ```
