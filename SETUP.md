# PMS — First-Time Setup / الإعداد لأول مرة

دليل تشغيل المشروع بعد التنزيل من GitHub.

---

## المتطلبات

| الأداة | الإصدار |
|--------|---------|
| PHP | 8.1+ (extensions: mbstring, pdo_mysql, openssl, tokenizer, xml, ctype, json, bcmath) |
| Composer | 2.x |
| Node.js | 18+ |
| MySQL | 8.x |
| npm | 9+ |

---

## 1. قاعدة البيانات

أنشئ قاعدة بيانات فارغة في MySQL، مثلاً:

```sql
CREATE DATABASE pms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 2. Backend (Laravel)

```bash
cd "backend last"
composer install
copy .env.example .env
php artisan key:generate
```

عدّل ملف `.env` — أهم القيم:

```env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173

DB_DATABASE=pms
DB_USERNAME=root
DB_PASSWORD=your_password

DEFAULT_UNIVERSITY_NAME=Legacy

# اختياري — لميزات AI
GEMINI_API_KEY=your_key_here
```

ثم نفّذ **الهجرات والبذور معاً** (مهم جداً):

```bash
php artisan migrate --seed
```

> **لماذا `--seed`؟**  
> حساب مدير المنصة (Super Admin) **لا يُنشأ تلقائياً** عند `migrate` فقط.  
> يُنشأ عبر `UniversitySeeder` عند تشغيل `db:seed`.

إذا كنت قد نفّذت `migrate` سابقاً بدون seed:

```bash
php artisan db:seed
```

ربط مجلد التخزين (لرفع ملفات الإصدارات):

```bash
php artisan storage:link
```

شغّل السيرفر:

```bash
php artisan serve
```

الـ API يكون على: `http://127.0.0.1:8000`

---

## 3. Frontend (React)

في terminal جديد:

```bash
cd frontend
npm install
copy .env.example .env
```

محتوى `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

شغّل الواجهة:

```bash
npm run dev
```

افتح: `http://localhost:5173`

---

## 4. حساب مدير المنصة الافتراضي

بعد `php artisan migrate --seed` يُنشأ الحساب التالي:

| الحقل | القيمة |
|-------|--------|
| **البريد** | `superadmin@pms.local` |
| **كلمة المرور** | `password` |
| **الدور** | Super Admin (مدير المنصة) |
| **الحالة** | active |

سجّل الدخول من صفحة Login بهذا الحساب للوصول إلى:
- إدارة الجامعات
- مستخدمي المنصة
- مشاريع المنصة
- لوحة Super Admin

> **للإنتاج:** غيّر كلمة المرور فوراً أو عدّل `UniversitySeeder` قبل النشر.

---

## 5. ماذا يُنشئ الـ Seed؟

| Seeder | المحتوى |
|--------|---------|
| `RolesSeeder` | أدوار: admin, student, supervisor, super_admin |
| `UniversitySeeder` | جامعة Legacy + Test University B + حساب Super Admin |

---

## 6. إنشاء مستخدمين آخرين

| الدور | الطريقة |
|-------|---------|
| **طالب / مشرف** | التسجيل من الواجهة → انتظار موافقة مدير الجامعة |
| **مدير جامعة (Admin)** | Super Admin ينشئه من Platform Users، أو يُسجّل كـ admin ويوافق عليه |
| **Super Admin إضافي** | يدوياً في DB أو توسيع Seeder |

---

## 7. استكشاف الأخطاء

### لا يوجد حساب Super Admin في قاعدة البيانات

```bash
cd "backend last"
php artisan db:seed
```

أو إعادة بناء كاملة (تحذير: يحذف كل البيانات):

```bash
php artisan migrate:fresh --seed
```

### لا أستطيع تسجيل الدخول

- تأكد أن `php artisan serve` يعمل
- تأكد `VITE_API_BASE_URL` في frontend يطابق عنوان الـ API
- تحقق من جدول `users` — يجب أن يكون `status = active`

### خطأ اتصال MySQL

- تأكد أن MySQL يعمل
- راجع `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` في `.env`

### CORS / Network error من المتصفح

- تأكد `FRONTEND_URL=http://localhost:5173` في `backend last/.env`
- أعد تشغيل `php artisan serve` بعد تعديل `.env`

### ميزات AI لا تعمل

- أضف `GEMINI_API_KEY` صالحاً في `.env`
- بدون المفتاح: باقي النظام يعمل، AI فقط يعطي خطأ

---

## 8. أوامر مفيدة

```bash
# Backend
php artisan migrate:status
php artisan route:list
php artisan test

# Frontend
npm run build
npm run lint
```

---

## ملخص سريع (نسخ ولصق)

```bash
# MySQL: CREATE DATABASE pms;

cd "backend last"
composer install && copy .env.example .env
php artisan key:generate
# عدّل .env (DB_*)
php artisan migrate --seed
php artisan storage:link
php artisan serve

# terminal آخر
cd frontend
npm install && copy .env.example .env
npm run dev
```

**دخول:** `superadmin@pms.local` / `password` → `http://localhost:5173`
